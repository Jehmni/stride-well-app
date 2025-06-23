import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverActualSchema() {
  console.log('🔍 Discovering actual database schema...\n');
  
  const tables = ['workout_logs', 'exercise_logs', 'workout_progress', 'completed_workouts'];
  
  for (const tableName of tables) {
    console.log(`\n📊 Table: ${tableName}`);
    console.log('=' + '='.repeat(tableName.length + 7));
    
    try {
      // Try to get some data first
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);
      
      if (error) {
        console.log(`❌ Error accessing table: ${error.message}`);
        continue;
      }
      
      console.log(`✅ Table exists with ${data?.length || 0} records`);
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log(`📋 Columns: ${columns.join(', ')}`);
        console.log(`📝 Sample data:`, data[0]);
      } else {
        // Try to insert a minimal record to understand the structure
        console.log('🧪 Testing minimal insert to discover required columns...');
        
        let testData = {};
        
        if (tableName === 'workout_logs') {
          testData = { user_id: 'test' };
        } else if (tableName === 'exercise_logs') {
          testData = { user_id: 'test' };
        } else if (tableName === 'workout_progress') {
          testData = { user_id: 'test' };
        } else if (tableName === 'completed_workouts') {
          testData = { 
            user_id: 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97',
            workout_title: 'Test Workout',
            duration: 30
          };
        }
        
        const { data: insertData, error: insertError } = await supabase
          .from(tableName)
          .insert(testData)
          .select();
        
        if (insertError) {
          console.log(`❌ Insert error: ${insertError.message}`);
          
          // Try to extract column information from error
          if (insertError.message.includes('does not exist')) {
            const match = insertError.message.match(/column "([^"]+)"/);
            if (match) {
              console.log(`🔍 Missing column: ${match[1]}`);
            }
          }
          
          if (insertError.message.includes('violates')) {
            console.log(`🔒 RLS policy or constraint issue`);
          }
        } else {
          console.log(`✅ Insert successful:`, insertData);
          if (insertData && insertData[0]) {
            console.log(`📋 Columns from insert: ${Object.keys(insertData[0]).join(', ')}`);
            
            // Clean up
            await supabase.from(tableName).delete().eq('id', insertData[0].id);
            console.log('🧹 Test record cleaned up');
          }
        }
      }
      
    } catch (err) {
      console.log(`❌ Exception: ${err.message}`);
    }
  }
  
  // Check what tables actually exist by trying the completed_workouts approach
  console.log('\n🎯 Alternative approach - using completed_workouts (which seems to work)');
  
  try {
    const { data: completedData, error: completedError } = await supabase
      .from('completed_workouts')
      .select('*')
      .limit(1);
    
    if (completedError) {
      console.log(`❌ completed_workouts error: ${completedError.message}`);
    } else {
      console.log(`✅ completed_workouts works! Records: ${completedData?.length || 0}`);
      if (completedData && completedData.length > 0) {
        console.log(`📋 Columns: ${Object.keys(completedData[0]).join(', ')}`);
      }
    }
  } catch (err) {
    console.log(`❌ completed_workouts exception: ${err.message}`);
  }
}

discoverActualSchema();
