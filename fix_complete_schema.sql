-- Comprehensive database schema fix
-- This will create the correct table structure that matches the application code

-- Step 1: Drop existing problematic tables if they exist to recreate them properly
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.workout_progress CASCADE;

-- Step 2: Create workout_logs table with correct structure
CREATE TABLE public.workout_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  duration INTEGER NOT NULL,
  calories_burned INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional columns from recent migrations
  exercises_completed INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  workout_type VARCHAR(50) DEFAULT 'custom',
  ai_workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE CASCADE
);

-- Step 3: Create exercise_logs table with correct structure
CREATE TABLE public.exercise_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER NOT NULL,
  reps_completed INTEGER,
  weight_used NUMERIC,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create workout_progress table with correct structure
CREATE TABLE public.workout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  completed_exercises JSONB DEFAULT '[]'::jsonb,
  progress_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, workout_id)
);

-- Step 5: Create indexes for performance
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX idx_workout_logs_ai_workout_plan_id ON public.workout_logs(ai_workout_plan_id) WHERE ai_workout_plan_id IS NOT NULL;
CREATE INDEX idx_workout_logs_completed_at ON public.workout_logs(completed_at DESC);

CREATE INDEX idx_exercise_logs_workout_log_id ON public.exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);

CREATE INDEX idx_workout_progress_user_id ON public.workout_progress(user_id);
CREATE INDEX idx_workout_progress_workout_id ON public.workout_progress(workout_id);

-- Step 6: Set up RLS policies (Row Level Security)
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_logs
CREATE POLICY "Users can view their own workout logs" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" ON public.workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for exercise_logs
CREATE POLICY "Users can view their own exercise logs" ON public.exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl 
      WHERE wl.id = exercise_logs.workout_log_id 
      AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own exercise logs" ON public.exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl 
      WHERE wl.id = exercise_logs.workout_log_id 
      AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own exercise logs" ON public.exercise_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl 
      WHERE wl.id = exercise_logs.workout_log_id 
      AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own exercise logs" ON public.exercise_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl 
      WHERE wl.id = exercise_logs.workout_log_id 
      AND wl.user_id = auth.uid()
    )
  );

-- RLS policies for workout_progress
CREATE POLICY "Users can view their own workout progress" ON public.workout_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout progress" ON public.workout_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout progress" ON public.workout_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout progress" ON public.workout_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Step 7: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_progress TO authenticated;

-- Step 8: Create necessary RPC functions
CREATE OR REPLACE FUNCTION public.log_workout_with_exercises(
  workout_id_param UUID,
  user_id_param UUID,
  duration_param INTEGER,
  calories_param INTEGER,
  exercise_data_param JSONB,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
  exercise_item JSONB;
BEGIN
  -- Insert the workout log
  INSERT INTO public.workout_logs (
    user_id,
    workout_id,
    duration,
    calories_burned,
    notes,
    ai_workout_plan_id,
    workout_type,
    total_exercises,
    exercises_completed
  ) VALUES (
    user_id_param,
    workout_id_param::text,
    duration_param,
    calories_param,
    notes_param,
    workout_id_param,
    'ai_generated',
    jsonb_array_length(exercise_data_param),
    jsonb_array_length(exercise_data_param)
  ) RETURNING id INTO workout_log_id;
  
  -- Insert exercise logs
  FOR exercise_item IN SELECT * FROM jsonb_array_elements(exercise_data_param)
  LOOP
    INSERT INTO public.exercise_logs (
      workout_log_id,
      exercise_id,
      exercise_name,
      sets_completed,
      reps_completed,
      weight_used,
      notes
    ) VALUES (
      workout_log_id,
      (exercise_item->>'exercise_id')::UUID,
      exercise_item->>'exercise_name',
      (exercise_item->>'sets')::INTEGER,
      (exercise_item->>'reps')::INTEGER,
      (exercise_item->>'weight')::NUMERIC,
      exercise_item->>'notes'
    );
  END LOOP;
  
  RETURN workout_log_id;
END;
$$;

-- Create sync function for workout progress
CREATE OR REPLACE FUNCTION public.sync_workout_progress(
  user_id_param UUID,
  workout_id_param TEXT,
  completed_exercises_param JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  progress_id UUID;
BEGIN
  INSERT INTO public.workout_progress (
    user_id,
    workout_id,
    completed_exercises,
    updated_at
  ) VALUES (
    user_id_param,
    workout_id_param,
    completed_exercises_param,
    NOW()
  )
  ON CONFLICT (user_id, workout_id)
  DO UPDATE SET
    completed_exercises = completed_exercises_param,
    updated_at = NOW()
  RETURNING id INTO progress_id;
  
  RETURN progress_id;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.log_workout_with_exercises(UUID, UUID, INTEGER, INTEGER, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_workout_progress(UUID, TEXT, JSONB) TO authenticated;
