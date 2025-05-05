// Direct access RPC function implementation for Supabase
import { supabase } from './client';
import { ExerciseProgressHistoryParams, TopExercisesParams, UserExerciseCountsParams, LogExerciseCompletionParams } from '@/types/rpc';

/**
 * Execute SQL statements function
 */
export const execSqlRPC = async (sql: string) => {
  try {
    // Use type assertion to bypass TypeScript's type checking for RPC functions
    return await supabase.rpc('exec_sql', { sql } as any);
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
};

/**
 * Get exercise progress history function
 */
export const getExerciseProgressHistoryRPC = async (params: ExerciseProgressHistoryParams) => {
  try {
    // Use type assertion to bypass TypeScript's type checking for RPC functions
    return await supabase.rpc('get_exercise_progress_history', params as any);
  } catch (error) {
    console.error('Error getting exercise progress history:', error);
    throw error;
  }
};

/**
 * Get top exercises function
 */
export const getTopExercisesRPC = async (params: TopExercisesParams) => {
  try {
    // Use type assertion to bypass TypeScript's type checking for RPC functions
    return await supabase.rpc('get_top_exercises', params as any);
  } catch (error) {
    console.error('Error getting top exercises:', error);
    throw error;
  }
};

/**
 * Get user exercise counts function
 */
export const getUserExerciseCountsRPC = async (params: UserExerciseCountsParams) => {
  try {
    // Use type assertion to bypass TypeScript's type checking for RPC functions
    return await supabase.rpc('get_user_exercise_counts', params as any);
  } catch (error) {
    console.error('Error getting user exercise counts:', error);
    throw error;
  }
};

/**
 * Log exercise completion function
 */
export const logExerciseCompletionRPC = async (params: LogExerciseCompletionParams) => {
  try {
    // Use type assertion to bypass TypeScript's type checking for RPC functions
    return await supabase.rpc('log_exercise_completion', params as any);
  } catch (error) {
    console.error('Error logging exercise completion:', error);
    throw error;
  }
};
