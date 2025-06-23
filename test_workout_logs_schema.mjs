import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWorkoutLogsInsert() {
  console.log('🔍 Testing workout_logs Insert Capabilities');
  console.log('==========================================');

  try {
    // Get a test user and AI plan
    const { data: aiPlans } = await supabase
      .from('workout_plans')
      .select('id, user_id')
      .eq('ai_generated', true)
      .limit(1);
    
    if (!aiPlans || aiPlans.length === 0) {
      console.log('❌ No AI plans found');
      return;
    }

    const testUserId = aiPlans[0].user_id;
    const testPlanId = aiPlans[0].id;
    console.log(`Using user: ${testUserId}, plan: ${testPlanId}`);

    // Test different column combinations to see what exists
    const testCombinations = [
      // Basic required
      { user_id: testUserId, workout_id: testPlanId },
      
      // Add common columns one by one
      { user_id: testUserId, workout_id: testPlanId, notes: 'test' },
      { user_id: testUserId, workout_id: testPlanId, rating: 5 },
      { user_id: testUserId, workout_id: testPlanId, calories_burned: 100 },
      
      // Try duration variations
      { user_id: testUserId, workout_id: testPlanId, duration: 30 },
      { user_id: testUserId, workout_id: testPlanId, duration_minutes: 30 },
      
      // Try AI-specific columns
      { user_id: testUserId, workout_id: testPlanId, ai_workout_plan_id: testPlanId },
      { user_id: testUserId, workout_id: testPlanId, workout_type: 'ai_generated' },
      
      // Try exercise tracking columns
      { user_id: testUserId, workout_id: testPlanId, exercises_completed: 5 },
      { user_id: testUserId, workout_id: testPlanId, total_exercises: 8 },
    ];

    for (let i = 0; i < testCombinations.length; i++) {
      const testData = testCombinations[i];
      const testColumns = Object.keys(testData).join(', ');
      
      console.log(`\n${i + 1}. Testing: ${testColumns}`);
      
      try {
        const { data: result, error } = await supabase
          .from('workout_logs')
          .insert(testData)
          .select()
          .single();
          
        if (error) {
          if (error.message.includes('row-level security')) {
            console.log('   ⚠️  RLS blocked (columns exist)');
          } else if (error.message.includes('does not exist')) {
            const missingCol = error.message.match(/column "([^"]+)"/)?.[1];
            console.log(`   ❌ Missing column: ${missingCol}`);
          } else {
            console.log(`   ❌ Error: ${error.message.split('.')[0]}`);
          }
        } else {
          console.log('   ✅ SUCCESS - all columns exist!');
          console.log(`   Available columns in result:`, Object.keys(result));
          
          // Clean up test record
          await supabase.from('workout_logs').delete().eq('id', result.id);
          break; // Stop after first success
        }
      } catch (e) {
        console.log(`   ❌ Exception: ${e.message.split('.')[0]}`);
      }
    }

    // Try to get the actual schema by attempting an insert with an impossible constraint
    console.log('\n🔍 Attempting to discover actual schema...');
    try {
      const { error: schemaError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: testUserId,
          impossible_column_that_definitely_does_not_exist: 'test'
        });
      
      if (schemaError) {
        console.log('Schema discovery error:', schemaError.message);
      }
    } catch (e) {
      console.log('Schema discovery exception:', e.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWorkoutLogsInsert();
