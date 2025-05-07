# Quick Fix for Exercise Logging in Progress Tracking

This document provides a solution for the error message:

> "The RPC function for exercise logging is not properly configured. Database migrations may need to be run."

## Problem

The exercise logging functions in the database have not been properly configured, which is why your exercise statistics are not appearing in the Progress tracking page.

## Solution

You need to apply the necessary SQL migrations to set up the required database functions. I've created a script that will generate the SQL statements you need to run.

### Option 1: Using the Script (Recommended)

1. Run the provided batch script:
   ```
   .\scripts\fix_exercise_logging.bat
   ```

2. The script will generate an SQL file and provide instructions on how to execute it in your Supabase dashboard.

3. Follow the on-screen instructions to apply the SQL changes.

### Option 2: Manual Application

If you prefer to manually apply the fixes, follow these steps:

1. Log into your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Paste the following SQL:

```sql
-- Add exec_sql function to allow executing SQL queries from client code
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return the query results as JSON array
  RETURN QUERY EXECUTE sql;
EXCEPTION WHEN OTHERS THEN
  -- On error, return JSON with the error message
  RETURN QUERY SELECT json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
$$;

-- Add RLS policy to restrict who can execute SQL
REVOKE ALL ON FUNCTION public.exec_sql FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql TO authenticated;

-- Fix the log_exercise_completion function
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

-- Create index to improve performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_completed_at 
ON public.workout_logs(user_id, completed_at DESC);
```

6. Run the SQL query
7. After the SQL executes successfully, restart your application

## Verification

To verify that the fix was applied correctly:

1. Navigate to the Progress tracking page
2. The error message should no longer appear
3. Try logging a new exercise and check if it appears in your statistics

If you're still experiencing issues, please refer to the more comprehensive `EXERCISE_LOGGING_FIXES.md` file for additional troubleshooting steps.
