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
-- NOTE: API keys should NEVER be stored in the database
-- Store only non-sensitive configuration data here
CREATE TABLE IF NOT EXISTS public.ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL,
  api_endpoint TEXT,
  model_name TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  max_tokens INTEGER DEFAULT 1000,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint on service_name for proper upserts
ALTER TABLE public.ai_config 
ADD CONSTRAINT IF NOT EXISTS unique_service_name UNIQUE (service_name);

-- Add OpenAI configuration (without API key)
INSERT INTO public.ai_config (service_name, api_endpoint, model_name, is_enabled, max_tokens, temperature)
VALUES ('openai', 'https://api.openai.com/v1/chat/completions', 'gpt-4o', TRUE, 1000, 0.7)
ON CONFLICT (service_name) DO UPDATE SET
  api_endpoint = EXCLUDED.api_endpoint,
  model_name = EXCLUDED.model_name,
  is_enabled = EXCLUDED.is_enabled,
  max_tokens = EXCLUDED.max_tokens,
  temperature = EXCLUDED.temperature,
  updated_at = NOW();

-- Enable RLS for AI config (read-only for authenticated users)
ALTER TABLE public.ai_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read AI config"
  ON public.ai_config
  FOR SELECT
  USING ((select auth.role()) = 'authenticated');

COMMENT ON TABLE public.ai_config IS 'Non-sensitive AI service configuration. API keys stored in environment variables.';
COMMENT ON TABLE public.workout_plans IS 'Workout plans, including AI-generated plans for specific users';

-- 🔐 SECURITY BEST PRACTICE: API keys are stored in environment variables
-- Add this to your .env file:
-- OPENAI_API_KEY=your_actual_api_key_here
-- OPENAI_ORG_ID=your_org_id_here (optional)

-- Your app code should read the API key like this:
-- const openaiKey = process.env.OPENAI_API_KEY;

-- Verify the configuration (API key will be loaded from environment)
SELECT service_name, api_endpoint, model_name, is_enabled, max_tokens, temperature 
FROM public.ai_config 
WHERE service_name = 'openai';
