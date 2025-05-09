// filepath: c:\Users\ofone\Documents\JEHMNi\Portfolio\stride-well-app\src\components\progress\WorkoutHistory.tsx
import React, { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import WorkoutLogCard, { ExtendedWorkoutLog } from "@/components/workout/WorkoutLogCard";

// Define the completed exercise type
interface CompletedExercise {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  notes: string | null;
  completed_at: string;
  exercise: {
    id: string;
    name: string;
    muscle_group: string;
  } | null;
}

// Define a type that can represent either a workout log or a query error
type WorkoutLogResult = WorkoutLog | SelectQueryError;

// Safe workout log type that handles potential error states
type SafeWorkoutLog = Omit<WorkoutLog, "workout"> & {
  workout?: Workout | null | SelectQueryError;
};

// Extended WorkoutLog interface to include completed exercises
interface ExtendedWorkoutLog extends SafeWorkoutLog {
  completed_exercises?: CompletedExercise[];
  workout_name?: string;
  workout_description?: string;
}

// Type guard to check if an object is a valid WorkoutLog (not an error)
function isValidWorkoutLog(log: any): log is SafeWorkoutLog {
  return log !== null && 
         typeof log === "object" && 
         !("error" in log) &&
         "id" in log && 
         typeof log.id === "string";
}

const WorkoutHistory: React.FC = () => {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<ExtendedWorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<string | null>(null);

  // Function to fetch workout logs
  const fetchWorkoutLogs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching workout logs for user:", user.id);
      
      // Fetch workout logs for the user
        const { data: rawWorkoutsData, error: workoutsError } = await supabase
          .from("workout_logs")
          .select(`
            id,
            user_id,
            workout_id,
            completed_at,
            duration,
            calories_burned,
            notes,
            rating,
            workout_type,
            is_custom,
            workout_name,
            workout_description,
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
            )
          `)
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(20);
          
        if (workoutsError) throw workoutsError;
        
        // Safety check and type narrowing
        if (!rawWorkoutsData) {
          throw new Error("No workout data returned");
        }
        
        // Filter out null or invalid entries and extract workout log IDs
        const workoutsData = rawWorkoutsData
          .filter(log => isValidWorkoutLog(log))
          .map(log => log as SafeWorkoutLog);
        const workoutLogIds: string[] = workoutsData.map(log => log.id);
        
        // Initialize map to store completed exercises by workout log ID
        let completedExercises: Record<string, CompletedExercise[]> = {};
        
        if (workoutLogIds.length > 0) {
          try {
            // Fetch all exercise logs in batches since we can"t use IN with too many IDs
            let allExerciseLogs: CompletedExercise[] = [];
            
            // Process in batches of 10 to avoid query size limits
            for (let i = 0; i < workoutLogIds.length; i += 10) {
              const batchIds = workoutLogIds.slice(i, i + 10);
              console.log(`Fetching exercise logs batch ${i/10 + 1}, IDs:`, batchIds);
              
              const { data: batchExerciseLogs, error: batchError } = await supabase
                .from("exercise_logs")
                .select(`
                  id,
                  workout_log_id,
                  exercise_id,
                  sets_completed,
                  reps_completed,
                  weight_used,
                  notes,
                  completed_at,
                  exercise:exercises (
                    id,
                    name,
                    muscle_group
                  )
                `)
                .in("workout_log_id", batchIds);
                
              if (batchError) {
                console.error(`Error fetching exercise logs batch ${i/10 + 1}:`, batchError);
              } else if (batchExerciseLogs) {
                console.log(`Retrieved ${batchExerciseLogs.length} exercise logs for batch ${i/10 + 1}`);
                allExerciseLogs = [...allExerciseLogs, ...batchExerciseLogs];
              }
            }
            
            if (allExerciseLogs.length > 0) {
              console.log("Raw exercise logs data:", allExerciseLogs);
              
              // Group exercise logs by workout_log_id
              completedExercises = allExerciseLogs.reduce((acc: Record<string, CompletedExercise[]>, item) => {
                const workout_log_id = item.workout_log_id;
                if (!acc[workout_log_id]) {
                  acc[workout_log_id] = [];
                }
                acc[workout_log_id].push(item);
                return acc;
              }, {});
              
              console.log("Completed exercises data:", completedExercises);
            }
          } catch (error) {
            console.error("Error fetching exercise logs:", error);
          }
        }
        
        // Combine workout logs with their completed exercises
        const validLogs: ExtendedWorkoutLog[] = workoutsData.map(log => ({
          ...log,
          completed_exercises: completedExercises[log.id] || []
        }));
        
        console.log("Final workout logs with exercises:", validLogs);
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
  
  const runDiagnostics = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Import the diagnostic tool (dynamic import to avoid loading unless needed)
      const diagnosticModule = await import('@/utils/diagnosticTools');
      
      // Run diagnostics
      const results = await diagnosticModule.diagnoseWorkoutLogs(user.id);
      setDiagnosticData(results);
      
      // Refresh the data (this will re-run the useEffect)
      setIsLoading(true); // Force a refresh
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsLoading(false);
    }
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

  // Determine if this is a custom workout or a completed workout
  const isCompletedWorkout = (log: ExtendedWorkoutLog): boolean => {
    // Check explicit workout_type first, if available
    if ("workout_type" in log && log.workout_type === "completed") {
      return true;
    }
    if ("workout_type" in log && log.workout_type === "custom") {
      return false;
    }
    if ("is_custom" in log && typeof log.is_custom === "boolean") {
      return !log.is_custom;
    }
    
    // Check if there"s a valid workout record with a name
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.name) {
      return true;
    }
    
    // Fall back to heuristic check based on completed exercises
    return hasCompletedExercises(log);
  };

  // Get the workout name to display in the UI
  const getWorkoutDisplayName = (log: ExtendedWorkoutLog): string => {
    // First check for workout_name directly on the log (from the database)
    if (log.workout_name) {
      return log.workout_name;
    }
    
    // Then check if there"s a related workout with a name
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.name) {
      return log.workout.name;
    }
    
    // Finally fallback based on the workout type
    return isCompletedWorkout(log) ? "Completed Workout" : "Your Custom Workout";
  };
  
  // Get the count of exercises either from completed_exercises or the workout template
  const getExerciseCount = (log: ExtendedWorkoutLog): number => {
    if (log.completed_exercises && log.completed_exercises.length > 0) {
      return log.completed_exercises.length;
    }
    
    // Make sure workout exists and is not an error object
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.exercises) {
      return log.workout.exercises.length;
    }
    
    return 0;
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
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <Dumbbell className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No workout history yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Complete your first workout to start tracking your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold">Workout History</h3>
        <div className="flex space-x-2">
          {import.meta.env.DEV && (
            <Button variant="outline" size="sm" onClick={runDiagnostics}>
              Debug
            </Button>
          )}
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Diagnostic output for debugging */}
      {diagnosticData && import.meta.env.DEV && (
        <div className="bg-muted p-4 rounded-md mb-4 text-xs overflow-auto max-h-60">
          <pre className="whitespace-pre-wrap">{diagnosticData}</pre>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2" 
            onClick={() => setDiagnosticData(null)}
          >
            Hide
          </Button>
        </div>
      )}

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
                  {getWorkoutDisplayName(log)}
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
                  <span className="font-medium">{log.duration || "–"} min</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Award className="h-5 w-5 mb-1 text-fitness-primary" />
                  <span className="text-sm text-gray-500">Calories</span>
                  <span className="font-medium">{log.calories_burned || "–"}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Dumbbell className="h-5 w-5 mb-1 text-fitness-primary" />
                  <span className="text-sm text-gray-500">Rating</span>
                  <span className="font-medium">{log.rating ? `${log.rating}/5` : "–"}</span>
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
                            <h6 className="font-medium">{exercise.exercise?.name || "Unknown Exercise"}</h6>
                          </div>
                          <div className="text-xs text-gray-500 ml-6">
                            {exercise.exercise?.muscle_group || ""}
                          </div>
                        </div>
                        <div className="text-sm">
                          {exercise.sets_completed} sets 
                          {exercise.reps_completed ? ` × ${exercise.reps_completed} reps` : ""}
                          {exercise.weight_used ? ` @ ${exercise.weight_used}kg` : ""}
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
                  log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.exercises && log.workout.exercises.length > 0 ? 
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
                            {exercise.sets} sets × {exercise.reps || (exercise.duration ? `${exercise.duration}s` : "–")}
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
