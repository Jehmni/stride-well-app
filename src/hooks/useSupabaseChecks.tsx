
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface SupabaseStatusResult {
  isChecking: boolean;
  hasExerciseLogging: boolean;
  hasAIWorkouts: boolean;
  error: string | null;
}

export const useSupabaseChecks = () => {
  const [status, setStatus] = useState<SupabaseStatusResult>({
    isChecking: true,
    hasExerciseLogging: false,
    hasAIWorkouts: false,
    error: null
  });
  
  useEffect(() => {
    const checkSupabaseFunctions = async () => {
      try {
        // Check if exercise_logs table exists and is accessible
        const { data: exerciseLogs, error: exerciseError } = await supabase
          .from('exercise_logs')
          .select('id')
          .limit(1);
          
        // Check if log_exercise_completion function exists
        const { data: functionData, error: functionError } = await supabase
          .rpc('log_exercise_completion', {
            workout_log_id_param: '00000000-0000-0000-0000-000000000000',
            exercise_id_param: '00000000-0000-0000-0000-000000000000',
            sets_completed_param: 1,
          }).single();
        
        // Check if ai_configurations table exists
        const { data: aiConfig, error: aiError } = await supabase
          .from('ai_configurations')
          .select('id')
          .limit(1);
        
        setStatus({
          isChecking: false,
          hasExerciseLogging: !exerciseError || (exerciseError && !exerciseError.message.includes('does not exist')),
          hasAIWorkouts: !aiError || (aiError && !aiError.message.includes('does not exist')),
          error: null
        });
      } catch (error: any) {
        console.error("Error checking Supabase functions:", error);
        setStatus({
          isChecking: false,
          hasExerciseLogging: false,
          hasAIWorkouts: false,
          error: error.message || "Failed to check database status"
        });
      }
    };
    
    checkSupabaseFunctions();
  }, []);
  
  return status;
};
