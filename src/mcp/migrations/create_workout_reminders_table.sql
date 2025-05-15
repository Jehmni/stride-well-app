-- Create the workout_reminders table
CREATE TABLE IF NOT EXISTS public.workout_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_pattern TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS Policies
ALTER TABLE public.workout_reminders ENABLE ROW LEVEL SECURITY;

-- Policy for selecting reminders (users can only see their own)
CREATE POLICY workout_reminders_select_policy
  ON public.workout_reminders
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy for inserting reminders
CREATE POLICY workout_reminders_insert_policy
  ON public.workout_reminders
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy for updating reminders
CREATE POLICY workout_reminders_update_policy
  ON public.workout_reminders
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy for deleting reminders
CREATE POLICY workout_reminders_delete_policy
  ON public.workout_reminders
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_reminders_updated_at
BEFORE UPDATE ON public.workout_reminders
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 