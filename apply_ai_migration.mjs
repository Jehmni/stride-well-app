// Apply critical AI workout database fixes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔧 Applying AI workout critical fixes migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250623000000_fix_ai_workout_critical_issues.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`📋 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          console.error('Statement:', statement.substring(0, 100) + '...');
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
    
    console.log('🎉 Migration application completed');
    
    // Test the new RPC function
    console.log('🧪 Testing get_ai_workout_plans function...');
    const { data, error } = await supabase.rpc('get_ai_workout_plans', { 
      p_user_id: '00000000-0000-0000-0000-000000000000' // dummy user ID for testing
    });
    
    if (error) {
      console.error('❌ RPC function test failed:', error);
    } else {
      console.log('✅ RPC function test successful');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
