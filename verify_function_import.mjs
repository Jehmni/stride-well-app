// Test file to verify function imports work correctly
import { getUserExerciseCountsRPC } from '../src/integrations/supabase/functions.ts';

console.log('✅ Function import test successful');
console.log('getUserExerciseCountsRPC type:', typeof getUserExerciseCountsRPC);

// Test that the function can be called (won't actually work without proper context)
if (typeof getUserExerciseCountsRPC === 'function') {
  console.log('✅ getUserExerciseCountsRPC is properly exported as a function');
} else {
  console.log('❌ getUserExerciseCountsRPC is not a function:', getUserExerciseCountsRPC);
}
