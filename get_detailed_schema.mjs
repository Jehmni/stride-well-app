import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function getDetailedSchema() {
  console.log('🔍 Getting detailed schema for problematic tables...\n');
  
  const tables = ['workout_logs', 'exercise_logs', 'workout_progress'];
  
  for (const tableName of tables) {
    console.log(`\n📊 Table: ${tableName}`);
    console.log('=' + '='.repeat(tableName.length + 7));
    
    try {
      // Try to insert a test record to see what columns are expected
      const testData = {};
      
      // Add some likely columns based on the errors
      if (tableName === 'workout_logs') {
        testData.user_id = 'test';
        testData.workout_id = 'test';
        testData.duration = 30;
        testData.completed_at = new Date().toISOString();
      } else if (tableName === 'exercise_logs') {
        testData.user_id = 'test';
        testData.exercise_id = 'test';
        testData.exercise_name = 'test';
        testData.sets = 3;
        testData.reps = 10;
      } else if (tableName === 'workout_progress') {
        testData.user_id = 'test';
        testData.workout_id = 'test';
        testData.completed_exercises = [];
      }
      
      const { data, error } = await supabase
        .from(tableName)
        .insert(testData)
        .select();
      
      if (error) {
        console.log(`❌ Insert error (shows missing columns): ${error.message}`);
        
        // Try to understand the error
        if (error.message.includes('does not exist')) {
          const match = error.message.match(/column "([^"]+)"/);
          if (match) {
            console.log(`🔍 Missing column: ${match[1]}`);
          }
        }
      } else {
        console.log(`✅ Insert successful, data:`, data);
        
        // Clean up the test record
        if (data && data[0]) {
          await supabase
            .from(tableName)
            .delete()
            .eq('id', data[0].id);
          console.log('🧹 Test record cleaned up');
        }
      }
      
      // Try to select with common columns to see what exists
      const { data: selectData, error: selectError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (selectError) {
        console.log(`❌ Select error: ${selectError.message}`);
      } else {
        console.log(`📋 Available columns: ${selectData && selectData[0] ? Object.keys(selectData[0]).join(', ') : 'No data to show columns'}`);
      }
      
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
}

getDetailedSchema();
