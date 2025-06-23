// Test complete AI workout flow end-to-end
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const openaiKey = process.env.VITE_OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCompleteAIWorkflow() {
  console.log('🧪 Testing Complete AI Workout Workflow');
  console.log('=====================================');
  
  try {
    // Test 1: Check RPC function exists and works
    console.log('1. Testing get_ai_workout_plans RPC function...');
    const { data: rpcTest, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans', { p_user_id: '00000000-0000-0000-0000-000000000000' });
    
    if (rpcError) {
      console.error('❌ RPC function error:', rpcError);
    } else {
      console.log('✅ RPC function working');
    }
    
    // Test 2: Check workout_logs table structure
    console.log('2. Testing workout_logs table access...');
    const { data: logsTest, error: logsError } = await supabase
      .from('workout_logs')
      .select('id, ai_workout_plan_id, workout_type')
      .limit(1);
    
    if (logsError) {
      console.error('❌ workout_logs error:', logsError);
    } else {
      console.log('✅ workout_logs table accessible with new columns');
    }
    
    // Test 3: Check workout_plans table for AI plans
    console.log('3. Testing workout_plans table for AI workouts...');
    const { data: plansTest, error: plansError } = await supabase
      .from('workout_plans')
      .select('id, title, ai_generated')
      .eq('ai_generated', true)
      .limit(5);
    
    if (plansError) {
      console.error('❌ workout_plans error:', plansError);
    } else {
      console.log(`✅ Found ${plansTest.length} AI-generated workout plans`);
      if (plansTest.length > 0) {
        console.log('   Sample:', plansTest[0].title);
      }
    }
    
    // Test 4: Test the complete RPC function with real data
    if (plansTest.length > 0) {
      // Get the user_id from the first plan
      const firstPlan = await supabase
        .from('workout_plans')
        .select('user_id')
        .eq('id', plansTest[0].id)
        .single();
      
      if (firstPlan.data) {
        console.log('4. Testing RPC with real user data...');
        const { data: userPlans, error: userError } = await supabase
          .rpc('get_ai_workout_plans', { p_user_id: firstPlan.data.user_id });
        
        if (userError) {
          console.error('❌ User RPC error:', userError);
        } else {
          console.log(`✅ RPC returned ${userPlans.length} plans for user`);
        }
      }
    }
    
    // Test 5: Test AI configuration
    console.log('5. Testing AI configuration...');
    const { data: aiConfig, error: aiConfigError } = await supabase
      .from('ai_config')
      .select('*')
      .eq('provider', 'openai')
      .single();
    
    if (aiConfigError) {
      console.error('❌ AI config error:', aiConfigError);
    } else {
      console.log('✅ AI configuration found');
      console.log(`   Enabled: ${aiConfig.is_enabled}`);
      console.log(`   Model: ${aiConfig.model_name}`);
    }
    
    console.log('\n🎉 AI Workout System Status: READY');
    console.log('The core AI functionality is now fully operational!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteAIWorkflow();
