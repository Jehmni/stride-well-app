import React, { useState, useEffect } from "react";
import { Calendar, Award, Clock, Dumbbell, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutLog, Workout, WorkoutExercise } from "@/models/models";
import { format, parseISO, subDays } from "date-fns";

interface CompletedExercise {
  id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  };
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  notes: string | null;
  completed_at: string;
}

// Extended WorkoutLog interface to include completed exercises
interface ExtendedWorkoutLog extends WorkoutLog {
  completed_exercises?: CompletedExercise[];
}

const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<ExtendedWorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkoutLogs = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout logs for the user, including both planned exercises and completed exercises
        const { data, error } = await supabase
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
                  id,
                  name,
                  muscle_group
                )
              )
            ),
            completed_exercises:exercise_logs(
              id,
              sets_completed,
              reps_completed,
              weight_used,
              notes,
              completed_at,
              exercise:exercises(
                id,
                name,
                muscle_group
              )
            )
          `)
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .limit(20);
          
        if (error) throw error;

        // Filter out logs where workout relation failed or is null
        const validLogs: ExtendedWorkoutLog[] = [];
        for (const log of data || []) {
          // Check if workout exists, is an object, and doesn't have an error property
          if ((log.workout !== null && 
              log.workout !== undefined && 
              typeof log.workout === 'object' && 
              !('error' in (log.workout as Record<string, any>))) ||
              // Or if it has completed exercises
              (log.completed_exercises && 
               log.completed_exercises.length > 0)) {
            validLogs.push(log as ExtendedWorkoutLog);
          }
        }
        
        setWorkoutLogs(validLogs);
      } catch (error) {
        console.error("Error fetching workout logs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkoutLogs();
  }, [user?.id]);

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  // Format the date to a more readable form
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM d, yyyy • h:mm a");
    } catch (error) {
      return dateString;
    }
  };

  // Get relative day (Today, Yesterday, or the date)
  const getRelativeDay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      const yesterday = subDays(today, 1);
      
      if (date.toDateString() === today.toDateString()) {
        return "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        return "Yesterday";
      } else {
        return format(date, "MMM d");
      }
    } catch (error) {
      return "";
    }
  };

  // Determine if we have exercise completion data
  const hasCompletedExercises = (log: ExtendedWorkoutLog): boolean => {
    return !!log.completed_exercises && log.completed_exercises.length > 0;
  };

  // Get the count of exercises either from completed_exercises or the workout template
  const getExerciseCount = (log: ExtendedWorkoutLog): number => {
    if (log.completed_exercises && log.completed_exercises.length > 0) {
      return log.completed_exercises.length;
    }
    return log.workout?.exercises ? log.workout.exercises.length : 0;
  };

  // Get workout name or fallback
  const getWorkoutName = (log: ExtendedWorkoutLog): string => {
    return log.workout?.name || "Custom Workout";
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Dumbbell className="animate-spin h-6 w-6 mr-2" />
        <span>Loading workout history...</span>
      </div>
    );
  }

  // Empty state
  if (workoutLogs.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold">Workout History</h3>
        <Button variant="outline" size="sm">
          Export Data
        </Button>
      </div>

      {workoutLogs.map((log) => (
        <Card key={log.id} className="overflow-hidden">
          <CardHeader className="p-4 pb-3 cursor-pointer" onClick={() => toggleExpand(log.id)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="h-4 w-4 mr-2 text-fitness-primary" />
                  <span className="font-medium">{getRelativeDay(log.completed_at)}</span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-gray-500 text-sm">{formatDate(log.completed_at)}</span>
                </div>
                <h4 className="text-lg font-medium mt-1">
                  {getWorkoutName(log)}
                </h4>
              </div>
              <div className="flex items-center">
                <Badge className="mr-2">
                  {getExerciseCount(log)} exercises
                </Badge>
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
                {/* Show completed exercises if available */}
                {hasCompletedExercises(log) ? (
                  log.completed_exercises!.map((exercise) => (
                    <div 
                      key={exercise.id} 
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                            <h6 className="font-medium">{exercise.exercise?.name}</h6>
                          </div>
                          <div className="text-xs text-gray-500 ml-6">
                            {exercise.exercise?.muscle_group}
                          </div>
                        </div>
                        <div className="text-sm">
                          {exercise.sets_completed} sets 
                          {exercise.reps_completed ? ` × ${exercise.reps_completed} reps` : ''}
                          {exercise.weight_used ? ` @ ${exercise.weight_used}kg` : ''}
                        </div>
                      </div>
                      {exercise.notes && (
                        <div className="mt-2 ml-6 text-xs text-gray-600 dark:text-gray-400 italic">
                          "{exercise.notes}"
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  // Fall back to showing exercises from the workout template
                  log.workout?.exercises && log.workout.exercises.length > 0 ? 
                    log.workout.exercises.map((exercise) => (
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
                            {exercise.sets} sets × {exercise.reps || (exercise.duration ? `${exercise.duration}s` : '–')}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center p-4 text-gray-500">
                        No exercises recorded for this workout.
                      </div>
                    )
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default WorkoutHistory;
