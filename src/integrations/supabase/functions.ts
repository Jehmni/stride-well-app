
// Direct implementation of RPC functions with proper exports
import { createClient } from '@supabase/supabase-js';
import { 
  ExerciseProgressHistoryParams, 
  TopExercisesParams, 
  UserExerciseCountsParams, 
  LogExerciseCompletionParams,
  ExerciseProgressHistoryResponse,
  ExerciseCountResponse
} from '@/types/rpc';

// IMPORTANT: This app uses web-hosted Supabase, not local
// These credentials are for the production web Supabase instance
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
    return await rpcClient.rpc<ExerciseProgressHistoryResponse[]>('get_exercise_progress_history', params);
  } catch (error) {
    console.error('Error getting exercise progress history:', error);
    throw error;
  }
};

// Get top exercises by count
export const getTopExercisesRPC = async (params: TopExercisesParams) => {
  try {
    return await rpcClient.rpc<ExerciseCountResponse[]>('get_top_exercises', params);
  } catch (error) {
    console.error('Error getting top exercises:', error);
    throw error;
  }
};

// Get user exercise counts
export const getUserExerciseCountsRPC = async (params: UserExerciseCountsParams) => {
  try {
    return await rpcClient.rpc<ExerciseCountResponse[]>('get_user_exercise_counts', params);
  } catch (error) {
    console.error('Error getting user exercise counts:', error);
    throw error;
  }
};

// Log exercise completion
export const logExerciseCompletionRPC = async (params: LogExerciseCompletionParams) => {
  try {
    console.log('Calling log_exercise_completion with params:', params);
    
    // Validate that we have all required parameters
    if (!params.workout_log_id_param || !params.exercise_id_param || params.sets_completed_param === undefined) {
      console.error('Invalid parameters for log_exercise_completion:', params);
      throw new Error('Missing required parameters for exercise logging');
    }
    
    const response = await rpcClient.rpc('log_exercise_completion', params);
    
    if (response.error) {
      console.error('RPC error logging exercise completion:', response.error);
      // Check for specific error types
      if (response.error.message?.includes('Workout log not found')) {
        throw new Error('Could not find the workout log. Please try again or create a new workout log.');
      } else if (response.error.message?.includes('Not authorized')) {
        throw new Error('Not authorized to log this exercise. Please log in again.');
      } else {
        throw new Error(`RPC error: ${response.error.message || 'Unknown error'}`);
      }
    }
    
    console.log('Exercise log success response:', response.data);
    return response;
  } catch (error) {
    console.error('Error logging exercise completion:', error);
    // Make the error more informative
    if (error instanceof Error) {
      throw new Error(`Failed to log exercise: ${error.message}`);
    } else {
      throw new Error('Failed to log exercise: Unknown error');
    }
  }
};
