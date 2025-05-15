-- Create body measurements table if it doesn't exist already
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  chest NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  arms NUMERIC,
  thighs NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

-- Body measurements policies
CREATE POLICY "Users can view their body measurements"
  ON public.body_measurements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their body measurements"
  ON public.body_measurements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their body measurements"
  ON public.body_measurements
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their body measurements"
  ON public.body_measurements
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS body_measurements_user_id_idx ON public.body_measurements(user_id);
CREATE INDEX IF NOT EXISTS body_measurements_recorded_at_idx ON public.body_measurements(recorded_at); 