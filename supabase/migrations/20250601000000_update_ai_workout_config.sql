-- Update AI config to enable by default and include a proper model name
UPDATE public.ai_configurations
SET is_enabled = TRUE,
    model_name = 'gpt-4o',
    api_endpoint = 'https://api.openai.com/v1/chat/completions'
WHERE service_name = 'openai';

-- Add index to workout_logs for better tracking performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_id ON public.workout_logs(workout_id);

-- Add function to properly link AI workout plans to completed workouts
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
      workout_type = 'ai_generated'
  WHERE id = workout_log_id_param;
  
  RETURN FOUND;
END;
$$;

-- Add column to workout_logs to track AI workout plans
ALTER TABLE public.workout_logs
ADD COLUMN IF NOT EXISTS ai_workout_plan_id UUID REFERENCES public.workout_plans(id),
ADD COLUMN IF NOT EXISTS is_from_ai_plan BOOLEAN DEFAULT FALSE; 