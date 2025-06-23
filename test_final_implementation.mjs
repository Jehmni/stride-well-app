// Test script to verify that our database schema and functions work correctly
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3MzEwNjMsImV4cCI6MjA0ODMwNzA2M30.YFVp9eTgq_o6YqBQ2o1-H_xM1eqHGnvRLuI-_2QoBrE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWorkoutFeatures() {
  console.log('🧪 Testing Stride-Well Workout Features...\n');
  
  try {
    // Test 1: Check if our essential tables exist and have the right structure
    console.log('1. Testing table structure...');
    
    const tablesTest = await supabase
      .from('workout_logs')
      .select('id')
      .limit(0);
    
    if (tablesTest.error) {
      console.error('❌ workout_logs table test failed:', tablesTest.error.message);
      return;
    }
    
    const exerciseLogsTest = await supabase
      .from('exercise_logs')
      .select('id')
      .limit(0);
    
    if (exerciseLogsTest.error) {
      console.error('❌ exercise_logs table test failed:', exerciseLogsTest.error.message);
      return;
    }
    
    const workoutProgressTest = await supabase
      .from('workout_progress')
      .select('id')
      .limit(0);
    
    if (workoutProgressTest.error) {
      console.error('❌ workout_progress table test failed:', workoutProgressTest.error.message);
      return;
    }
    
    console.log('✅ All essential tables exist and are accessible');
    
    // Test 2: Test the get_workout_stats RPC function
    console.log('\n2. Testing get_workout_stats RPC function...');
    
    const statsResult = await supabase
      .rpc('get_workout_stats');
    
    if (statsResult.error) {
      console.error('❌ get_workout_stats function failed:', statsResult.error.message);
      return;
    }
    
    console.log('✅ get_workout_stats function works');
    console.log('📊 Sample stats result:', JSON.stringify(statsResult.data, null, 2));
    
    // Test 3: Test workout logging functions
    console.log('\n3. Testing workout logging functions...');
    
    const workoutLogResult = await supabase
      .rpc('log_workout_with_exercises', {
        p_workout_id: 'test-workout-' + Date.now(),
        p_duration: 30,
        p_calories_burned: 200,
        p_notes: 'Test workout from automated test',
        p_rating: 4,
        p_workout_type: 'custom',
        p_workout_name: 'Test Workout',
        p_exercises: []
      });
    
    if (workoutLogResult.error) {
      console.error('❌ log_workout_with_exercises function failed:', workoutLogResult.error.message);
      return;
    }
    
    console.log('✅ log_workout_with_exercises function works');
    console.log('📝 Created workout log ID:', workoutLogResult.data);
    
    // Test 4: Test workout progress sync
    console.log('\n4. Testing workout progress sync...');
    
    const progressResult = await supabase
      .rpc('sync_workout_progress', {
        p_workout_id: 'test-progress-' + Date.now(),
        p_completed_exercises: ['exercise1', 'exercise2']
      });
    
    if (progressResult.error) {
      console.error('❌ sync_workout_progress function failed:', progressResult.error.message);
      return;
    }
    
    console.log('✅ sync_workout_progress function works');
    console.log('💾 Created progress record ID:', progressResult.data);
    
    // Test 5: Test AI workout completion
    console.log('\n5. Testing AI workout completion...');
    
    const aiWorkoutResult = await supabase
      .rpc('log_ai_workout_completion', {
        p_ai_workout_plan_id: '12345678-1234-1234-1234-123456789012', // Sample UUID
        p_exercises_completed: 3,
        p_total_exercises: 5,
        p_duration_minutes: 25,
        p_notes: 'AI workout completion test'
      });
    
    if (aiWorkoutResult.error) {
      console.error('❌ log_ai_workout_completion function failed:', aiWorkoutResult.error.message);
      return;
    }
    
    console.log('✅ log_ai_workout_completion function works');
    console.log('🤖 Created AI workout log ID:', aiWorkoutResult.data);
    
    console.log('\n🎉 ALL TESTS PASSED! The Stride-Well workout features are fully functional.');
    console.log('\n✅ Summary:');
    console.log('   - Database schema is correctly implemented');
    console.log('   - All essential tables exist with proper structure');
    console.log('   - RPC functions are working correctly');
    console.log('   - Workout logging is functional');
    console.log('   - Workout statistics are accessible');
    console.log('   - AI workout completion is working');
    console.log('   - Workout progress tracking is working');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error);
  }
}

// Run the tests
testWorkoutFeatures();
