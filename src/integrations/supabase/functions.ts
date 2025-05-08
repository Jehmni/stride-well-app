
// Direct implementation of RPC functions with proper exports
import { createClient } from '@supabase/supabase-js';
import { 
  ExerciseProgressHistoryParams, 
  TopExercisesParams, 
  UserExerciseCountsParams, 
  LogExerciseCompletionParams 
} from '@/types/rpc';
import { supabase } from './client';

// Get exercise progress history
export const getExerciseProgressHistoryRPC = async (params: ExerciseProgressHistoryParams) => {
  try {
    console.log('Fetching exercise progress history with params:', params);
    return await supabase.rpc('get_exercise_progress_history', params);
  } catch (error) {
    console.error('Error getting exercise progress history:', error);
    throw error;
  }
};

// Get top exercises by count
export const getTopExercisesRPC = async (params: TopExercisesParams) => {
  try {
    console.log('Fetching top exercises with params:', params);
    return await supabase.rpc('get_top_exercises', params);
  } catch (error) {
    console.error('Error getting top exercises:', error);
    throw error;
  }
};

// Get user exercise counts
export const getUserExerciseCountsRPC = async (params: UserExerciseCountsParams) => {
  try {
    console.log('Fetching user exercise counts with params:', params);
    return await supabase.rpc('get_user_exercise_counts', params);
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
    
    const response = await supabase.rpc('log_exercise_completion', params);
    
    if (response.error) {
      console.error('RPC error logging exercise completion:', response.error);
      throw new Error(`RPC error: ${response.error.message || 'Unknown error'}`);
    }
    
    console.log('Exercise log success response:', response.data);
    return response;
  } catch (error) {
    console.error('Error logging exercise completion:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to log exercise: ${error.message}`);
    } else {
      throw new Error('Failed to log exercise: Unknown error');
    }
  }
};
