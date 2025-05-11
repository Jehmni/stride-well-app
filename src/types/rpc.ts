// RPC Function Type Definitions for Supabase
// Use these types when calling RPC functions to avoid 'any' type assertions

/**
 * Function parameters for get_exercise_progress_history RPC function
 */
export interface ExerciseProgressHistoryParams {
  user_id_param: string;
  exercise_id_param: string;
  limit_param: number;
}

/**
 * Function parameters for log_exercise_completion RPC function
 */
export interface LogExerciseCompletionParams {
  workout_log_id_param: string;
  exercise_id_param: string;
  sets_completed_param: number;
  reps_completed_param: number | null;
  weight_used_param: number | null;
  notes_param: string | null;
}

/**
 * Function parameters for get_user_exercise_counts RPC function
 */
export interface UserExerciseCountsParams {
  user_id_param: string;
}

/**
 * Function parameters for get_top_exercises RPC function
 */
export interface TopExercisesParams {
  user_id_param: string;
  limit_param: number;
}

/**
 * Response type for get_exercise_progress_history RPC function
 */
export interface ExerciseProgressHistoryResponse {
  id: string;
  workout_log_id: string;
  completed_at: string;
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  notes: string | null;
}

/**
 * Response type for get_user_exercise_counts and get_top_exercises RPC functions
 */
export interface ExerciseCountResponse {
  exercise_id: string;
  name: string;
  muscle_group: string;
  count: number;
}

/**
 * Function parameters for sync_workout_progress RPC function
 */
export interface SyncWorkoutProgressParams {
  user_id_param: string;
  workout_id_param: string;
  completed_exercises_param: string[];
}

/**
 * Function parameters for link_ai_workout_to_log RPC function
 */
export interface LinkAIWorkoutToLogParams {
  workout_plan_id_param: string;
  workout_log_id_param: string;
}

/**
 * Function parameters for complete_workout RPC function
 */
export interface CompleteWorkoutParams {
  workout_id_param: string;
  user_id_param: string;
  duration_param?: number;
  calories_param?: number;
  notes_param?: string;
  is_ai_workout_param?: boolean;
  ai_workout_plan_id_param?: string;
}

/**
 * Function parameters for log_workout_with_exercises RPC function
 */
export interface LogWorkoutWithExercisesParams {
  workout_id_param: string;
  user_id_param: string;
  duration_param: number;
  calories_param: number;
  exercise_data_param: ExerciseLogData[];
  is_ai_workout_param?: boolean;
  ai_workout_plan_id_param?: string;
}

/**
 * Exercise log data for the log_workout_with_exercises RPC function
 */
export interface ExerciseLogData {
  exercise_id: string;
  sets_completed: number;
  reps_completed?: number | null;
  weight_used?: number | null;
  notes?: string | null;
}

/**
 * Function parameters for get_ai_workout_plans RPC function
 */
export interface GetAIWorkoutPlansParams {
  user_id_param: string;
  limit_param?: number;
}

/**
 * Response type for get_ai_workout_plans RPC function
 */
export interface AIWorkoutPlanResponse {
  id: string;
  title: string;
  description: string | null;
  fitness_goal: string | null;
  created_at: string;
  completion_count: number;
}
