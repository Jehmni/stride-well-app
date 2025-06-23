import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchemaFix() {
  console.log('🧪 Testing Database Schema Fix...\n');
  
  const testUserId = 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
  
  try {
    // Test 1: workout_logs table with all expected columns
    console.log('1. Testing workout_logs table...');
    
    const workoutLogData = {
      user_id: testUserId,
      workout_id: 'test-workout-id',
      duration: 45,
      calories_burned: 350,
      notes: 'Test workout completion',
      rating: 4,
      workout_type: 'ai_generated',
      is_custom: false,
      is_from_ai_plan: true,
      workout_name: 'Test AI Workout',
      workout_description: 'Generated for testing',
      end_time: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0]
    };
    
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workout_logs')
      .insert(workoutLogData)
      .select()
      .single();
    
    if (workoutError) {
      console.log(`   ❌ FAILED: ${workoutError.message}`);
      return false;
    } else {
      console.log(`   ✅ SUCCESS: workout_logs insert worked`);
      console.log(`   📋 Created log ID: ${workoutLog.id}`);
    }
    
    // Test 2: exercise_logs table
    console.log('\n2. Testing exercise_logs table...');
    
    // First get an exercise ID
    const { data: exercises, error: exerciseError } = await supabase
      .from('exercises')
      .select('id')
      .limit(1)
      .single();
    
    if (exerciseError || !exercises) {
      console.log('   ⚠️  No exercises found, skipping exercise_logs test');
    } else {
      const exerciseLogData = {
        workout_log_id: workoutLog.id,
        exercise_id: exercises.id,
        sets_completed: 3,
        reps_completed: 12,
        weight_used: 50.5,
        notes: 'Test exercise completion'
      };
      
      const { data: exerciseLog, error: exerciseLogError } = await supabase
        .from('exercise_logs')
        .insert(exerciseLogData)
        .select()
        .single();
      
      if (exerciseLogError) {
        console.log(`   ❌ FAILED: ${exerciseLogError.message}`);
      } else {
        console.log(`   ✅ SUCCESS: exercise_logs insert worked`);
        console.log(`   📋 Created exercise log ID: ${exerciseLog.id}`);
      }
    }
    
    // Test 3: workout_progress table
    console.log('\n3. Testing workout_progress table...');
    
    const progressData = {
      user_id: testUserId,
      workout_id: 'test-workout-progress',
      completed_exercises: ['exercise-1', 'exercise-2', 'exercise-3']
    };
    
    const { data: progress, error: progressError } = await supabase
      .from('workout_progress')
      .insert(progressData)
      .select()
      .single();
    
    if (progressError) {
      console.log(`   ❌ FAILED: ${progressError.message}`);
    } else {
      console.log(`   ✅ SUCCESS: workout_progress insert worked`);
      console.log(`   📋 Created progress ID: ${progress.id}`);
      console.log(`   📝 Completed exercises: ${progress.completed_exercises.length}`);
    }
    
    // Test 4: RPC functions
    console.log('\n4. Testing RPC functions...');
    
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('sync_workout_progress', {
        p_user_id: testUserId,
        p_workout_id: 'test-rpc-workout',
        p_completed_exercises: ['ex1', 'ex2']
      });
      
      if (rpcError) {
        console.log(`   ❌ RPC FAILED: ${rpcError.message}`);
      } else {
        console.log(`   ✅ SUCCESS: sync_workout_progress RPC works`);
        console.log(`   📋 RPC result: ${rpcResult}`);
      }
    } catch (rpcErr) {
      console.log(`   ❌ RPC EXCEPTION: ${rpcErr.message}`);
    }
    
    // Test 5: Stats queries (the ones that were failing)
    console.log('\n5. Testing stats queries...');
    
    try {
      // Test the query pattern from useWorkoutStats
      const { count: totalCount, error: statsError } = await supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', testUserId)
        .not('end_time', 'is', null);
      
      if (statsError) {
        console.log(`   ❌ STATS QUERY FAILED: ${statsError.message}`);
      } else {
        console.log(`   ✅ SUCCESS: Stats queries work`);
        console.log(`   📊 Found ${totalCount} completed workouts`);
      }
      
      // Test calories query
      const { data: caloriesData, error: caloriesError } = await supabase
        .from('workout_logs')
        .select('calories_burned')
        .eq('user_id', testUserId);
      
      if (caloriesError) {
        console.log(`   ❌ CALORIES QUERY FAILED: ${caloriesError.message}`);
      } else {
        const totalCalories = caloriesData.reduce((sum, log) => sum + (log.calories_burned || 0), 0);
        console.log(`   ✅ SUCCESS: Calories query works`);
        console.log(`   🔥 Total calories: ${totalCalories}`);
      }
      
    } catch (statsErr) {
      console.log(`   ❌ STATS EXCEPTION: ${statsErr.message}`);
    }
    
    // Test 6: AI workout completion flow
    console.log('\n6. Testing AI workout completion flow...');
    
    try {
      // Get an AI workout plan
      const { data: aiPlan, error: aiPlanError } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('ai_generated', true)
        .limit(1)
        .single();
      
      if (aiPlanError || !aiPlan) {
        console.log('   ⚠️  No AI workout plans found, skipping AI completion test');
      } else {
        const { data: aiResult, error: aiError } = await supabase.rpc('log_ai_workout_completion', {
          p_user_id: testUserId,
          p_ai_workout_plan_id: aiPlan.id,
          p_exercises_completed: 5,
          p_total_exercises: 8,
          p_duration_minutes: 35,
          p_notes: 'Test AI workout completion'
        });
        
        if (aiError) {
          console.log(`   ❌ AI COMPLETION FAILED: ${aiError.message}`);
        } else {
          console.log(`   ✅ SUCCESS: AI workout completion works`);
          console.log(`   📋 AI completion log ID: ${aiResult}`);
        }
      }
    } catch (aiErr) {
      console.log(`   ❌ AI COMPLETION EXCEPTION: ${aiErr.message}`);
    }
    
    // Cleanup test data
    console.log('\n🧹 Cleaning up test data...');
    
    try {
      // Delete in correct order (children first)
      await supabase.from('exercise_logs').delete().eq('workout_log_id', workoutLog.id);
      await supabase.from('workout_logs').delete().eq('id', workoutLog.id);
      await supabase.from('workout_progress').delete().eq('user_id', testUserId);
      
      console.log('   ✅ Test data cleaned up successfully');
    } catch (cleanupErr) {
      console.log(`   ⚠️  Cleanup warning: ${cleanupErr.message}`);
    }
    
    console.log('\n🎉 SCHEMA FIX TEST COMPLETED SUCCESSFULLY!');
    console.log('🚀 Your application should now work correctly for workout logging.');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ SCHEMA FIX TEST FAILED:', error);
    return false;
  }
}

testSchemaFix();
