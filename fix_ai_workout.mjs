// Simple script to apply AI workout fixes to Supabase
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAIWorkoutIssues() {
  console.log('🔧 Fixing AI workout critical issues...');
  
  // First, let's create the missing RPC function using a direct approach
  const createRPCFunction = `
    CREATE OR REPLACE FUNCTION public.get_ai_workout_plans(p_user_id UUID)
    RETURNS TABLE (
      id UUID,
      title TEXT,
      description TEXT,
      fitness_goal TEXT,
      created_at TIMESTAMPTZ,
      weekly_structure JSONB,
      exercises JSONB,
      completion_count BIGINT
    ) 
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$ 
    BEGIN
      RETURN QUERY
      SELECT 
        wp.id,
        wp.title,
        wp.description,
        wp.fitness_goal,
        wp.created_at,
        wp.weekly_structure,
        wp.exercises,
        COALESCE(wl.completion_count, 0) as completion_count
      FROM public.workout_plans wp
      LEFT JOIN (
        SELECT 
          ai_workout_plan_id,
          COUNT(*) as completion_count
        FROM public.workout_logs 
        WHERE ai_workout_plan_id IS NOT NULL
        GROUP BY ai_workout_plan_id
      ) wl ON wp.id = wl.ai_workout_plan_id
      WHERE wp.user_id = p_user_id 
        AND wp.ai_generated = true
      ORDER BY wp.created_at DESC;
    END;
    $$
  `;
  
  try {
    console.log('📝 Creating get_ai_workout_plans RPC function...');
    
    // Try using exec_sql if it exists
    let { error } = await supabase.rpc('exec_sql', { sql: createRPCFunction });
    
    if (error) {
      console.log('⚠️ exec_sql not available, trying direct query...');
      
      // Fallback: try a different approach
      const { error: directError } = await supabase
        .from('workout_plans')
        .select('id')
        .limit(1);
      
      if (directError) {
        console.error('❌ Database connection failed:', directError);
        return;
      }
      
      console.log('✅ Database connected, but RPC creation requires admin access');
      console.log('📋 Please run this SQL manually in your Supabase dashboard:');
      console.log('=====================================');
      console.log(createRPCFunction);
      console.log('=====================================');
    } else {
      console.log('✅ RPC function created successfully');
    }
    
    // Test if we can query workout plans
    console.log('🧪 Testing workout plans table access...');
    const { data: testData, error: testError } = await supabase
      .from('workout_plans')
      .select('id, title, ai_generated')
      .limit(5);
    
    if (testError) {
      console.error('❌ Cannot access workout_plans table:', testError);
    } else {
      console.log('✅ workout_plans table accessible');
      console.log(`📊 Found ${testData.length} workout plans`);
    }
    
    // Test workout_logs table
    console.log('🧪 Testing workout_logs table access...');
    const { data: logsData, error: logsError } = await supabase
      .from('workout_logs')
      .select('id, ai_workout_plan_id')
      .limit(5);
    
    if (logsError) {
      console.error('❌ Cannot access workout_logs table:', logsError);
    } else {
      console.log('✅ workout_logs table accessible');
      console.log(`📊 Found ${logsData.length} workout logs`);
    }
    
  } catch (error) {
    console.error('❌ Failed to fix AI workout issues:', error);
  }
}

fixAIWorkoutIssues();
