import React from 'react';
import { format, parseISO, subDays } from "date-fns";
import { Calendar, Award, Clock, Dumbbell, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkoutLog, Workout, SelectQueryError } from "@/models/models";

// CompletedExercise interface matches the one from WorkoutHistory
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

// Safe workout log type that handles potential error states
export type SafeWorkoutLog = Omit<WorkoutLog, "workout"> & {
  workout?: Workout | null | SelectQueryError;
};

// Extended WorkoutLog interface to include completed exercises
export interface ExtendedWorkoutLog extends SafeWorkoutLog {
  completed_exercises?: CompletedExercise[];
  workout_name?: string;
  workout_description?: string;
}

interface WorkoutLogCardProps {
  log: ExtendedWorkoutLog;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const WorkoutLogCard: React.FC<WorkoutLogCardProps> = ({ 
  log, 
  isExpanded, 
  onToggleExpand 
}) => {
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
  const hasCompletedExercises = (): boolean => {
    return !!log.completed_exercises && log.completed_exercises.length > 0;
  };

  // Determine if this is a custom workout or a completed workout
  const isCompletedWorkout = (): boolean => {
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
    
    // Check if there's a valid workout record with a name
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.name) {
      return true;
    }
    
    // Fall back to heuristic check based on completed exercises
    return hasCompletedExercises();
  };

  // Get the workout name to display in the UI
  const getWorkoutDisplayName = (): string => {
    // First check for workout_name directly on the log (from the database)
    if (log.workout_name) {
      return log.workout_name;
    }
    
    // Then check if there's a related workout with a name
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.name) {
      return log.workout.name;
    }
    
    // Finally fallback based on the workout type
    return isCompletedWorkout() ? "Completed Workout" : "Your Custom Workout";
  };
  
  // Get the count of exercises either from completed_exercises or the workout template
  const getExerciseCount = (): number => {
    if (log.completed_exercises && log.completed_exercises.length > 0) {
      return log.completed_exercises.length;
    }
    
    // Make sure workout exists and is not an error object
    if (log.workout && typeof log.workout === "object" && !("error" in log.workout) && log.workout.exercises) {
      return log.workout.exercises.length;
    }
    
    return 0;
  };

  return (
    <Card key={log.id} className="overflow-hidden touch-manipulation">
      <CardHeader className="p-3 sm:p-4 pb-2 sm:pb-3 cursor-pointer" onClick={onToggleExpand}>
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-600 dark:text-gray-400 gap-1 sm:gap-0">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-fitness-primary flex-shrink-0" />
                <span className="font-medium">{getRelativeDay(log.completed_at)}</span>
              </div>
              <span className="hidden sm:inline mx-2 text-gray-400">•</span>
              <span className="text-gray-500 text-xs sm:text-sm truncate">{formatDate(log.completed_at)}</span>
            </div>
            <h4 className="text-base sm:text-lg font-medium mt-1 line-clamp-2">
              {getWorkoutDisplayName()}
            </h4>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
            <Badge className="text-xs px-2 py-1">
              {getExerciseCount()} exercises
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 mb-1 text-fitness-primary" />
              <span className="text-xs sm:text-sm text-gray-500">Duration</span>
              <span className="font-medium text-xs sm:text-base">{log.duration || "–"} min</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 mb-1 text-fitness-primary" />
              <span className="text-xs sm:text-sm text-gray-500">Calories</span>
              <span className="font-medium text-xs sm:text-base">{log.calories_burned || "–"}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Dumbbell className="h-4 w-4 sm:h-5 sm:w-5 mb-1 text-fitness-primary" />
              <span className="text-xs sm:text-sm text-gray-500">Rating</span>
              <span className="font-medium text-xs sm:text-base">{log.rating ? `${log.rating}/5` : "–"}</span>
            </div>
          </div>
          
          {log.notes && (
            <div className="mb-3 sm:mb-4">
              <h5 className="text-xs sm:text-sm font-medium mb-1">Notes</h5>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {log.notes}
              </p>
            </div>
          )}
          
          <h5 className="text-xs sm:text-sm font-medium mb-2">Exercises</h5>
          <div className="space-y-2">
            {/* Show completed exercises if available */}
            {hasCompletedExercises() ? (
              log.completed_exercises!.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-green-500"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start sm:items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <h6 className="font-medium text-sm sm:text-base line-clamp-2">{exercise.exercise?.name || "Unknown Exercise"}</h6>
                      </div>
                      <div className="text-xs text-gray-500 ml-5 sm:ml-6">
                        {exercise.exercise?.muscle_group || ""}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 ml-5 sm:ml-0">
                      {exercise.sets_completed} sets 
                      {exercise.reps_completed ? ` × ${exercise.reps_completed} reps` : ""}
                      {exercise.weight_used ? ` @ ${exercise.weight_used}kg` : ""}
                    </div>
                  </div>
                  {exercise.notes && (
                    <div className="mt-2 ml-5 sm:ml-6 text-xs text-gray-600 dark:text-gray-400 italic">
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
                    className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h6 className="font-medium text-sm sm:text-base line-clamp-2">{exercise.exercise?.name}</h6>
                        <div className="text-xs text-gray-500">
                          {exercise.exercise?.muscle_group}
                        </div>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {exercise.sets} sets × {exercise.reps || (exercise.duration ? `${exercise.duration}s` : "–")}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center p-3 sm:p-4 text-gray-500 text-sm">
                    No exercises recorded for this workout.
                  </div>
                )
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default WorkoutLogCard;
