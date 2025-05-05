// RPC function typings for Supabase
import { rpcFunctions } from './typedClient';
import { ExerciseProgressHistoryParams, TopExercisesParams, UserExerciseCountsParams, LogExerciseCompletionParams } from '@/types/rpc';

// Export the typed RPC functions with a simpler API
export const execSqlRPC = (sql: string) => rpcFunctions.execSql(sql);

export const getExerciseProgressHistoryRPC = (params: ExerciseProgressHistoryParams) => 
  rpcFunctions.getExerciseProgressHistory(params);

export const getTopExercisesRPC = (params: TopExercisesParams) => 
  rpcFunctions.getTopExercises(params);

export const getUserExerciseCountsRPC = (params: UserExerciseCountsParams) => 
  rpcFunctions.getUserExerciseCounts(params);

export const logExerciseCompletionRPC = (params: LogExerciseCompletionParams) => 
  rpcFunctions.logExerciseCompletion(params);
