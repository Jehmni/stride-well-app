
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
