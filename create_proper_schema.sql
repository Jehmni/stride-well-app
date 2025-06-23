-- COMPREHENSIVE DATABASE SCHEMA FIX
-- This migration creates the exact table structure expected by the application code
-- Based on analysis of TypeScript types and service implementations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- STEP 1: DROP EXISTING PROBLEMATIC TABLES
-- =============================================

-- Drop existing tables if they exist with wrong structure
DROP TABLE IF EXISTS public.exercise_logs CASCADE;
DROP TABLE IF EXISTS public.workout_logs CASCADE;
DROP TABLE IF EXISTS public.workout_progress CASCADE;

-- =============================================
-- STEP 2: CREATE WORKOUT_LOGS TABLE
-- =============================================

CREATE TABLE public.workout_logs (
  -- Primary key and user reference
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  
  -- Core workout identification
  workout_id TEXT NOT NULL,
  
  -- Workout metrics
  duration INTEGER, -- in minutes
  calories_burned INTEGER,
  notes TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  
  -- Timestamps
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE, -- For stats queries
  end_time TIMESTAMP WITH TIME ZONE, -- For completion tracking in stats
  
  -- Workout categorization
  workout_type TEXT DEFAULT 'custom',
  is_custom BOOLEAN DEFAULT true,
  is_from_ai_plan BOOLEAN DEFAULT false,
  
  -- Workout details
  workout_name TEXT,
  workout_description TEXT,
  
  -- AI workout relationship
  ai_workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 3: CREATE EXERCISE_LOGS TABLE
-- =============================================

CREATE TABLE public.exercise_logs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Foreign key relationships
  workout_log_id UUID NOT NULL REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  workout_plan_id UUID REFERENCES public.workout_plans(id) ON DELETE SET NULL,
  
  -- Exercise performance data
  sets_completed INTEGER NOT NULL DEFAULT 0,
  reps_completed INTEGER,
  weight_used NUMERIC(6,2), -- Support up to 9999.99 kg/lbs
  
  -- Additional data
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 4: CREATE WORKOUT_PROGRESS TABLE
-- =============================================

CREATE TABLE public.workout_progress (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User and workout identification
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_id TEXT NOT NULL,
  
  -- Progress tracking
  completed_exercises TEXT[] DEFAULT '{}', -- Array of exercise IDs
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one progress record per user per workout
  UNIQUE(user_id, workout_id)
);

-- =============================================
-- STEP 5: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- workout_logs indexes
CREATE INDEX idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX idx_workout_logs_workout_id ON public.workout_logs(workout_id);
CREATE INDEX idx_workout_logs_ai_workout_plan_id ON public.workout_logs(ai_workout_plan_id) WHERE ai_workout_plan_id IS NOT NULL;
CREATE INDEX idx_workout_logs_completed_at ON public.workout_logs(completed_at DESC);
CREATE INDEX idx_workout_logs_date ON public.workout_logs(date DESC);
CREATE INDEX idx_workout_logs_end_time ON public.workout_logs(end_time) WHERE end_time IS NOT NULL;
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, date DESC);
CREATE INDEX idx_workout_logs_user_completed ON public.workout_logs(user_id, completed_at DESC);

-- exercise_logs indexes
CREATE INDEX idx_exercise_logs_workout_log_id ON public.exercise_logs(workout_log_id);
CREATE INDEX idx_exercise_logs_exercise_id ON public.exercise_logs(exercise_id);
CREATE INDEX idx_exercise_logs_workout_plan_id ON public.exercise_logs(workout_plan_id) WHERE workout_plan_id IS NOT NULL;
CREATE INDEX idx_exercise_logs_completed_at ON public.exercise_logs(completed_at DESC);

-- workout_progress indexes
CREATE INDEX idx_workout_progress_user_id ON public.workout_progress(user_id);
CREATE INDEX idx_workout_progress_workout_id ON public.workout_progress(workout_id);
CREATE INDEX idx_workout_progress_last_updated ON public.workout_progress(last_updated DESC);

-- =============================================
-- STEP 6: SET UP ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_progress ENABLE ROW LEVEL SECURITY;

-- workout_logs RLS policies
CREATE POLICY "Users can view their own workout logs" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" ON public.workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- exercise_logs RLS policies
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

-- workout_progress RLS policies
CREATE POLICY "Users can view their own workout progress" ON public.workout_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout progress" ON public.workout_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout progress" ON public.workout_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout progress" ON public.workout_progress
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STEP 7: GRANT PERMISSIONS
-- =============================================

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_progress TO authenticated;

-- Grant usage on sequences (for UUID generation)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =============================================
-- STEP 8: CREATE NECESSARY RPC FUNCTIONS
-- =============================================

