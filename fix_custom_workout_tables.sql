-- Fix Custom Workout Tables
-- Creates the missing workouts and workout_exercises tables needed for custom workout functionality

-- =============================================
-- CREATE WORKOUTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER, -- 0-6 for Monday-Sunday, null for any day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CREATE WORKOUT_EXERCISES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL DEFAULT 3,
  reps INTEGER,
  duration INTEGER, -- For time-based exercises (seconds)
  rest_time INTEGER DEFAULT 60, -- Rest time in seconds
  notes TEXT,
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ADD MISSING COLUMNS TO EXERCISES TABLE
-- =============================================

-- Add equipment_required column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exercises' 
        AND column_name = 'equipment_required'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.exercises ADD COLUMN equipment_required TEXT;
    END IF;
END $$;

-- Add description column if it doesn't exist (required by some parts of the app)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'exercises' 
        AND column_name = 'description'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.exercises ADD COLUMN description TEXT;
    END IF;
END $$;

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_day_of_week ON public.workouts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_position);

-- =============================================
-- ENABLE RLS AND CREATE POLICIES
-- =============================================

-- Enable RLS on workouts table
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;

-- Workouts policies
DROP POLICY IF EXISTS "Users can view their own workouts" ON public.workouts;
CREATE POLICY "Users can view their own workouts" ON public.workouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workouts" ON public.workouts;
CREATE POLICY "Users can insert their own workouts" ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workouts" ON public.workouts;
CREATE POLICY "Users can update their own workouts" ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workouts" ON public.workouts;
CREATE POLICY "Users can delete their own workouts" ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on workout_exercises table
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;

-- Workout exercises policies
DROP POLICY IF EXISTS "Users can view workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can view workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_exercises.workout_id 
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can insert workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_exercises.workout_id 
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can update workout exercises" ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_exercises.workout_id 
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete workout exercises" ON public.workout_exercises;
CREATE POLICY "Users can delete workout exercises" ON public.workout_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workouts w 
      WHERE w.id = workout_exercises.workout_id 
      AND w.user_id = auth.uid()
    )
  );

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;

-- =============================================
-- FIX EXERCISES TABLE RLS POLICIES
-- =============================================

-- Enable RLS on exercises table if not already enabled
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete exercises" ON public.exercises;

-- Create permissive policies for exercises (exercises should be shared across all users)
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exercises" ON public.exercises
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exercises" ON public.exercises
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete exercises" ON public.exercises
  FOR DELETE TO authenticated
  USING (true);

-- Grant permissions on exercises table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.workouts IS 'Custom workouts created by users';
COMMENT ON TABLE public.workout_exercises IS 'Exercises within custom workouts with sets, reps, and order';

-- =============================================
-- INSERT SAMPLE EXERCISES (if table is empty)
-- =============================================

-- Insert some default exercises if none exist
INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 
    'Push-ups', 
    'Classic bodyweight pushing exercise', 
    'chest', 
    'Beginner', 
    'strength',
    null
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises WHERE name = 'Push-ups'
);

INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 
    'Squats', 
    'Basic leg strengthening exercise', 
    'legs', 
    'Beginner', 
    'strength',
    null
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises WHERE name = 'Squats'
);

INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 
    'Bicep Curls', 
    'Isolation exercise for biceps', 
    'arms', 
    'Intermediate', 
    'strength',
    'dumbbells'
WHERE NOT EXISTS (
    SELECT 1 FROM public.exercises WHERE name = 'Bicep Curls'
);