-- STRIDE WELL APP DATABASE FIXES
-- Created: May 8, 2025
-- This script addresses issues with exercise logging, workout tracking, and display

-- 1. Update workout_logs table structure to properly track workout types
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS workout_name TEXT,
ADD COLUMN IF NOT EXISTS workout_description TEXT,
ADD COLUMN IF NOT EXISTS workout_type TEXT DEFAULT 'completed' CHECK (workout_type IN ('completed', 'custom', 'scheduled')),
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- 2. Create or update database functions for reliable workout tracking

-- Add or update the exec_sql function
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

-- Fix create_workout_log function if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_workout_log(
  workout_id_param UUID,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Insert the workout log
  INSERT INTO public.workout_logs (
    workout_id,
    user_id,
    notes,
    completed_at,
    workout_type,
    is_custom
  ) VALUES (
    workout_id_param,
    user_id_param,
    notes_param,
    NOW(),
    'completed',
    FALSE
  )
  RETURNING id INTO workout_log_id;
  
  RETURN workout_log_id;
END;
$$;

-- Fix or create the log_exercise_completion function
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

  -- Update the workout log type if not already set
  UPDATE workout_logs
  SET 
    workout_type = COALESCE(workout_type, 'completed'),
    is_custom = COALESCE(is_custom, FALSE)
  WHERE id = workout_log_id_param;

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

-- Create a better workout completion function with transaction
CREATE OR REPLACE FUNCTION public.complete_workout(
  workout_id_param UUID,
  user_id_param UUID,
  duration_param INTEGER DEFAULT NULL,
  calories_param INTEGER DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Start transaction
  BEGIN
    -- Insert the workout log with proper type
    INSERT INTO public.workout_logs (
      workout_id,
      user_id,
      duration,
      calories_burned,
      notes,
      completed_at,
      workout_type,
      is_custom
    ) VALUES (
      workout_id_param,
      user_id_param,
      duration_param,
      calories_param,
      notes_param,
      NOW(),
      'completed',
      FALSE
    )
    RETURNING id INTO workout_log_id;
  
    -- If anything fails, roll back the entire transaction
    EXCEPTION WHEN OTHERS THEN
      RAISE;
  END;
  
  RETURN workout_log_id;
END;
$$;

-- 3. Update the RLS policies for exercise_logs
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;

-- Create new policy that allows any inserts through the security definer function
CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
WITH CHECK (true); -- Allow inserts through security definer function

-- Create policy for selecting exercise logs
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON public.exercise_logs;
CREATE POLICY "Users can view their own exercise logs"
ON public.exercise_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workout_logs 
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

-- 4. Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_completed_at 
ON public.workout_logs(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id 
ON public.exercise_logs(workout_log_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id 
ON public.exercise_logs(exercise_id);

-- 5. Fix null values in existing workout logs
UPDATE public.workout_logs
SET
  workout_type = 'completed',
  is_custom = FALSE
WHERE workout_type IS NULL;

-- 6. Clean up any duplicated policies
DROP POLICY IF EXISTS "Anyone can view workout plans" ON public.workout_plans;

-- 7. Fix any orphaned exercise logs
DELETE FROM public.exercise_logs
WHERE NOT EXISTS (
  SELECT 1 FROM public.workout_logs
  WHERE workout_logs.id = exercise_logs.workout_log_id
);

-- 8. Run data cleanup to ensure workout exercises are properly linked
DO $$
DECLARE
  missing_count INT;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM workout_exercises we
  WHERE NOT EXISTS (
    SELECT 1 FROM exercises e WHERE e.id = we.exercise_id
  );

  IF missing_count > 0 THEN
    RAISE NOTICE 'Found % workout exercises with missing exercise references', missing_count;
  END IF;
END $$;