-- Function to log complete workout with exercises
CREATE OR REPLACE FUNCTION public.log_workout_with_exercises(
  p_user_id UUID,
  p_workout_id TEXT,
  p_duration INTEGER DEFAULT NULL,
  p_calories_burned INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_rating INTEGER DEFAULT NULL,
  p_workout_type TEXT DEFAULT 'custom',
  p_workout_name TEXT DEFAULT NULL,
  p_workout_description TEXT DEFAULT NULL,
  p_ai_workout_plan_id UUID DEFAULT NULL,
  p_exercises JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workout_log_id UUID;
  v_exercise JSONB;
BEGIN
  -- Insert workout log
  INSERT INTO public.workout_logs (
    user_id,
    workout_id,
    duration,
    calories_burned,
    notes,
    rating,
    workout_type,
    workout_name,
    workout_description,
    ai_workout_plan_id,
    is_custom,
    is_from_ai_plan,
    completed_at,
    date,
    end_time
  ) VALUES (
    p_user_id,
    p_workout_id,
    p_duration,
    p_calories_burned,
    p_notes,
    p_rating,
    p_workout_type,
    p_workout_name,
    p_workout_description,
    p_ai_workout_plan_id,
    (p_workout_type = 'custom'),
    (p_ai_workout_plan_id IS NOT NULL),
    NOW(),
    CURRENT_DATE,
    NOW()
  ) RETURNING id INTO v_workout_log_id;
  
  -- Insert exercise logs if provided
  IF p_exercises IS NOT NULL AND jsonb_array_length(p_exercises) > 0 THEN
    FOR v_exercise IN SELECT * FROM jsonb_array_elements(p_exercises)
    LOOP
      INSERT INTO public.exercise_logs (
        workout_log_id,
        exercise_id,
        sets_completed,
        reps_completed,
        weight_used,
        notes,
        workout_plan_id
      ) VALUES (
        v_workout_log_id,
        (v_exercise->>'exercise_id')::UUID,
        COALESCE((v_exercise->>'sets_completed')::INTEGER, 0),
        (v_exercise->>'reps_completed')::INTEGER,
        (v_exercise->>'weight_used')::NUMERIC,
        v_exercise->>'notes',
        p_ai_workout_plan_id
      );
    END LOOP;
  END IF;
  
  RETURN v_workout_log_id;
END;
$$;

-- Function to sync workout progress
CREATE OR REPLACE FUNCTION public.sync_workout_progress(
  p_user_id UUID,
  p_workout_id TEXT,
  p_completed_exercises TEXT[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  INSERT INTO public.workout_progress (
    user_id,
    workout_id,
    completed_exercises,
    last_updated
  ) VALUES (
    p_user_id,
    p_workout_id,
    p_completed_exercises,
    NOW()
  )
  ON CONFLICT (user_id, workout_id)
  DO UPDATE SET
    completed_exercises = p_completed_exercises,
    last_updated = NOW()
  RETURNING id INTO v_progress_id;
  
  RETURN v_progress_id;
END;
$$;

-- Function to log AI workout completion (for compatibility)
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
  v_workout_log_id UUID;
  v_workout_plan_title TEXT;
BEGIN
  -- Get the workout plan title
  SELECT title INTO v_workout_plan_title
  FROM public.workout_plans
  WHERE id = p_ai_workout_plan_id;
  
  -- Create workout log entry
  SELECT public.log_workout_with_exercises(
    p_user_id := p_user_id,
    p_workout_id := p_ai_workout_plan_id::TEXT,
    p_duration := p_duration_minutes,
    p_calories_burned := NULL,
    p_notes := p_notes,
    p_rating := NULL,
    p_workout_type := 'ai_generated',
    p_workout_name := v_workout_plan_title,
    p_workout_description := NULL,
    p_ai_workout_plan_id := p_ai_workout_plan_id,
    p_exercises := '[]'::jsonb
  ) INTO v_workout_log_id;
  
  RETURN v_workout_log_id;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.log_workout_with_exercises(UUID, TEXT, INTEGER, INTEGER, TEXT, INTEGER, TEXT, TEXT, TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_workout_progress(UUID, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_ai_workout_completion(UUID, UUID, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;

-- =============================================
-- STEP 9: CREATE UPDATE TRIGGERS
-- =============================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- STEP 10: ADD HELPFUL COMMENTS
-- =============================================

COMMENT ON TABLE public.workout_logs IS 'Stores completed workout session data with metrics and references';
COMMENT ON TABLE public.exercise_logs IS 'Stores individual exercise performance data within workout sessions';
COMMENT ON TABLE public.workout_progress IS 'Tracks ongoing workout progress for incomplete sessions';

COMMENT ON COLUMN public.workout_logs.end_time IS 'Used by stats to determine workout completion';
COMMENT ON COLUMN public.workout_logs.date IS 'Used by stats for date-based filtering';
COMMENT ON COLUMN public.workout_logs.ai_workout_plan_id IS 'Links to AI-generated workout plans';
COMMENT ON COLUMN public.exercise_logs.workout_plan_id IS 'Optional link to workout plan for context';
COMMENT ON COLUMN public.workout_progress.completed_exercises IS 'Array of exercise IDs that have been completed';

-- =============================================
-- FINAL VERIFICATION QUERIES
-- =============================================

-- Verify table creation
SELECT 
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workout_logs', 'exercise_logs', 'workout_progress')
ORDER BY tablename;
