-- Rollback for fix_custom_workout_tables_hardened.sql
-- WARNING: This rollback will remove tables and policies created by the migration and may delete user data.
-- Review carefully and run only in controlled environments (staging) after verifying backups.

BEGIN;

-- Drop sample exercises inserted by the migration (idempotent by name)
DELETE FROM public.exercises WHERE name IN ('Push-ups', 'Squats', 'Bicep Curls');

-- Drop policies on exercises that were added/altered
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view exercises') THEN
    DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can insert exercises') THEN
    DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can update exercises') THEN
    DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can delete exercises') THEN
    DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON public.exercises;
  END IF;
END$$;

-- Revoke grants added (conservative)
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.exercises FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.workouts FROM authenticated;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.workout_exercises FROM authenticated;

-- Drop RLS on workout_exercises and workouts tables (policies removed first)
ALTER TABLE IF EXISTS public.workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.exercises DISABLE ROW LEVEL SECURITY;

-- Drop triggers created by migration
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workouts_set_updated_at') THEN
    DROP TRIGGER IF EXISTS workouts_set_updated_at ON public.workouts;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workout_exercises_set_updated_at') THEN
    DROP TRIGGER IF EXISTS workout_exercises_set_updated_at ON public.workout_exercises;
  END IF;
END$$;

-- Drop tables (careful: data loss)
DROP TABLE IF EXISTS public.workout_exercises CASCADE;
DROP TABLE IF EXISTS public.workouts CASCADE;

-- Optionally remove columns we added to exercises
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exercises' AND column_name = 'equipment_required'
  ) THEN
    ALTER TABLE public.exercises DROP COLUMN IF EXISTS equipment_required;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'exercises' AND column_name = 'description'
  ) THEN
    -- Only drop description if it's empty across the table to avoid removing user-provided content
    PERFORM 1 FROM public.exercises WHERE description IS NOT NULL LIMIT 1;
    -- If the above PERFORM finds rows, description has data; we will NOT drop it to avoid data loss.
    -- Manual cleanup required if you want to remove this column.
  END IF;
END$$;

COMMIT;

-- Rollback notes:
-- 1) This script deletes tables and may remove data; ensure you have reliable backups before running.
-- 2) If you want a safer rollback, consider restoring a DB snapshot instead of running this script.
-- 3) Run in staging first and review results.
