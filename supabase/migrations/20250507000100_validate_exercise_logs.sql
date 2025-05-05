-- Schema fix for handling edge cases in workout logs
-- This migration handles any potential issues by validating all exercise_logs

-- First, create an index to improve performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_completed_at 
ON public.workout_logs(user_id, completed_at DESC);

-- Create function to validate exercise logs
CREATE OR REPLACE FUNCTION public.validate_exercise_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
END;
$$;

-- Execute the validation function
SELECT validate_exercise_logs();

-- Drop the validation function when done
DROP FUNCTION IF EXISTS public.validate_exercise_logs();
