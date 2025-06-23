// Simple wrapper functions for Supabase RPC calls
import { createClient } from '@supabase/supabase-js';
import { ExerciseProgressHistoryParams, TopExercisesParams, UserExerciseCountsParams, LogExerciseCompletionParams } from '@/types/rpc';

// Use environment variables for production configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase environment variables in rpcFunctions.ts');
}

// Create a direct client for RPC calls - this ensures we have a valid connection
// that doesn't depend on any global configuration
const rpcClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Execute SQL statements
export const execSqlRPC = async (sql: string) => {
  try {
    return await rpcClient.rpc('exec_sql', { sql });
  } catch (error) {
    console.error('Error executing SQL:', error);
    throw error;
  }
};

// Get exercise progress history
export const getExerciseProgressHistoryRPC = async (params: ExerciseProgressHistoryParams) => {
  try {
    return await rpcClient.rpc('get_exercise_progress_history', params);
  } catch (error) {
    console.error('Error getting exercise progress history:', error);
    throw error;
  }
};

// Get top exercises by count
export const getTopExercisesRPC = async (params: TopExercisesParams) => {
  try {
    return await rpcClient.rpc('get_top_exercises', params);
  } catch (error) {
    console.error('Error getting top exercises:', error);
    throw error;
  }
};

// Get user exercise counts
export const getUserExerciseCountsRPC = async (params: UserExerciseCountsParams) => {
  try {
    return await rpcClient.rpc('get_user_exercise_counts', params);
  } catch (error) {
    console.error('Error getting user exercise counts:', error);
    throw error;
  }
};

// Log exercise completion
export const logExerciseCompletionRPC = async (params: LogExerciseCompletionParams) => {
  try {
    return await rpcClient.rpc('log_exercise_completion', params);
  } catch (error) {
    console.error('Error logging exercise completion:', error);
    throw error;
  }
};
