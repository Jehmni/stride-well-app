// This script tests the application's exercise logging and AI workout functionality

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import readline from 'readline';

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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

async function checkExerciseLogging() {
  try {
    // Check if the exercise_logs table exists
    console.log("\nChecking exercise logs functionality...");
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exercise_logs');"
      });

    if (tableError) {
      console.error("Error checking tables:", tableError.message);
      return false;
    }

    const tableExists = tableInfo[0].exists;
    console.log(tableExists ? "✓ Exercise logs table exists" : "✗ Exercise logs table does not exist");

    // Check if log_exercise_completion function exists
    const { data: functionInfo, error: functionError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM pg_proc JOIN pg_namespace ON pg_namespace.oid = pg_proc.pronamespace WHERE proname = 'log_exercise_completion' AND nspname = 'public');"
      });

    if (functionError) {
      console.error("Error checking function:", functionError.message);
      return false;
    }

    const functionExists = functionInfo[0].exists;
    console.log(functionExists ? "✓ Log exercise completion function exists" : "✗ Log exercise completion function does not exist");

    return tableExists && functionExists;
  } catch (error) {
    console.error("Error checking exercise logging:", error.message);
    return false;
  }
}

async function checkAIWorkoutSupport() {
  try {
    console.log("\nChecking AI workout support...");
    // Check if workout_plans table has ai_generated column
    const { data: columnInfo, error: columnError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'workout_plans' AND column_name = 'ai_generated');"
      });

    if (columnError) {
      console.error("Error checking columns:", columnError.message);
      return false;
    }

    const columnExists = columnInfo[0].exists;
    console.log(columnExists ? "✓ AI generated column exists in workout plans" : "✗ AI generated column does not exist in workout plans");

    // Check if ai_configurations table exists
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ai_configurations');"
      });

    if (tableError) {
      console.error("Error checking tables:", tableError.message);
      return false;
    }

    const tableExists = tableInfo[0].exists;
    console.log(tableExists ? "✓ AI configurations table exists" : "✗ AI configurations table does not exist");

    return columnExists && tableExists;
  } catch (error) {
    console.error("Error checking AI workout support:", error.message);
    return false;
  }
}

async function main() {
  console.log("===== Application Fix Verification =====");

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    console.log("⚠️ Not authenticated. Some tests may fail.");
  } else {
    console.log(`ℹ️ Authenticated as ${user.email}`);
  }

  // Check exercise logging functionality
  const exerciseLoggingOk = await checkExerciseLogging();
  
  // Check AI workout support
  const aiWorkoutOk = await checkAIWorkoutSupport();

  console.log("\n===== Summary =====");
  console.log(`Exercise logging: ${exerciseLoggingOk ? '✓' : '✗'}`);
  console.log(`AI workout support: ${aiWorkoutOk ? '✓' : '✗'}`);

  if (exerciseLoggingOk && aiWorkoutOk) {
    console.log("\n✅ All fixes appear to be applied correctly!");
  } else {
    console.log("\n⚠️ Some fixes may not be applied correctly. Run the manual_db_fix.js script to apply all fixes.");
  }

  rl.close();
}

// Run the script
main()
  .catch(console.error)
  .finally(() => process.exit(0));
