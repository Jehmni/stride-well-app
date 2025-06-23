// Direct implementation of RPC functions with proper exports
import { createClient } from '@supabase/supabase-js';
// Temporarily using any types to avoid import issues
// import { 
//   ExerciseProgressHistoryParams, 
//   TopExercisesParams, 
//   UserExerciseCountsParams, 
//   LogExerciseCompletionParams,
//   SyncWorkoutProgressParams,
//   LinkAIWorkoutToLogParams,
//   CompleteWorkoutParams,
//   LogWorkoutWithExercisesParams
// } from '@/types/rpc';
import { supabase } from './client';

// Temporary type definitions to avoid import issues
type ExerciseProgressHistoryParams = { user_id_param: string; exercise_id_param: string; limit_param: number };
type TopExercisesParams = { user_id_param: string; limit_param: number };
type UserExerciseCountsParams = { user_id_param: string };
type LogExerciseCompletionParams = { workout_log_id_param: string; exercise_id_param: string; sets_completed_param: number; reps_completed_param: number | null; weight_used_param: number | null; notes_param: string | null };
type SyncWorkoutProgressParams = { user_id_param: string; workout_id_param: string; completed_exercises_param: string[] };
type LinkAIWorkoutToLogParams = { workout_plan_id_param: string; workout_log_id_param: string };
type CompleteWorkoutParams = { workout_id_param: string; user_id_param: string; duration_param?: number; calories_param?: number; notes_param?: string; is_ai_workout_param?: boolean; ai_workout_plan_id_param?: string };
type LogWorkoutWithExercisesParams = { workout_id_param: string; user_id_param: string; duration_param: number; calories_param: number; exercise_data_param: any[]; is_ai_workout_param?: boolean; ai_workout_plan_id_param?: string };

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

// Sync workout progress across devices
export const syncWorkoutProgressRPC = async (params: SyncWorkoutProgressParams) => {
  try {
    console.log('Syncing workout progress with params:', params);
    
    // Validate that we have all required parameters
    if (!params.user_id_param || !params.workout_id_param || !params.completed_exercises_param) {
      console.error('Invalid parameters for sync_workout_progress:', params);
      throw new Error('Missing required parameters for workout progress syncing');
    }
    
    const response = await supabase.rpc('sync_workout_progress', params);
    
    if (response.error) {
      console.error('RPC error syncing workout progress:', response.error);
      throw new Error(`RPC error: ${response.error.message || 'Unknown error'}`);
    }
    
    console.log('Workout progress sync success response:', response.data);
    return response;
  } catch (error) {
    console.error('Error syncing workout progress:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to sync workout progress: ${error.message}`);
    } else {
      throw new Error('Failed to sync workout progress: Unknown error');
    }
  }
};

// Link AI workout to log
export const linkAIWorkoutToLogRPC = async (
  workoutPlanId: string,
  workoutLogId: string
): Promise<boolean> => {
  try {
    const params: LinkAIWorkoutToLogParams = {
      workout_plan_id_param: workoutPlanId,
      workout_log_id_param: workoutLogId
    };
    
    console.log('Linking AI workout to log with params:', params);
    
    // Validate that we have all required parameters
    if (!params.workout_plan_id_param || !params.workout_log_id_param) {
      console.error('Invalid parameters for link_ai_workout_to_log:', params);
      throw new Error('Missing required parameters for linking AI workout to log');
    }
      try {
      // Try using the RPC function first
      // Map parameters to match RPC function signature
      const rpcParams = {
        p_workout_log_id: params.workout_log_id_param,
        p_ai_workout_plan_id: params.workout_plan_id_param
      };
      
      const { data, error } = await supabase.rpc('link_ai_workout_to_log', rpcParams);      
      if (error) {
        throw error;
      }
      
      console.log('Successfully linked AI workout plan to log via RPC:', data);
      return true;
    } catch (rpcError) {
      console.warn('RPC call failed, falling back to direct update:', rpcError);
      
      // Use direct update as fallback
      const { data, error } = await supabase
        .from('workout_logs')
        .update({
          ai_workout_plan_id: workoutPlanId,
          is_from_ai_plan: true,
          workout_type: 'ai_generated'
        })
        .eq('id', workoutLogId)
        .select();
      
      if (error) {
        console.error('Error linking AI workout to log:', error);
        return false;
      }
      
      console.log('Successfully linked AI workout plan to log via direct update:', data);
      return true;
    }
  } catch (error) {
    console.error('Exception in linkAIWorkoutToLogRPC:', error);
    return false;
  }
};

