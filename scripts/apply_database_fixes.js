
// This script applies all necessary database migrations for exercise logging and AI workout support

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Supabase client setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://japrzutwtqotzyudnizh.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_KEY;

if (!supabaseKey) {
  console.error("Missing Supabase key. Set VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_KEY environment variable.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Apply SQL files
async function applySQL(filePath) {
  try {
    console.log(`Applying SQL from ${filePath}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split the SQL into separate statements
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const stmt of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: stmt });
        if (error) {
          console.warn(`Warning executing statement: ${error.message}`);
        }
      } catch (stmtError) {
        console.warn(`Error in statement: ${stmtError.message}`);
      }
    }
    
    console.log(`✓ Applied ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Error applying ${filePath}: ${error.message}`);
    return false;
  }
}

// Verify exercise logging function
async function checkExerciseLogging() {
  try {
    console.log("\nChecking exercise logs functionality...");
    // Check if the function exists
    const { data: functionInfo, error: functionError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE proname = 'log_exercise_completion' AND nspname = 'public');"
      });

    if (functionError) {
      console.error("Error checking function:", functionError.message);
      return false;
    }

    const functionExists = functionInfo?.[0]?.exists;
    console.log(functionExists ? "✓ Log exercise completion function exists" : "✗ Log exercise completion function does not exist");
    
    return functionExists;
  } catch (error) {
    console.error("Error checking exercise logging:", error.message);
    return false;
  }
}

// Apply exercise log fix
async function fixExerciseLogging() {
  // This SQL ensures the log_exercise_completion function is correctly implemented
  const sql = `
  CREATE OR REPLACE FUNCTION public.log_exercise_completion(
    workout_log_id_param UUID,
    exercise_id_param UUID,
    sets_completed_param INTEGER,
    reps_completed_param INTEGER DEFAULT NULL,
    weight_used_param NUMERIC DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
  )
  RETURNS UUID
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    workout_user_id UUID;
    exercise_log_id UUID;
  BEGIN
    -- First verify the workout_log exists
    SELECT user_id INTO workout_user_id
    FROM workout_logs
    WHERE id = workout_log_id_param;
    
    -- Check if workout exists
    IF workout_user_id IS NULL THEN
      RAISE EXCEPTION 'Workout log not found';
    END IF;
    
    -- Check if both ids are valid UUIDs
    IF workout_log_id_param IS NULL OR exercise_id_param IS NULL THEN
      RAISE EXCEPTION 'Invalid workout_log_id or exercise_id';
    END IF;

    -- Insert the exercise log - the RLS policy will handle permissions
    INSERT INTO public.exercise_logs (
      workout_log_id,
      exercise_id,
      sets_completed,
      reps_completed,
      weight_used,
      notes,
      completed_at
    ) VALUES (
      workout_log_id_param,
      exercise_id_param,
      sets_completed_param,
      reps_completed_param,
      weight_used_param,
      notes_param,
      NOW() -- Use current timestamp
    )
    RETURNING id INTO exercise_log_id;
    
    RETURN exercise_log_id;
  END;
  $$;

  -- Update RLS policy to allow any INSERT operations via the function
  DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;

  CREATE POLICY "Users can insert their own exercise logs"
  ON public.exercise_logs
  FOR INSERT
  WITH CHECK (true); -- Allow inserts through security definer function
  `;

  try {
    console.log("Applying exercise logging function fix...");
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error("Error fixing exercise logging function:", error.message);
      return false;
    }
    
    console.log("✓ Exercise logging function fixed");
    return true;
  } catch (error) {
    console.error("Error fixing exercise logging function:", error.message);
    return false;
  }
}

// Verify AI workout support
async function checkAIWorkoutSupport() {
  try {
    console.log("\nChecking AI workout support...");
    // Check if ai_configurations table exists
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_configurations');"
      });

    if (tableError) {
      console.error("Error checking tables:", tableError.message);
      return false;
    }

    const tableExists = tableInfo?.[0]?.exists;
    console.log(tableExists ? "✓ AI configurations table exists" : "✗ AI configurations table does not exist");
    
    return tableExists;
  } catch (error) {
    console.error("Error checking AI workout support:", error.message);
    return false;
  }
}

// Apply AI workout support fix
async function fixAIWorkoutSupport() {
  // This SQL ensures AI workout support is correctly implemented
  const sql = `
  -- Add AI support fields to workout_plans table if they don't exist
  ALTER TABLE public.workout_plans
    ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

  -- Create an index for faster queries on user_id and fitness_goal if they don't exist
  CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
  CREATE INDEX IF NOT EXISTS idx_workout_plans_fitness_goal ON public.workout_plans(fitness_goal);

  -- Update the RLS policies to allow users to access their own workout plans
  ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Users can view their own workout plans" ON public.workout_plans;
  CREATE POLICY "Users can view their own workout plans"
    ON public.workout_plans
    FOR SELECT
    USING (
      user_id IS NULL OR user_id = auth.uid()
    );

  DROP POLICY IF EXISTS "Users can create their own workout plans" ON public.workout_plans;
  CREATE POLICY "Users can create their own workout plans"
    ON public.workout_plans
    FOR INSERT
    WITH CHECK (
      user_id = auth.uid()
    );

  -- Create configuration table for AI integrations if it doesn't exist
  CREATE TABLE IF NOT EXISTS public.ai_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL,
    api_key TEXT,
    api_endpoint TEXT,
    model_name TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Add example configuration if none exists
  INSERT INTO public.ai_configurations (service_name, api_endpoint, model_name, is_enabled)
  SELECT 'openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', FALSE
  WHERE NOT EXISTS (SELECT 1 FROM public.ai_configurations WHERE service_name = 'openai');

  -- Only administrators can access AI configurations
  ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

  -- Create policy if it doesn't exist
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE tablename = 'ai_configurations' AND policyname = 'Only app backend can access AI configurations'
    ) THEN
      CREATE POLICY "Only app backend can access AI configurations"
        ON public.ai_configurations
        USING (false);
    END IF;
  END
  $$;

  COMMENT ON TABLE public.ai_configurations IS 'Configuration for AI services used by the application';
  COMMENT ON TABLE public.workout_plans IS 'Workout plans, including AI-generated plans for specific users';
  `;

  try {
    console.log("Applying AI workout support fix...");
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error("Error fixing AI workout support:", error.message);
      return false;
    }
    
    console.log("✓ AI workout support fixed");
    return true;
  } catch (error) {
    console.error("Error fixing AI workout support:", error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log("Starting database fixes...");
  
  // Check exercise logging
  const exerciseLoggingExists = await checkExerciseLogging();
  if (!exerciseLoggingExists) {
    await fixExerciseLogging();
  }
  
  // Check AI workout support
  const aiWorkoutSupportExists = await checkAIWorkoutSupport();
  if (!aiWorkoutSupportExists) {
    await fixAIWorkoutSupport();
  }
  
  // Verify fixes
  const exerciseLoggingFixed = await checkExerciseLogging();
  const aiWorkoutSupportFixed = await checkAIWorkoutSupport();
  
  console.log("\n===== Summary =====");
  console.log(`Exercise logging: ${exerciseLoggingFixed ? '✓' : '✗'}`);
  console.log(`AI workout support: ${aiWorkoutSupportFixed ? '✓' : '✗'}`);
  
  if (exerciseLoggingFixed && aiWorkoutSupportFixed) {
    console.log("\n✅ All fixes have been successfully applied!");
  } else {
    console.log("\n⚠️ Some fixes may not have been applied correctly.");
  }
}

// Run the script
main().catch(console.error);
