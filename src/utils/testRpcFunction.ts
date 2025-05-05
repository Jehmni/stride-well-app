// Check if the log_exercise_completion RPC function exists
import { supabase } from '@/integrations/supabase/client';

export const testLogExerciseCompletion = async () => {
  try {
    const { data, error } = await supabase.rpc('log_exercise_completion', {
      workout_log_id_param: '00000000-0000-0000-0000-000000000000', // Invalid UUID for test
      exercise_id_param: '00000000-0000-0000-0000-000000000000',    // Invalid UUID for test
      sets_completed_param: 1,
    });
    
    console.log('RPC response:', { data, error });
    
    if (error) {
      // We expect an error since we're using invalid IDs, but we want to see what kind of error
      if (error.message.includes('Not authorized') || 
          error.message.includes('does not exist') || 
          error.message.includes('violates foreign key constraint')) {
        console.log('🟢 RPC function exists but validation failed as expected');
        return true;
      } else if (error.message.includes('function') && error.message.includes('does not exist')) {
        console.log('🔴 RPC function does not exist');
        return false;
      } else {
        console.log('⚠️ Unexpected error:', error.message);
        return false;
      }
    } else {
      console.log('🟢 RPC function exists and somehow succeeded with test data');
      return true;
    }
  } catch (err) {
    console.error('Failed to test RPC function:', err);
    return false;
  }
};
