import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function comprehensiveSchemaCheck() {
  console.log('🔍 Comprehensive AI Workout & Tracking Schema Verification');
  console.log('===========================================================');

  try {
    // 1. Check workout_plans table and AI-related columns
    console.log('\n1. Checking workout_plans table for AI functionality...');
    const { data: workoutPlans, error: wpError } = await supabase
      .from('workout_plans')
      .select('*')
      .limit(1);
    
    if (wpError) {
      console.error('❌ workout_plans error:', wpError.message);
    } else {
      console.log('✅ workout_plans table accessible');
      if (workoutPlans.length > 0) {
        const columns = Object.keys(workoutPlans[0]);
        console.log('   Available columns:', columns);
        
        // Check for AI-specific columns
        const expectedColumns = ['ai_generated', 'fitness_goal', 'difficulty_level', 'exercises'];
        expectedColumns.forEach(col => {
          if (columns.includes(col)) {
            console.log(`   ✅ ${col} column exists`);
          } else {
            console.log(`   ❌ ${col} column MISSING`);
          }
        });
      }
    }

    // 2. Check for AI workout plans specifically
    console.log('\n2. Checking AI-generated workout plans...');
    const { data: aiPlans, error: aiError } = await supabase
      .from('workout_plans')
      .select('id, title, ai_generated, fitness_goal, exercises')
      .eq('ai_generated', true);
    
    if (aiError) {
      console.error('❌ AI plans query error:', aiError.message);
    } else {
      console.log(`✅ Found ${aiPlans.length} AI-generated workout plans`);
      if (aiPlans.length > 0) {
        const sample = aiPlans[0];
        console.log('   Sample AI plan:');
        console.log(`     - ID: ${sample.id}`);
        console.log(`     - Title: ${sample.title}`);
        console.log(`     - Fitness Goal: ${sample.fitness_goal}`);
        console.log(`     - Has Exercises: ${sample.exercises ? 'Yes' : 'No'}`);
      }
    }

    // 3. Check workout_logs table for completion tracking
    console.log('\n3. Checking workout_logs table for completion tracking...');
    const { data: workoutLogs, error: wlError } = await supabase
      .from('workout_logs')
      .select('*')
      .limit(1);
    
    if (wlError) {
      console.error('❌ workout_logs error:', wlError.message);
    } else {
      console.log('✅ workout_logs table accessible');
      if (workoutLogs.length > 0) {
        const columns = Object.keys(workoutLogs[0]);
        console.log('   Available columns:', columns);
        
        // Check for expected tracking columns
        const expectedTrackingColumns = [
          'user_id', 'workout_id', 'ai_workout_plan_id', 'workout_type',
          'exercises_completed', 'total_exercises', 'duration', 
          'calories_burned', 'notes', 'rating', 'completed_at'
        ];
        
        expectedTrackingColumns.forEach(col => {
          if (columns.includes(col)) {
            console.log(`   ✅ ${col} column exists`);
          } else {
            console.log(`   ❌ ${col} column MISSING`);
          }
        });
      } else {
        console.log('   ℹ️  No workout logs exist yet (table is empty)');
      }
    }

    // 4. Test get_ai_workout_plans RPC function
    console.log('\n4. Testing get_ai_workout_plans RPC function...');
    if (aiPlans.length > 0) {
      const testUserId = aiPlans[0].user_id || 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
      
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('get_ai_workout_plans', { p_user_id: testUserId });
      
      if (rpcError) {
        console.error('❌ get_ai_workout_plans RPC error:', rpcError.message);
      } else {
        console.log(`✅ get_ai_workout_plans RPC works - returned ${rpcResult.length} plans`);
        if (rpcResult.length > 0) {
          console.log('   Sample RPC result columns:', Object.keys(rpcResult[0]));
        }
      }
    }

    // 5. Test log_ai_workout_completion RPC function (if it exists)
    console.log('\n5. Testing log_ai_workout_completion RPC function...');
    if (aiPlans.length > 0) {
      const testUserId = aiPlans[0].user_id || 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
      const testPlanId = aiPlans[0].id;
      
      const { data: logResult, error: logError } = await supabase
        .rpc('log_ai_workout_completion', {
          p_user_id: testUserId,
          p_ai_workout_plan_id: testPlanId,
          p_exercises_completed: 5,
          p_total_exercises: 8,
          p_duration_minutes: 30,
          p_notes: 'Schema verification test'
        });
      
      if (logError) {
        console.error('❌ log_ai_workout_completion RPC error:', logError.message);
        console.log('   This function may not exist or has different parameters');
      } else {
        console.log('✅ log_ai_workout_completion RPC works');
        console.log('   Returned log ID:', logResult);
      }
    }

    // 6. Check user_profiles table for AI workout integration
    console.log('\n6. Checking user_profiles table...');
    const { data: userProfiles, error: upError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (upError) {
      console.error('❌ user_profiles error:', upError.message);
    } else {
      console.log('✅ user_profiles table accessible');
      if (userProfiles.length > 0) {
        const columns = Object.keys(userProfiles[0]);
        console.log('   Available columns:', columns);
        
        // Check for AI-related profile columns
        const expectedProfileColumns = ['fitness_goals', 'fitness_level', 'preferences'];
        expectedProfileColumns.forEach(col => {
          if (columns.includes(col)) {
            console.log(`   ✅ ${col} column exists`);
          } else {
            console.log(`   ❌ ${col} column MISSING`);
          }
        });
      }
    }

    // 7. Check exercises table for AI workout generation
    console.log('\n7. Checking exercises table...');
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('*')
      .limit(1);
    
    if (exError) {
      console.error('❌ exercises error:', exError.message);
    } else {
      console.log('✅ exercises table accessible');
      if (exercises.length > 0) {
        const columns = Object.keys(exercises[0]);
        console.log('   Available columns:', columns);
        
        // Check for expected exercise columns
        const expectedExerciseColumns = ['name', 'category', 'muscle_groups', 'difficulty_level', 'equipment'];
        expectedExerciseColumns.forEach(col => {
          if (columns.includes(col)) {
            console.log(`   ✅ ${col} column exists`);
          } else {
            console.log(`   ❌ ${col} column MISSING`);
          }
        });
      }
    }

    // 8. Summary and recommendations
    console.log('\n8. Schema Analysis Summary');
    console.log('==========================');
    
    // Count issues
    let issues = [];
    
    if (wpError) issues.push('workout_plans table not accessible');
    if (wlError) issues.push('workout_logs table not accessible');
    if (upError) issues.push('user_profiles table not accessible');
    if (exError) issues.push('exercises table not accessible');
    
    if (issues.length === 0) {
      console.log('✅ All core tables are accessible');
    } else {
      console.log('❌ Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n🎉 Schema verification complete!');
    
  } catch (error) {
    console.error('❌ Schema check failed:', error.message);
  }
}

comprehensiveSchemaCheck();
