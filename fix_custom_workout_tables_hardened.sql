-- Hardened migration: fix_custom_workout_tables_hardened.sql
-- Safe, idempotent migration for adding workouts and workout_exercises tables
-- Usage: Run with a service-role or database superuser account in CI
-- Important: This script attempts to be idempotent where practical. Review before running in production.

BEGIN;

-- Ensure required extensions (pgcrypto provides gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Timestamp helper: set updated_at on row changes
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CREATE WORKOUTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.workouts (
  id UUID PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER, -- 0-6 for Monday-Sunday, null for any day
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attach trigger to update updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workouts_set_updated_at'
  ) THEN
    CREATE TRIGGER workouts_set_updated_at
      BEFORE UPDATE ON public.workouts
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =============================================
-- CREATE WORKOUT_EXERCISES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT COALESCE(gen_random_uuid(), uuid_generate_v4()),
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

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'workout_exercises_set_updated_at'
  ) THEN
    CREATE TRIGGER workout_exercises_set_updated_at
      BEFORE UPDATE ON public.workout_exercises
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- =============================================
-- ADD MISSING COLUMNS TO EXERCISES TABLE (idempotent)
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exercises' AND column_name = 'equipment_required'
  ) THEN
    ALTER TABLE public.exercises ADD COLUMN equipment_required TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exercises' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.exercises ADD COLUMN description TEXT;
  END IF;
END$$;

-- =============================================
-- CREATE INDEXES (idempotent)
-- =============================================

CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON public.workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_workouts_day_of_week ON public.workouts(day_of_week);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON public.workout_exercises(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_order ON public.workout_exercises(workout_id, order_position);

-- =============================================
-- ENABLE RLS AND CREATE POLICIES
-- =============================================
-- NOTE: Applying RLS/policies can restrict access. Run this migration with a service role and verify app behavior.
-- Consider applying RLS in a separate maintenance window to test client behavior.
-- =============================================

-- Enable RLS on workouts table if not enabled
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'workouts' AND n.nspname = 'public' AND (
      SELECT relrowsecurity FROM pg_class WHERE oid = c.oid
    )
  ) THEN
    ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Workouts policies (restrict to owner for write, allow select to authenticated)
-- These policies assume the client uses Postgres JWT with auth.uid() available.
DROP POLICY IF EXISTS workouts_select_owner ON public.workouts;
CREATE POLICY workouts_select_owner ON public.workouts
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS workouts_insert_owner ON public.workouts;
CREATE POLICY workouts_insert_owner ON public.workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS workouts_update_owner ON public.workouts;
CREATE POLICY workouts_update_owner ON public.workouts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS workouts_delete_owner ON public.workouts;
CREATE POLICY workouts_delete_owner ON public.workouts
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on workout_exercises table
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'workout_exercises' AND n.nspname = 'public' AND (
      SELECT relrowsecurity FROM pg_class WHERE oid = c.oid
    )
  ) THEN
    ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Workout exercises policies: allow operations only if the parent workout belongs to the user
DROP POLICY IF EXISTS workout_exercises_select_owner ON public.workout_exercises;
CREATE POLICY workout_exercises_select_owner ON public.workout_exercises
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workout_exercises_insert_owner ON public.workout_exercises;
CREATE POLICY workout_exercises_insert_owner ON public.workout_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workout_exercises_update_owner ON public.workout_exercises;
CREATE POLICY workout_exercises_update_owner ON public.workout_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.workouts w
      WHERE w.id = workout_exercises.workout_id
      AND w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS workout_exercises_delete_owner ON public.workout_exercises;
CREATE POLICY workout_exercises_delete_owner ON public.workout_exercises
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
-- Be conservative: grant SELECT to authenticated; write operations should rely on RLS checks.
-- Grant full read/write permissions to authenticated users for these custom workout tables.
-- RLS policies still enforce ownership checks for write operations.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;

-- If you want to allow authenticated users to insert/update/delete via policies, you can GRANT those as well;
-- consider scoping destructive grants to a service role in production.
-- GRANT INSERT, UPDATE, DELETE ON public.workouts TO authenticated;
-- GRANT INSERT, UPDATE, DELETE ON public.workout_exercises TO authenticated;

-- =============================================
-- FIX EXERCISES TABLE RLS POLICIES (cautious)
-- =============================================
-- If exercises are shared and editable only by maintainers, avoid granting broad write access.
-- Here we allow authenticated to read and create (if desired), but restrict destructive operations.

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
CREATE POLICY "Anyone can view exercises" ON public.exercises
  FOR SELECT TO authenticated
  USING (true);

-- Insert/update/delete policies for exercises are intentionally conservative. Adjust if app requires user-generated exercises.
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
CREATE POLICY "Authenticated users can insert exercises" ON public.exercises
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only allow updates/deletes when explicitly required; consider using a separate moderation workflow for exercises.
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
CREATE POLICY "Authenticated users can update exercises" ON public.exercises
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON public.exercises;
CREATE POLICY "Authenticated users can delete exercises" ON public.exercises
  FOR DELETE TO authenticated
  USING (true);

-- Exercises are shared resources; allow authenticated users to read and manage entries.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
-- If you prefer to restrict destructive operations, remove UPDATE/DELETE here and rely on moderation workflows.

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE public.workouts IS 'Custom workouts created by users';
COMMENT ON TABLE public.workout_exercises IS 'Exercises within custom workouts with sets, reps, and order';

-- =============================================
-- INSERT SAMPLE EXERCISES (idempotent)
-- =============================================

INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 'Push-ups', 'Classic bodyweight pushing exercise', 'chest', 'Beginner', 'strength', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Push-ups');

INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 'Squats', 'Basic leg strengthening exercise', 'legs', 'Beginner', 'strength', NULL
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Squats');

INSERT INTO public.exercises (name, description, muscle_group, difficulty, exercise_type, equipment_required)
SELECT 'Bicep Curls', 'Isolation exercise for biceps', 'arms', 'Intermediate', 'strength', 'dumbbells'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises WHERE name = 'Bicep Curls');

COMMIT;

-- Migration notes:
-- 1) Run with service role credentials in CI to avoid RLS blocking migration actions.
-- 2) Test in a staging environment first. RLS changes can silently block client operations.
-- 3) If your project uses a DB migration tool, add this as a migration file and include a rollback script if needed.
