import { createClient } from '@supabase/supabase-js';
import { Database } from './types';
import { ExerciseProgressHistoryParams, ExerciseProgressHistoryResponse, TopExercisesParams, UserExerciseCountsParams, ExerciseCountResponse, LogExerciseCompletionParams } from '@/types/rpc';
import { supabase } from './client';

// Use the existing supabase client as the base for our typed client
export const typedSupabaseClient = supabase;

// Custom wrapper functions for RPC calls
export const rpcFunctions = {
  /**
   * Execute SQL statements
   */
  execSql: async (sql: string) => {
    const response = await typedSupabaseClient.rpc('exec_sql' as any, { sql });
    return response;
  },

  /**
   * Get exercise progress history
   */
  getExerciseProgressHistory: async (params: ExerciseProgressHistoryParams) => {
    const response = await typedSupabaseClient.rpc('get_exercise_progress_history' as any, params);
    return {
      ...response,
      data: response.data as ExerciseProgressHistoryResponse[] | null
    };
  },

  /**
   * Get top exercises by usage count
   */
  getTopExercises: async (params: TopExercisesParams) => {
    const response = await typedSupabaseClient.rpc('get_top_exercises' as any, params);
    return {
      ...response,
      data: response.data as ExerciseCountResponse[] | null
    };
  },

  /**
   * Get user exercise counts
   */
  getUserExerciseCounts: async (params: UserExerciseCountsParams) => {
    const response = await typedSupabaseClient.rpc('get_user_exercise_counts' as any, params);
    return {
      ...response,
      data: response.data as ExerciseCountResponse[] | null
    };
  },

  /**
   * Log exercise completion
   */
  logExerciseCompletion: async (params: LogExerciseCompletionParams) => {
    const response = await typedSupabaseClient.rpc('log_exercise_completion' as any, params);
    return {
      ...response,
      data: response.data as string | null
    };
  }
};
