
-- Add exercise_logs table schema
-- This table was referenced in code but missing from database schema

CREATE TABLE IF NOT EXISTS public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets_completed INTEGER NOT NULL,
  reps_completed INTEGER,
  weight_used NUMERIC,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id ON public.exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);

-- Add RLS policies
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own exercise logs through workout logs relationship
CREATE POLICY "Users can view their own exercise logs"
ON public.exercise_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);

-- Allow users to insert their own exercise logs
CREATE POLICY "Users can insert their own exercise logs"
ON public.exercise_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = exercise_logs.workout_log_id
    AND workout_logs.user_id = auth.uid()
  )
);
