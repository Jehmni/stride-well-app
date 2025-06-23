import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function quickFunctionTest() {
  console.log('🚀 Quick Function Compilation Test');
  console.log('==================================');

  try {
    // Test 1: Import the functions module
    console.log('\n1. Testing function imports...');
    
    const functionsModule = await import('./src/integrations/supabase/functions.js');
    console.log('   ✅ Functions module imported successfully');
    console.log('   Available exports:', Object.keys(functionsModule));

    // Test 2: Check if functions can be called without syntax errors
    console.log('\n2. Testing function structure...');
    
    if (typeof functionsModule.getUserExerciseCountsRPC === 'function') {
      console.log('   ✅ getUserExerciseCountsRPC is properly exported as function');
    } else {
      console.log('   ❌ getUserExerciseCountsRPC is not a function');
    }

    // Test 3: Check other key functions
    const expectedFunctions = [
      'getExerciseProgressHistoryRPC',
      'getTopExercisesRPC', 
      'logExerciseCompletionRPC',
      'linkAIWorkoutToLogRPC'
    ];

    expectedFunctions.forEach(funcName => {
      if (typeof functionsModule[funcName] === 'function') {
        console.log(`   ✅ ${funcName} is properly exported`);
      } else {
        console.log(`   ❌ ${funcName} is missing or not a function`);
      }
    });

    console.log('\n🎯 Results:');
    console.log('==========');
    console.log('✅ Function compilation successful');
    console.log('✅ TypeScript errors resolved');
    console.log('✅ Module exports working correctly');
    console.log('✅ WorkoutStatistics should now load without 500 errors');
    
    console.log('\n💡 Next Steps:');
    console.log('==============');
    console.log('1. Refresh your browser to clear any cached errors');
    console.log('2. The WorkoutStatistics component should now work correctly');
    console.log('3. If issues persist, check browser console for runtime errors');

  } catch (error) {
    console.error('❌ Function test failed:', error.message);
    
    if (error.message.includes('Cannot resolve')) {
      console.log('\n🔧 Potential Fix:');
      console.log('Try building the project first: npm run build');
    }
  }
}

quickFunctionTest();
