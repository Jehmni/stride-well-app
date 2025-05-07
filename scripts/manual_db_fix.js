// This script applies manual fixes to the Supabase database
// to ensure exercise logging and AI workout plan features work correctly

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

// Main function
async function main() {
  console.log("Starting database fixes...");
  
  // Apply the SQL files in order
  const files = [
    path.resolve('supabase/migrations/20250507000000_fix_exercise_log_completion_function.sql'),
    path.resolve('supabase/migrations/20250507000100_validate_exercise_logs.sql'),
    path.resolve('supabase/migrations/20250508000000_add_ai_workout_support.sql'),
    path.resolve('apply_ai_migrations.sql')
  ];
  
  for (const file of files) {
    await applySQL(file);
  }
  
  // Check if AI configurations exists
  const { data: aiConfigs, error: configError } = await supabase
    .from('ai_configurations')
    .select('id')
    .limit(1);
    
  if (configError || !aiConfigs || aiConfigs.length === 0) {
    console.log("Setting up AI configuration...");
    // Set up AI configuration
    await supabase.from('ai_configurations').insert([
      {
        service_name: 'openai',
        api_endpoint: 'https://api.openai.com/v1/chat/completions',
        model_name: 'gpt-4o',
        is_enabled: true
      }
    ]);
  }
  
  console.log("Database fixes completed!");
}

// Run the script
main().catch(console.error);
