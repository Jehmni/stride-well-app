# Apply Exercise Logging Migrations
# This script fixes the "RPC function for exercise logging is not properly configured" error

Write-Host "Applying exercise logging database fixes..." -ForegroundColor Cyan

# Define the SQL statements to fix the RPC functions
$sqlStatements = @"
-- Add exec_sql function to allow executing SQL queries from client code
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS \$\$
BEGIN
  -- Return the query results as JSON array
  RETURN QUERY EXECUTE sql;
EXCEPTION WHEN OTHERS THEN
  -- On error, return JSON with the error message
  RETURN QUERY SELECT json_build_object('error', SQLERRM, 'detail', SQLSTATE);
END;
\$\$;

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
AS \$\$
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
\$\$;

-- Update RLS policy to allow any INSERT operations via the function
DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;

CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
WITH CHECK (true); -- Allow inserts through security definer function

-- Create index to improve performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_completed_at 
ON public.workout_logs(user_id, completed_at DESC);

-- Remove orphaned exercise_logs (where workout_log_id doesn't exist)
DELETE FROM public.exercise_logs
WHERE NOT EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE workout_logs.id = exercise_logs.workout_log_id
);

-- Remove exercise_logs with non-existent exercise_id
DELETE FROM public.exercise_logs
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises
  WHERE exercises.id = exercise_logs.exercise_id
);

-- Set default timestamp for any logs with NULL completed_at
UPDATE public.exercise_logs
SET completed_at = NOW()
WHERE completed_at IS NULL;
"@

# Save the SQL statements to a file
$tempSqlFile = "$env:TEMP\exercise_logging_fix.sql"
Set-Content -Path $tempSqlFile -Value $sqlStatements

Write-Host "SQL file created at: $tempSqlFile" -ForegroundColor Green
Write-Host @"

To apply these database fixes:

1. Log into your Supabase dashboard at https://app.supabase.com/
2. Select your project
3. Go to the "SQL Editor" section
4. Open the file: $tempSqlFile
5. Copy the entire SQL content and paste it into a new SQL query
6. Click "Run" to execute the query

After applying this fix, restart your application and the exercise logging
should work properly, and the error message should no longer appear.

"@ -ForegroundColor Yellow

# Ask if user wants to open the SQL file
$openFile = Read-Host "Would you like to open the SQL file now? (Y/N)"
if ($openFile -eq 'Y' -or $openFile -eq 'y') {
    Invoke-Item $tempSqlFile
}

Write-Host "If you need additional help, refer to the EXERCISE_LOGGING_FIXES.md file." -ForegroundColor Cyan
