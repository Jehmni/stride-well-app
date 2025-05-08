-- Create workout_progress table to track in-progress workouts across devices
CREATE TABLE IF NOT EXISTS public.workout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  completed_exercises TEXT[] NOT NULL DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add a unique constraint to ensure one progress record per user per workout
  CONSTRAINT workout_progress_user_workout_unique UNIQUE (user_id, workout_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_workout_progress_user_id ON public.workout_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_progress_workout_id ON public.workout_progress(workout_id);

-- Add RPC function to sync workout progress
CREATE OR REPLACE FUNCTION sync_workout_progress(
  user_id_param UUID,
  workout_id_param TEXT,
  completed_exercises_param TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert the workout progress
  INSERT INTO public.workout_progress (user_id, workout_id, completed_exercises, last_updated)
  VALUES (user_id_param, workout_id_param, completed_exercises_param, NOW())
  ON CONFLICT (user_id, workout_id) 
  DO UPDATE SET 
    completed_exercises = completed_exercises_param,
    last_updated = NOW();
    
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;
