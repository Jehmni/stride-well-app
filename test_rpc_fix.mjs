import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAIWorkoutRPC() {
  console.log('🧪 Testing get_ai_workout_plans RPC function...');
  
  // First get a user ID from workout_plans
  const { data: workoutData, error: workoutError } = await supabase
    .from('workout_plans')
    .select('user_id')
    .eq('ai_generated', true)
    .limit(1);
    
  if (workoutError || !workoutData?.length) {
    console.log('No AI workout plans found, creating test with mock user ID');
    
    // Test with a mock UUID
    const { data, error } = await supabase.rpc('get_ai_workout_plans', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      console.error('❌ RPC call failed:', error);
    } else {
      console.log('✅ RPC call successful (empty result expected):', data);
    }
    
    return;
  }
  
  const userId = workoutData[0].user_id;
  console.log('📋 Testing with real user ID:', userId);
  
  const { data, error } = await supabase.rpc('get_ai_workout_plans', {
    p_user_id: userId
  });
  
  if (error) {
    console.error('❌ RPC call failed:', error);
  } else {
    console.log('✅ RPC call successful, found', data?.length || 0, 'AI workout plans');
    if (data?.length) {
      console.log('📄 First plan:', {
        id: data[0].id,
        title: data[0].title,
        fitness_goal: data[0].fitness_goal,
        completion_count: data[0].completion_count
      });
    }
  }
}

testAIWorkoutRPC().catch(console.error);
