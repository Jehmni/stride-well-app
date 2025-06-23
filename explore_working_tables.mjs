import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function exploreWorkingTables() {
  console.log('🔍 Exploring working tables for workout tracking...\n');
  
  const realUserId = 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
  const tables = ['user_workouts', 'workout_sessions'];
  
  for (const tableName of tables) {
    console.log(`\n📊 Testing ${tableName}:`);
    console.log('=' + '='.repeat(tableName.length + 9));
    
    try {
      // Test basic insert with minimal data
      const testData = {
        user_id: realUserId,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(testData)
        .select();
      
      if (error) {
        console.log(`❌ Basic insert failed: ${error.message}`);
        
        // Try different common column combinations
        const attempts = [
          { user_id: realUserId, name: 'Test Workout' },
          { user_id: realUserId, title: 'Test Workout' },
          { user_id: realUserId, workout_name: 'Test Workout' },
          { user_id: realUserId, session_name: 'Test Session' },
          { user_id: realUserId, workout_id: 'test-id' },
          { user_id: realUserId, duration: 30 },
          { user_id: realUserId, status: 'completed' }
        ];
        
        for (let i = 0; i < attempts.length; i++) {
          console.log(`  🧪 Attempt ${i + 1}: ${JSON.stringify(attempts[i])}`);
          
          const { data: attemptData, error: attemptError } = await supabase
            .from(tableName)
            .insert(attempts[i])
            .select();
          
          if (attemptError) {
            console.log(`    ❌ ${attemptError.message}`);
          } else {
            console.log(`    ✅ SUCCESS! Discovered working structure:`);
            console.log(`    📋 Columns: ${Object.keys(attemptData[0]).join(', ')}`);
            console.log(`    📝 Data: ${JSON.stringify(attemptData[0])}`);
            
            // Clean up but keep the schema info
            await supabase.from(tableName).delete().eq('id', attemptData[0].id);
            console.log(`    🧹 Test record cleaned up`);
            break;
          }
        }
      } else {
        console.log(`✅ Basic insert worked!`);
        console.log(`📋 Columns: ${Object.keys(data[0]).join(', ')}`);
        console.log(`📝 Data: ${JSON.stringify(data[0])}`);
        
        // Clean up
        await supabase.from(tableName).delete().eq('id', data[0].id);
        console.log(`🧹 Test record cleaned up`);
      }
      
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
  
  // Test if we can use the existing workout_plans table for reference
  console.log('\n🎯 Testing workout_plans integration:');
  try {
    const { data: workoutPlans, error: plansError } = await supabase
      .from('workout_plans')
      .select('*')
      .limit(1);
    
    if (plansError) {
      console.log(`❌ Can't access workout_plans: ${plansError.message}`);
    } else {
      console.log(`✅ workout_plans accessible with ${workoutPlans?.length || 0} records`);
      if (workoutPlans && workoutPlans.length > 0) {
        console.log(`📋 Available columns: ${Object.keys(workoutPlans[0]).join(', ')}`);
        console.log(`📝 Sample plan ID: ${workoutPlans[0].id}`);
      }
    }
  } catch (err) {
    console.log(`❌ workout_plans exception: ${err.message}`);
  }
  
  // Test creating a complete workout logging flow
  console.log('\n🚀 Testing complete workout logging flow:');
  
  try {
    // Step 1: Get or create a workout plan
    const { data: existingPlan, error: planError } = await supabase
      .from('workout_plans')
      .select('*')
      .limit(1)
      .single();
    
    if (planError || !existingPlan) {
      console.log('No existing plans, this is fine for testing');
    } else {
      console.log(`Using existing plan: ${existingPlan.title}`);
      
      // Step 2: Try to log workout completion
      const completionData = {
        user_id: realUserId,
        workout_plan_id: existingPlan.id,
        completed_at: new Date().toISOString(),
        duration: 45,
        notes: 'Test AI workout completion'
      };
      
      // Try user_workouts first
      const { data: completionResult, error: completionError } = await supabase
        .from('user_workouts')
        .insert(completionData)
        .select();
      
      if (completionError) {
        console.log(`❌ user_workouts completion failed: ${completionError.message}`);
      } else {
        console.log(`✅ Workout completion logged successfully!`);
        console.log(`📋 Completion data: ${JSON.stringify(completionResult[0])}`);
        
        // Clean up
        await supabase.from('user_workouts').delete().eq('id', completionResult[0].id);
        console.log(`🧹 Completion record cleaned up`);
      }
    }
    
  } catch (err) {
    console.log(`❌ Complete flow exception: ${err.message}`);
  }
}

exploreWorkingTables();
