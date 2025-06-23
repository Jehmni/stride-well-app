import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDatabaseSchema() {
  console.log('🔧 Fixing database schema to match code expectations...\n');
  
  try {
    console.log('1. Testing current workout_logs table...');
    
    // Try the actual structure that should exist
    const testInsert = {
      user_id: 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97',
      workout_id: 'test-workout',
      duration: 30,
      calories_burned: 200,
      notes: 'Test workout',
      completed_at: new Date().toISOString()
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('workout_logs')
      .insert(testInsert)
      .select();
    
    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`);
      
      // If duration column doesn't exist, we need to check what columns do exist
      console.log('\n2. Getting actual table structure...');
      
      // Try with minimal data to see what's required
      const minimalTest = {
        user_id: 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97'
      };
      
      const { data: minData, error: minError } = await supabase
        .from('workout_logs')
        .insert(minimalTest)
        .select();
      
      if (minError) {
        console.log(`❌ Minimal insert also failed: ${minError.message}`);
        
        // The table structure is completely wrong, let's check with existing data
        const { data: existingData, error: selectError } = await supabase
          .from('workout_logs')
          .select('*')
          .limit(1);
        
        if (selectError) {
          console.log(`❌ Can't even select: ${selectError.message}`);
        } else {
          console.log(`📋 Existing data structure:`, existingData);
        }
      } else {
        console.log(`✅ Minimal insert worked:`, minData);
        
        // Clean up
        if (minData && minData[0]) {
          await supabase.from('workout_logs').delete().eq('id', minData[0].id);
        }
      }
    } else {
      console.log(`✅ Insert worked perfectly:`, insertData);
      
      // Clean up
      if (insertData && insertData[0]) {
        await supabase.from('workout_logs').delete().eq('id', insertData[0].id);
        console.log('🧹 Test record cleaned up');
      }
    }
    
    console.log('\n3. Testing exercise_logs table...');
    
    const exerciseTest = {
      workout_log_id: 'test',
      exercise_id: 'test',
      sets_completed: 3,
      reps_completed: 10
    };
    
    const { data: exData, error: exError } = await supabase
      .from('exercise_logs')
      .insert(exerciseTest)
      .select();
    
    if (exError) {
      console.log(`❌ Exercise logs error: ${exError.message}`);
    } else {
      console.log(`✅ Exercise logs work fine`);
      if (exData && exData[0]) {
        await supabase.from('exercise_logs').delete().eq('id', exData[0].id);
      }
    }
    
    console.log('\n4. Testing workout_progress table...');
    
    const progressTest = {
      user_id: 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97',
      workout_id: 'test'
    };
    
    const { data: progData, error: progError } = await supabase
      .from('workout_progress')
      .insert(progressTest)
      .select();
    
    if (progError) {
      console.log(`❌ Workout progress error: ${progError.message}`);
    } else {
      console.log(`✅ Workout progress works fine`);
      if (progData && progData[0]) {
        await supabase.from('workout_progress').delete().eq('id', progData[0].id);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixDatabaseSchema();
