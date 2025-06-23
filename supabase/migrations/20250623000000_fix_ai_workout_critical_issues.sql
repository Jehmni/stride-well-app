-- Fix AI workout generation critical issues
-- This migration addresses the 404 and 400 errors preventing AI workout functionality

-- 1. Create the missing get_ai_workout_plans RPC function
CREATE OR REPLACE FUNCTION public.get_ai_workout_plans(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  fitness_goal TEXT,
  created_at TIMESTAMPTZ,
  weekly_structure JSONB,
  exercises JSONB,
  completion_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wp.id,
    wp.title,
    wp.description,
    wp.fitness_goal,
    wp.created_at,
    wp.weekly_structure,
    wp.exercises,
    COALESCE(wl.completion_count, 0) as completion_count
  FROM public.workout_plans wp
  LEFT JOIN (
    SELECT 
      ai_workout_plan_id,
      COUNT(*) as completion_count
    FROM public.workout_logs 
    WHERE ai_workout_plan_id IS NOT NULL
    GROUP BY ai_workout_plan_id
  ) wl ON wp.id = wl.ai_workout_plan_id
  WHERE wp.user_id = p_user_id 
    AND wp.ai_generated = true
  ORDER BY wp.created_at DESC;
END;
$$;

-- 2. Ensure workout_logs has the correct structure for AI workout tracking
-- Add the ai_workout_plan_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_logs' 
    AND column_name = 'ai_workout_plan_id'
  ) THEN
    ALTER TABLE public.workout_logs 
    ADD COLUMN ai_workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add workout_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'workout_logs' 
    AND column_name = 'workout_type'
  ) THEN
    ALTER TABLE public.workout_logs 
    ADD COLUMN workout_type TEXT DEFAULT 'custom';
  END IF;
END $$;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_ai_workout_plan_id 
ON public.workout_logs(ai_workout_plan_id) 
WHERE ai_workout_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_logs_user_workout_type 
ON public.workout_logs(user_id, workout_type);

-- 5. Update RLS policies for workout_logs to allow AI workout queries
DROP POLICY IF EXISTS "Users can read their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can read their own workout logs" 
ON public.workout_logs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can create their own workout logs" 
ON public.workout_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can update their own workout logs" 
ON public.workout_logs FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_ai_workout_plans(UUID) TO authenticated;
GRANT SELECT ON public.workout_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.workout_logs TO authenticated;

-- 7. Create a helper function to log AI workout completions
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
    duration_minutes,
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

GRANT EXECUTE ON FUNCTION public.log_ai_workout_completion(UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_ai_workout_plans IS 'Retrieves AI-generated workout plans for a user with completion counts';
COMMENT ON FUNCTION public.log_ai_workout_completion IS 'Logs completion of an AI-generated workout session';
