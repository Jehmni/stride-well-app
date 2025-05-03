
import React, { useState, useEffect } from "react";
import { Calendar, Award, Clock, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutLog } from "@/models/models";
import { format, parseISO, subDays } from "date-fns";

const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout logs for the user
        const { data: logs, error } = await supabase
          .from('workout_logs')
          .select(`
            *,
            workout:workouts(
              id, 
              name, 
              description,
              exercises:workout_exercises(
                id, 
                sets,
                reps,
                duration,
                rest_time,
                exercise:exercises(
                  name,
                  muscle_group
                )
              )
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;
        
        setWorkoutLogs(logs || []);
      } catch (error) {
        console.error("Error fetching workout logs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutLogs();
  }, [user?.id]);

  const toggleExpand = (logId: string) => {
    if (expandedLog === logId) {
      setExpandedLog(null);
    } else {
      setExpandedLog(logId);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy \'at\' h:mm a');
    } catch (e) {
      return "Invalid date";
    }
  };
  
  // Helper to get day name
  const getRelativeDay = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const yesterday = subDays(today, 1);
      
      if (format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
        return "Today";
      } else if (format(date, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
        return "Yesterday";
      } else {
        return format(date, 'EEEE'); // Day name
      }
    } catch (e) {
      return "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Recent Workouts</h3>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading workout history...</span>
        </div>
      ) : workoutLogs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium mb-2">No Workouts Yet</h4>
            <p className="text-gray-500 mb-4">
              You haven't completed any workouts yet. Start working out to track your progress.
            </p>
            <Button>Schedule a Workout</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {workoutLogs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardHeader className="p-4 bg-gray-50 dark:bg-gray-800">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpand(log.id)}
                >
                  <div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-fitness-primary" />
                      <span className="font-medium">{getRelativeDay(log.completed_at)}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-500 text-sm">{formatDate(log.completed_at)}</span>
                    </div>
                    <h4 className="text-lg font-medium mt-1">
                      {log.workout?.name || "Workout"}
                    </h4>
                  </div>
                  <div className="flex items-center">
                    <Badge className="mr-2">{log.workout?.exercises?.length || 0} exercises</Badge>
                    {expandedLog === log.id ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedLog === log.id && (
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Clock className="h-5 w-5 mb-1 text-fitness-primary" />
                      <span className="text-sm text-gray-500">Duration</span>
                      <span className="font-medium">{log.duration || '–'} min</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Award className="h-5 w-5 mb-1 text-fitness-primary" />
                      <span className="text-sm text-gray-500">Calories</span>
                      <span className="font-medium">{log.calories_burned || '–'}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Dumbbell className="h-5 w-5 mb-1 text-fitness-primary" />
                      <span className="text-sm text-gray-500">Rating</span>
                      <span className="font-medium">{log.rating ? `${log.rating}/5` : '–'}</span>
                    </div>
                  </div>
                  
                  {log.notes && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium mb-1">Notes</h5>
                      <p className="text-gray-600 dark:text-gray-400 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        {log.notes}
                      </p>
                    </div>
                  )}
                  
                  <h5 className="text-sm font-medium mb-2">Exercises</h5>
                  <div className="space-y-2">
                    {log.workout?.exercises?.map((exercise, index) => (
                      <div 
                        key={exercise.id} 
                        className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h6 className="font-medium">{exercise.exercise?.name}</h6>
                            <div className="text-xs text-gray-500">
                              {exercise.exercise?.muscle_group}
                            </div>
                          </div>
                          <div className="text-sm">
                            {exercise.sets} sets × {exercise.reps || exercise.duration ? `${exercise.duration}s` : '–'}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {(!log.workout?.exercises || log.workout.exercises.length === 0) && (
                      <div className="text-gray-500 text-sm">No exercise details available</div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;
