// Apply critical AI workout database fixes using direct SQL execution
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  console.error('Need: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying AI workout critical fixes migration...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250623000000_fix_ai_workout_critical_issues.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded, size:', migrationSQL.length, 'characters');
    
    // Test connection first
    console.log('🔌 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('workout_plans')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection test failed:', testError);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Apply key migration statements individually
    console.log('🚀 Executing migration statements...');
    
    const keyStatements = [
      'ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS ai_workout_plan_id UUID REFERENCES ai_workout_plans(id);',
      'ALTER TABLE workout_plans ADD COLUMN IF NOT EXISTS workout_type VARCHAR(50) DEFAULT \'custom\';',
      'CREATE INDEX IF NOT EXISTS idx_workout_plans_ai_workout_plan_id ON workout_plans(ai_workout_plan_id);',
      'CREATE INDEX IF NOT EXISTS idx_workout_plans_workout_type ON workout_plans(workout_type);',
      `CREATE OR REPLACE FUNCTION get_ai_workout_plans()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  difficulty_level TEXT,
  duration_minutes INTEGER,
  exercises JSONB,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    awp.id,
    awp.name,
    awp.description,
    awp.difficulty_level,
    awp.duration_minutes,
    awp.exercises,
    awp.created_at
  FROM ai_workout_plans awp
  WHERE awp.is_public = true
  ORDER BY awp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
    ];
    
    let successCount = 0;
    
    for (let i = 0; i < keyStatements.length; i++) {
      const statement = keyStatements[i];
      console.log(`📋 Executing statement ${i + 1}/${keyStatements.length}...`);
      console.log('   ', statement.substring(0, 80) + '...');
      
      try {
        // Try using the from() method for simple operations
        if (statement.startsWith('ALTER TABLE') || statement.startsWith('CREATE INDEX')) {
          // These need to be executed as raw SQL
          const { error } = await supabase.rpc('execute_sql', { query: statement });
          
          if (error && !error.message?.includes('already exists')) {
            console.log('⚠️  RPC execute_sql not available, trying raw execution...');
            // Fallback - this might not work with supabase-js client
            throw new Error('Raw SQL execution not supported');
          } else {
            console.log('✅ Statement executed successfully');
            successCount++;
          }
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          // Function creation
          const { error } = await supabase.rpc('execute_sql', { query: statement });
          
          if (error) {
            console.log('⚠️  Function creation via RPC failed:', error.message);
          } else {
            console.log('✅ Function created successfully');
            successCount++;
          }
        }
      } catch (err) {
        console.log('⚠️  Statement execution failed:', err.message);
      }
    }
    
    console.log(`📊 Successfully executed ${successCount}/${keyStatements.length} statements`);
    
    // Verify critical components exist
    console.log('🔍 Verifying migration results...');
    
    // Check if ai_workout_plans table exists
    const { data: aiPlansData, error: aiPlansError } = await supabase
      .from('ai_workout_plans')
      .select('id')
      .limit(1);
    
    if (aiPlansError) {
      console.log('⚠️  ai_workout_plans table may not exist:', aiPlansError.message);
    } else {
      console.log('✅ ai_workout_plans table verified');
    }
    
    // Check if workout_plans has new columns
    const { data: workoutPlansData, error: workoutPlansError } = await supabase
      .from('workout_plans')
      .select('id, ai_workout_plan_id, workout_type')
      .limit(1);
    
    if (workoutPlansError) {
      console.log('⚠️  workout_plans columns may not exist:', workoutPlansError.message);
    } else {
      console.log('✅ workout_plans columns verified');
    }
    
    // Test the RPC function
    console.log('🧪 Testing get_ai_workout_plans function...');
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_ai_workout_plans');
    
    if (rpcError) {
      console.log('⚠️  get_ai_workout_plans RPC may not exist:', rpcError.message);
    } else {
      console.log('✅ get_ai_workout_plans RPC verified, returned', rpcData?.length || 0, 'plans');
    }
    
    console.log('🎉 Migration verification completed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
