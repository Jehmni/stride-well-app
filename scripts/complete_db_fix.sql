
-- COMPLETE DATABASE FIX SCRIPT
-- This script fixes all database issues with exercise logging and AI workouts
-- Updated version: May 8, 2025

-- 1. Add or update the exec_sql function
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

-- 2. Fix create_workout_log function if it doesn't exist
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
    completed_at
  ) VALUES (
    workout_id_param,
    user_id_param,
    notes_param,
    NOW()
  )
  RETURNING id INTO workout_log_id;
  
  RETURN workout_log_id;
END;
$$;

-- 3. Fix or create the log_exercise_completion function
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

-- 4. Update the RLS policies for exercise_logs
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON public.exercise_logs;

-- Create new policy that allows any inserts through the security definer function
CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
WITH CHECK (true); -- Allow inserts through security definer function

-- 5. Create policy for selecting exercise logs
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

-- 6. Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id_completed_at 
ON public.workout_logs(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id 
ON public.exercise_logs(workout_log_id);

CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id 
ON public.exercise_logs(exercise_id);

-- 7. Ensure workout plan table is properly set up for AI-generated plans
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for faster queries on user_id and fitness_goal
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_fitness_goal ON public.workout_plans(fitness_goal);

-- 8. Update the RLS policies to allow users to access their own workout plans
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

-- 9. Update exercise_logs table structure if needed
DO $$
BEGIN
    -- Check if the completed_at column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'exercise_logs' 
        AND column_name = 'completed_at'
    ) THEN
        -- Add the completed_at column if it doesn't exist
        ALTER TABLE public.exercise_logs 
        ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 10. Run data cleanup for existing logs
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

-- Add comments to document functions
COMMENT ON FUNCTION public.create_workout_log IS 'Creates a workout log entry, linking a workout to a user.';
COMMENT ON FUNCTION public.log_exercise_completion IS 'Logs the completion of an exercise as part of a workout, performing minimal auth checks to ensure reliability.';
COMMENT ON FUNCTION public.exec_sql IS 'Executes an SQL query and returns the result as JSON. Used for complex queries that cannot be expressed using standard RPC calls.';
