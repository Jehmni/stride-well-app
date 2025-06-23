-- Fix workout completion tracking schema
-- This migration adds missing columns and tables for proper workout completion tracking

-- First, let's check what columns exist in workout_logs and add the missing ones
DO $$ 
BEGIN
  -- Add exercises_completed column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='exercises_completed') THEN
    ALTER TABLE public.workout_logs ADD COLUMN exercises_completed INTEGER DEFAULT 0;
  END IF;

  -- Add total_exercises column  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='total_exercises') THEN
    ALTER TABLE public.workout_logs ADD COLUMN total_exercises INTEGER DEFAULT 0;
  END IF;

  -- Add workout_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='workout_type') THEN
    ALTER TABLE public.workout_logs ADD COLUMN workout_type VARCHAR(50) DEFAULT 'custom';
  END IF;

  -- Add ai_workout_plan_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='ai_workout_plan_id') THEN
    ALTER TABLE public.workout_logs ADD COLUMN ai_workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create completed_workouts table if it doesn't exist (for backward compatibility)
CREATE TABLE IF NOT EXISTS public.completed_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_title TEXT NOT NULL,
  duration INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_ai_workout_plan_id 
ON public.workout_logs(ai_workout_plan_id) 
WHERE ai_workout_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_type 
ON public.workout_logs(workout_type);

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_completed 
ON public.workout_logs(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_completed_workouts_user_completed 
ON public.completed_workouts(user_id, completed_at DESC);

-- Update the log_ai_workout_completion function to ensure it works properly
CREATE OR REPLACE FUNCTION public.log_ai_workout_completion(
  p_user_id UUID,
  p_ai_workout_plan_id UUID,
  p_exercises_completed INTEGER DEFAULT 0,
  p_total_exercises INTEGER DEFAULT 0,
  p_duration_minutes INTEGER DEFAULT 0,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.workout_logs (
    user_id,
    ai_workout_plan_id,
    workout_type,
    exercises_completed,
    total_exercises,
    duration,
    notes,
    completed_at
  ) VALUES (
    p_user_id,
    p_ai_workout_plan_id,
    'ai_generated',
    p_exercises_completed,
    p_total_exercises,
    p_duration_minutes,
    p_notes,
    NOW()
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.completed_workouts TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_ai_workout_completion(UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;

-- Add comments
COMMENT ON FUNCTION public.log_ai_workout_completion IS 'Logs completion of an AI-generated workout session';
COMMENT ON TABLE public.workout_logs IS 'Detailed workout completion logs with exercise tracking';
COMMENT ON TABLE public.completed_workouts IS 'Simple workout completion tracking for backward compatibility';
