-- 1. Add the link_ai_workout_to_log function if it doesn't exist
CREATE OR REPLACE FUNCTION public.link_ai_workout_to_log(
  workout_plan_id_param UUID,
  workout_log_id_param UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the workout log to reference the AI workout plan
  UPDATE public.workout_logs
  SET ai_workout_plan_id = workout_plan_id_param,
      is_from_ai_plan = TRUE,
      workout_type = 'ai_generated'
  WHERE id = workout_log_id_param;
  
  RETURN FOUND;
END;
$$;

-- 2. Make sure workout_logs has the necessary columns
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS ai_workout_plan_id UUID REFERENCES public.workout_plans(id),
ADD COLUMN IF NOT EXISTS is_from_ai_plan BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS workout_type TEXT; -- For 'custom', 'ai_generated', 'completed', etc.

-- 3. Create indexes to speed up workout log queries
CREATE INDEX IF NOT EXISTS idx_workout_logs_ai_plan_id ON public.workout_logs(ai_workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_type ON public.workout_logs(workout_type);

-- 4. Ensure AI-generated workouts are properly flagged in workout_plans
ALTER TABLE public.workout_plans
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

-- 5. Update existing workout_logs to have a workout_type if NULL
UPDATE public.workout_logs
SET workout_type = 'completed'
WHERE workout_type IS NULL;

-- 6. Make sure exercise_logs link correctly to workouts
ALTER TABLE public.exercise_logs
ADD COLUMN IF NOT EXISTS workout_plan_id UUID REFERENCES public.workout_plans(id);

-- 7. Create a function to properly log exercise completions from AI workouts
CREATE OR REPLACE FUNCTION public.log_ai_exercise_completion(
  user_id_param UUID,
  exercise_id_param UUID,
  workout_plan_id_param UUID,
  sets_completed_param INTEGER,
  reps_completed_param TEXT DEFAULT NULL,
  weight_used_param NUMERIC DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_log_id UUID;
BEGIN
  -- First create or find the workout log
  WITH workout_log AS (
    INSERT INTO public.workout_logs (
      user_id, 
      workout_id,
      ai_workout_plan_id,
      is_from_ai_plan,
      workout_type,
      completed_at
    )
    VALUES (
      user_id_param,
      workout_plan_id_param::TEXT,
      workout_plan_id_param,
      TRUE,
      'ai_generated',
      NOW()
    )
    ON CONFLICT (user_id, workout_id, date_trunc('day', completed_at))
    DO UPDATE SET
      completed_at = NOW()
    RETURNING id
  )
  
  -- Then insert the exercise log
  INSERT INTO public.exercise_logs (
    workout_log_id,
    exercise_id,
    sets_completed,
    reps_completed,
    weight_used,
    notes,
    completed_at,
    workout_plan_id
  )
  SELECT 
    wl.id,
    exercise_id_param,
    sets_completed_param,
    reps_completed_param,
    weight_used_param,
    notes_param,
    NOW(),
    workout_plan_id_param
  FROM workout_log wl
  RETURNING id INTO new_log_id;
  
  RETURN new_log_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$; 