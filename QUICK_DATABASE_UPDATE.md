
# Database Update for Exercise Logging and AI Workout Features

This document provides instructions to ensure that both the exercise logging and AI workout suggestion features are properly configured in the database.

## Quick Fix

Run the consolidated database fix script:

```
.\scripts\apply_database_fixes.bat
```

This script will:
1. Check if the exercise logging function (`log_exercise_completion`) exists and fix it if needed
2. Check if the AI workout support tables and columns exist and create them if needed
3. Update RLS policies to ensure proper data access control

## What This Fixes

### Exercise Logging Issues
- Ensures the exercise_logs table is properly created
- Fixes the `log_exercise_completion` function to handle security properly
- Sets up appropriate RLS policies for exercise logging

### AI Workout Support
- Adds necessary columns to the workout_plans table
- Creates the ai_configurations table if it doesn't exist
- Sets up RLS policies for AI workout plans

## Verifying the Fix

After running the script, you should see a summary indicating whether both features are properly set up. If any issues persist, check the console output for specific error messages.

## Manual Application

If you prefer to manually apply the fixes, you can:

1. Go to the Supabase SQL Editor
2. Run the SQL statements from:
   - `scripts/fix_exercise_logging.ps1` for exercise logging
   - `supabase/migrations/20250508000000_add_ai_workout_support.sql` for AI workout support

## API Key Configuration

To enable AI workout generation, you need to provide an OpenAI API key:

```sql
UPDATE public.ai_configurations 
SET api_key='your-api-key', is_enabled=true
WHERE service_name='openai';
```

Or set it in your environment variables:
```
VITE_OPENAI_API_KEY=your-api-key
```
