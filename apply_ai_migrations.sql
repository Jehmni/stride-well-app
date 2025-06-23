-- Add AI support fields to workout_plans table
ALTER TABLE public.workout_plans
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.user_profiles(id),
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create an index for faster queries on user_id and fitness_goal
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON public.workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_fitness_goal ON public.workout_plans(fitness_goal);

-- Update the RLS policies to allow users to access their own workout plans
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

-- Create configuration table for AI integrations
CREATE TABLE IF NOT EXISTS public.ai_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  api_key TEXT,
  api_endpoint TEXT,
  model_name TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on service_name for proper upserts
ALTER TABLE public.ai_configurations 
ADD CONSTRAINT IF NOT EXISTS unique_service_name UNIQUE (service_name);

-- Add example configuration with proper upsert
INSERT INTO public.ai_configurations (service_name, api_endpoint, model_name, is_enabled)
VALUES ('openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', FALSE)
ON CONFLICT (service_name) DO UPDATE SET
  api_endpoint = EXCLUDED.api_endpoint,
  model_name = EXCLUDED.model_name,
  updated_at = NOW();

-- Only administrators can access AI configurations
ALTER TABLE public.ai_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only app backend can access AI configurations"
  ON public.ai_configurations
  USING (false);

COMMENT ON TABLE public.ai_configurations IS 'Configuration for AI services used by the application';
COMMENT ON TABLE public.workout_plans IS 'Workout plans, including AI-generated plans for specific users';

-- Update the configuration with API key
UPDATE public.ai_configurations 
SET api_key='sk-cWEgrwCbMoJLSiyFff5hT8K5aJEtWoC6soQ_hzqhBQT3BlbkFJOtbsKTqLTfmxi0lWL5iwvKbeXO4zNz0wtg0mflQz4A', 
    is_enabled=true
WHERE service_name='openai';

-- Verify the configuration
SELECT * FROM public.ai_configurations WHERE service_name = 'openai';
