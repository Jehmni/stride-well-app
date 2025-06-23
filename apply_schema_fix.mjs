import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applySchemaFix() {
  console.log('🔧 Applying comprehensive database schema fix...\n');
  
  try {
    // Read the SQL file
    const sqlContent = readFileSync('fix_complete_schema.sql', 'utf8');
    
    // Split into individual statements (basic split on semicolons)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`${i + 1}. Executing: ${statement.substring(0, 100)}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
          
          // If exec_sql doesn't exist, we need a different approach
          if (error.message.includes('exec_sql')) {
            console.log('   ⚠️  exec_sql function not available, this is expected');
            console.log('   💡 You\'ll need to run the SQL manually in Supabase dashboard');
            break;
          }
        } else {
          console.log(`   ✅ Success`);
        }
      } catch (err) {
        console.log(`   ❌ Exception: ${err.message}`);
      }
    }
    
    console.log('\n🧪 Testing the fixed schema...');
    
    // Test the fixed schema
    const testUserId = 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
    
    // Test workout_logs
    console.log('Testing workout_logs...');
    const { data: workoutTest, error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: testUserId,
        workout_id: 'test-workout',
        duration: 30,
        calories_burned: 200,
        notes: 'Test workout'
      })
      .select();
    
    if (workoutError) {
      console.log(`❌ Workout logs test failed: ${workoutError.message}`);
    } else {
      console.log(`✅ Workout logs test passed`);
      
      // Clean up
      if (workoutTest && workoutTest[0]) {
        await supabase.from('workout_logs').delete().eq('id', workoutTest[0].id);
      }
    }
    
    // Test workout_progress
    console.log('Testing workout_progress...');
    const { data: progressTest, error: progressError } = await supabase
      .from('workout_progress')
      .insert({
        user_id: testUserId,
        workout_id: 'test-workout',
        completed_exercises: []
      })
      .select();
    
    if (progressError) {
      console.log(`❌ Workout progress test failed: ${progressError.message}`);
    } else {
      console.log(`✅ Workout progress test passed`);
      
      // Clean up
      if (progressTest && progressTest[0]) {
        await supabase.from('workout_progress').delete().eq('id', progressTest[0].id);
      }
    }
    
    console.log('\n✅ Schema fix application completed!');
    
  } catch (error) {
    console.error('❌ Error applying schema fix:', error);
  }
}

applySchemaFix();
