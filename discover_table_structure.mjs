import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function discoverTableStructure() {
  console.log('🔍 Discovering table structure through systematic testing...\n');
  
  const realUserId = 'aa24e18b-a6d9-40aa-aa3b-fec4d3af5f97';
  
  // Test workout_logs with valid UUID
  console.log('📊 Testing workout_logs structure...');
  try {
    const testData = {
      user_id: realUserId,
      workout_id: 'test-workout-id',
      completed_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('workout_logs')
      .insert(testData)
      .select();
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
      
      // Try different column combinations
      const attempts = [
        { user_id: realUserId },
        { user_id: realUserId, workout_name: 'Test' },
        { user_id: realUserId, name: 'Test' },
        { user_id: realUserId, title: 'Test' }
      ];
      
      for (let i = 0; i < attempts.length; i++) {
        console.log(`  🧪 Attempt ${i + 1}: ${JSON.stringify(attempts[i])}`);
        
        const { data: attemptData, error: attemptError } = await supabase
          .from('workout_logs')
          .insert(attempts[i])
          .select();
        
        if (attemptError) {
          console.log(`    ❌ ${attemptError.message}`);
        } else {
          console.log(`    ✅ Success! Columns: ${Object.keys(attemptData[0]).join(', ')}`);
          
          // Clean up
          await supabase.from('workout_logs').delete().eq('id', attemptData[0].id);
          break;
        }
      }
    } else {
      console.log(`✅ Success! Columns: ${Object.keys(data[0]).join(', ')}`);
      await supabase.from('workout_logs').delete().eq('id', data[0].id);
    }
    
  } catch (err) {
    console.log(`❌ Exception: ${err.message}`);
  }
  
  // Test what tables can be used for workout completion tracking
  console.log('\n🎯 Finding alternative tables for workout tracking...');
  
  const possibleTables = [
    'completed_workouts',
    'user_workouts', 
    'workout_sessions',
    'workout_history',
    'activity_logs'
  ];
  
  for (const tableName of possibleTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        if (!error.message.includes('does not exist')) {
          console.log(`${tableName}: Available but error - ${error.message}`);
        }
      } else {
        console.log(`✅ ${tableName}: Available with ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      // Table doesn't exist
    }
  }
  
  // Create our own simple workout completion table approach
  console.log('\n💡 Testing simple workout completion approach...');
  
  try {
    // Use the user_profiles table to store workout completion data temporarily
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', realUserId)
      .single();
    
    if (profileError) {
      console.log(`❌ Can't access user profiles: ${profileError.message}`);
    } else {
      console.log(`✅ User profile accessible, we can use it as a fallback`);
      
      // Test updating user profile with workout data
      const { data: updateData, error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', realUserId)
        .select();
      
      if (updateError) {
        console.log(`❌ Can't update user profile: ${updateError.message}`);
      } else {
        console.log(`✅ Can update user profile - we can store workout data here temporarily`);
      }
    }
  } catch (err) {
    console.log(`❌ Profile test exception: ${err.message}`);
  }
}

discoverTableStructure();
