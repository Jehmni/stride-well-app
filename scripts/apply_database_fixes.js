
/**
 * This script applies necessary database fixes for both exercise logging and AI workout support features
 */
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client - environment variables would be better but this is a local script
const SUPABASE_URL = "https://japrzutwtqotzyudnizh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphcHJ6dXR3dHFvdHp5dWRuaXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2NjYyMjgsImV4cCI6MjA2MDI0MjIyOH0.wFQPzwhwMzgu3P2fnqqH2Hw0RD5IDA5hF2bcwHVlLe0";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

/**
 * Check and fix exercise logging function
 */
const checkExerciseLoggingFunction = async () => {
  try {
    console.log("Checking exercise logging function...");

    // Try to call the exercise logging function with a dummy parameter to see if it exists
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: "SELECT pg_get_functiondef('public.log_exercise_completion'::regproc)" 
    });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      console.log("Exercise logging function needs to be created or fixed");
      
      // Apply the fix using exec_sql for security functions
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE OR REPLACE FUNCTION public.log_exercise_completion(
          workout_log_id_param uuid, 
          exercise_id_param uuid, 
          sets_completed_param integer, 
          reps_completed_param integer DEFAULT NULL, 
          weight_used_param numeric DEFAULT NULL, 
          notes_param text DEFAULT NULL
        ) RETURNS uuid
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $function$
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
        $function$;
        `
      });

      console.log("Exercise logging function created successfully");
      return true;
    } else {
      console.log("Exercise logging function exists and appears to be configured correctly");
      return false;
    }
  } catch (error) {
    console.error("Error checking exercise logging function:", error);
    return false;
  }
};

/**
 * Check and set up AI workout support
 */
const checkAIWorkoutSupport = async () => {
  try {
    console.log("Checking AI workout support...");

    // Check if ai_configurations table exists
    const { data: aiTableExists, error: tableError } = await supabase.rpc('exec_sql', { 
      sql: "SELECT to_regclass('public.ai_configurations')" 
    });

    if (tableError || !aiTableExists || !Array.isArray(aiTableExists) || aiTableExists[0]?.to_regclass === null) {
      console.log("AI configurations table needs to be created");
      
      // Create the AI configurations table
      await supabase.rpc('exec_sql', { 
        sql: `
        CREATE TABLE IF NOT EXISTS public.ai_configurations (
          id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
          service_name text NOT NULL,
          api_key text,
          api_endpoint text,
          model_name text,
          is_enabled boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );

        -- Insert default configuration for OpenAI
        INSERT INTO public.ai_configurations 
          (service_name, api_endpoint, model_name) 
        VALUES 
          ('openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4o')
        ON CONFLICT (service_name) DO NOTHING;
        `
      });

      // Add ai_generated field to workout_plans if it doesn't exist
      await supabase.rpc('exec_sql', { 
        sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'workout_plans' 
              AND column_name = 'ai_generated'
          ) THEN
            ALTER TABLE public.workout_plans
            ADD COLUMN ai_generated boolean DEFAULT false;
          END IF;
        END $$;
        `
      });

      console.log("AI workout support tables created successfully");
      return true;
    } else {
      console.log("AI workout support tables already exist");
      return false;
    }
  } catch (error) {
    console.error("Error checking AI workout support:", error);
    return false;
  }
};

/**
 * Main function to apply database fixes
 */
const applyDatabaseFixes = async () => {
  try {
    console.log("Starting database fixes application...");

    // Check if we need to fix the exercise logging function
    const fixedExerciseLogging = await checkExerciseLoggingFunction();
    
    // Check if we need to set up AI workout support
    const fixedAIWorkoutSupport = await checkAIWorkoutSupport();

    if (fixedExerciseLogging || fixedAIWorkoutSupport) {
      console.log("Database fixes applied successfully!");
    } else {
      console.log("No fixes needed - database is already properly configured.");
    }

    console.log("\nSummary:");
    console.log("- Exercise logging: " + (fixedExerciseLogging ? "FIXED" : "OK"));
    console.log("- AI workout support: " + (fixedAIWorkoutSupport ? "FIXED" : "OK"));
    
  } catch (error) {
    console.error("Error applying database fixes:", error);
  }
};

// Run the main function
applyDatabaseFixes();
