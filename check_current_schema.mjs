import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ruxnobvwdzyenucyimus.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1eG5vYnZ3ZHp5ZW51Y3lpbXVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MjEzMjcsImV4cCI6MjA2NjE5NzMyN30.qRarOG-V-vwajOQwiP5jLn8cDd2g7Z2pq0sCEAQ__lk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCurrentSchema() {
  console.log('🔍 Checking current database schema...\n');
  
  try {
    // Use raw SQL to check tables
    const { data: tables, error: tablesError } = await supabase.rpc('get_table_names');
    
    if (tablesError) {
      console.log('RPC not available, trying direct table access...');
      
      // Try to access tables directly to see what exists
      const tablesToTest = ['workout_logs', 'exercise_logs', 'workout_progress', 'workout_plans', 'exercises', 'user_profiles'];
      
      for (const tableName of tablesToTest) {
        console.log(`\n📊 Testing table: ${tableName}`);
        
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (error) {
            console.log(`  ❌ Error: ${error.message}`);
          } else {
            console.log(`  ✅ Table exists - found ${data?.length || 0} rows in test query`);
            
            // If we get data, show the structure
            if (data && data.length > 0) {
              console.log(`  📋 Sample columns: ${Object.keys(data[0]).join(', ')}`);
            }
          }
        } catch (err) {
          console.log(`  ❌ Exception: ${err.message}`);
        }
      }
      
      return;
    }
    
    console.log('📋 Available tables:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
    
    // Fallback: Try basic table queries
    console.log('\n� Fallback: Testing basic table access...');
    const basicTables = ['workout_logs', 'exercises'];
    
    for (const table of basicTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        console.log(`${table}: ${error ? `❌ ${error.message}` : `✅ OK (${data?.length || 0} rows)`}`);
        
        if (data && data[0]) {
          console.log(`  Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      } catch (err) {
        console.log(`${table}: ❌ ${err.message}`);
      }
    }
  }
}

checkCurrentSchema();
