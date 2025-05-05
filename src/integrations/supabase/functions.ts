// Direct implementation of RPC functions with proper exports
import { createClient } from '@supabase/supabase-js';
import { 
  ExerciseProgressHistoryParams, 
  TopExercisesParams, 
  UserExerciseCountsParams, 
  LogExerciseCompletionParams 
} from '@/types/rpc';

// Hard-coded values for production use
const SUPABASE_URL = "https://japrzutwtqotzyudnizh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHJ6dXR3dHFvdHp5dWRuaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjYyMjgsImV4cCI6MjA2MDI0MjIyOH0.wFQPzwhwMzgu3P2fnqqH2Hw0RD5IDA5hF2bcwHVlLe0";

// Create a direct client for RPC calls
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