/**
 * Complete a workout using the optimized RPC function
 */
export const completeWorkoutRPC = async (params: CompleteWorkoutParams) => {
  try {
    console.log('Completing workout with params:', params);
    
    // Validate that we have all required parameters
    if (!params.workout_id_param || !params.user_id_param) {
      console.error('Invalid parameters for complete_workout:', params);
      throw new Error('Missing required parameters for workout completion');
    }
    
    try {
      // @ts-ignore - RPC function parameters are correct, types need updating
      const response = await supabase.rpc('complete_workout', params);
      
      if (response.error) {
        throw response.error;
      }
      
      console.log('Workout completion success response:', response.data);
      return response.data;    } catch (rpcError) {
      console.warn('RPC call failed, falling back to direct insert:', rpcError);      // @ts-ignore - Using actual database column names, types need updating  
      const insertData = {
        user_id: params.user_id_param,
        workout_id: params.workout_id_param, // TypeScript expects workout_id
        workout_name: 'AI Workout Completion',
        duration: params.duration_param || null, // TypeScript expects duration
        calories_burned: params.calories_param || null,
        notes: params.notes_param || null,
        workout_type: params.is_ai_workout_param ? 'ai_generated' : 'completed',
        completed_at: new Date().toISOString()
      };
      
      // @ts-ignore - Using actual database column names
      const { data, error } = await supabase
        .from('workout_logs')
        .insert(insertData)
        .select('id')
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Workout completion via direct insert:', data);
      return data.id;
    }
  } catch (error) {
    console.error('Error completing workout:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to complete workout: ${error.message}`);
    } else {
      throw new Error('Failed to complete workout: Unknown error');
    }
  }
};

/**
 * Log a workout with exercises in a single transaction
 */
export const logWorkoutWithExercisesRPC = async (params: LogWorkoutWithExercisesParams) => {
  try {
    console.log('Logging workout with exercises:', params);
    
    // Validate that we have all required parameters
    if (!params.workout_id_param || !params.user_id_param || !params.exercise_data_param) {
      console.error('Invalid parameters for log_workout_with_exercises:', params);
      throw new Error('Missing required parameters for workout logging');
    }    try {
      const response = await (supabase.rpc as any)('log_workout_with_exercises', {
        workout_id_param: params.workout_id_param,
        user_id_param: params.user_id_param,
        duration_param: params.duration_param,
        calories_param: params.calories_param,
        exercise_data_param: params.exercise_data_param,
        notes_param: null,
        rating_param: null
      });
      
      if (response.error) {
        throw response.error;
      }
      
      console.log('Workout with exercises logged successfully:', response.data);
      return response.data;
    } catch (rpcError) {
      console.warn('RPC call failed, falling back to manual process:', rpcError);      // Create workout log first
      const workoutLogData = {
        user_id: params.user_id_param,
        workout_id: params.workout_id_param, // TypeScript expects workout_id
        workout_name: 'AI Workout Completion',
        duration: params.duration_param, // TypeScript expects duration
        calories_burned: params.calories_param,
        workout_type: params.is_ai_workout_param ? 'ai_generated' : 'completed',
        completed_at: new Date().toISOString()
      };
        // @ts-ignore - Using actual database column names
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert(workoutLogData)
        .select('id')
        .single();
      
      if (logError) {
        throw logError;
      }
      
      // Log each exercise individually
      const workoutLogId = logData.id;
      
      for (const exercise of params.exercise_data_param) {
        const exerciseLogData = {
          workout_log_id: workoutLogId,
          exercise_id: exercise.exercise_id,
          sets_completed: exercise.sets_completed,
          reps_completed: exercise.reps_completed || null,
          weight_used: exercise.weight_used || null,
          notes: exercise.notes || null
        };
        
        const { error: exerciseError } = await supabase
          .from('exercise_logs')
          .insert(exerciseLogData);
        
        if (exerciseError) {
          console.error('Error logging exercise:', exerciseError);
          // Continue with other exercises even if one fails
        }
      }
      
      console.log('Workout with exercises logged successfully via manual process');
      return workoutLogId;
    }
  } catch (error) {
    console.error('Error logging workout with exercises:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to log workout with exercises: ${error.message}`);
    } else {
      throw new Error('Failed to log workout with exercises: Unknown error');
    }
  }
};
