-- Stage 2: Targeted FK indexes + RLS consolidation stubs (safe to run)
-- Context:
--   - Adds surgical covering indexes for frequently traversed foreign keys
--     outside the meal/nutrition/log domains to improve query performance.
--   - Prepares commented RLS consolidation templates for remaining tables
--     flagged by advisors. These are left commented to avoid changing
--     semantics without explicit review (many have public/friends rules).
--   - After 7–14 days of workload, consider pruning unused indexes.
--
-- Safety:
--   - All CREATE INDEX statements use IF NOT EXISTS to be idempotent.
--   - No policy semantics are changed in this migration (RLS stubs are commented).

BEGIN;

-- =============================================
-- TARGETED COVERING INDEXES (idempotent)
-- =============================================

-- Social / Activity
CREATE INDEX IF NOT EXISTS idx_activity_comments_activity_id ON public.activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_likes_user_id ON public.activity_likes(user_id);

-- Food diary and items
CREATE INDEX IF NOT EXISTS idx_food_diary_entries_food_item_id ON public.food_diary_entries(food_item_id);
CREATE INDEX IF NOT EXISTS idx_food_diary_entries_recipe_id ON public.food_diary_entries(recipe_id);
CREATE INDEX IF NOT EXISTS idx_food_items_created_by ON public.food_items(created_by);

-- Groups
CREATE INDEX IF NOT EXISTS idx_group_members_invited_by ON public.group_members(invited_by);

-- Achievements
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);

-- User-created collections
CREATE INDEX IF NOT EXISTS idx_user_groups_created_by ON public.user_groups(created_by);

-- Workout programs / templates
CREATE INDEX IF NOT EXISTS idx_workout_program_sessions_program_week_id ON public.workout_program_sessions(program_week_id);
CREATE INDEX IF NOT EXISTS idx_workout_program_sessions_workout_template_id ON public.workout_program_sessions(workout_template_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_created_by ON public.workout_programs(created_by);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_exercise_id ON public.workout_template_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_workout_template_id ON public.workout_template_exercises(workout_template_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_created_by ON public.workout_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_user_workouts_workout_template_id ON public.user_workouts(workout_template_id);

-- Plans / reminders
CREATE INDEX IF NOT EXISTS idx_workout_reminders_workout_plan_id ON public.workout_reminders(workout_plan_id);
CREATE INDEX IF NOT EXISTS idx_workouts_workout_template_id ON public.workouts(workout_template_id);

COMMIT;

-- =============================================
-- RLS CONSOLIDATION (COMMENTED TEMPLATE)
-- =============================================
-- Notes:
--   - Many tables have multiple permissive policies for the same role/action
--     to implement public/friends/owner/visibility logic.
--   - Consolidation should preserve behavior by OR-combining conditions
--     into a single policy per role/action while swapping auth functions to
--     (select auth.uid()) for performance.
--   - Because policy text differs per project, review qual/with_check from
--     pg_policies before uncommenting. Example template below.
--
-- Example (template): consolidate SELECT policies on public.activity_feed
-- DO $$
-- DECLARE r record;
-- BEGIN
--   -- Drop all existing policies (review required)
--   FOR r IN (
--     SELECT policyname FROM pg_policies
--     WHERE schemaname='public' AND tablename='activity_feed'
--   ) LOOP
--     EXECUTE format('DROP POLICY IF EXISTS %I ON public.activity_feed', r.policyname);
--   END LOOP;
--
--   -- Recreate consolidated policies preserving semantics (pseudo-logic):
--   --   visible if (owner) OR (friend visibility) OR (public visibility)
--   CREATE POLICY activity_feed_select ON public.activity_feed
--     FOR SELECT TO authenticated
--     USING (
--       activity_feed.user_id = (select auth.uid())
--       OR (activity_feed.visibility IN ('friends','public')
--           AND EXISTS (
--             SELECT 1 FROM public.user_connections c
--             WHERE (c.user_id = (select auth.uid()) AND c.friend_id = activity_feed.user_id)
--                OR (c.friend_id = (select auth.uid()) AND c.user_id = activity_feed.user_id)
--           )
--       )
--       OR activity_feed.visibility = 'public'
--     );
--   -- Repeat for INSERT/UPDATE/DELETE with appropriate owner/admin checks
-- END $$;
--
-- Repeat a similar reviewed consolidation per table flagged by the advisor.

-- =============================================
-- UNUSED INDEX PRUNING PLAN (DEFERRED)
-- =============================================
-- After 7–14 days of workload observation, query pg_stat_user_indexes to
-- confirm unused indexes, then drop safely during a low-traffic window.
-- Example:
--   -- Verify usage first:
--   -- SELECT relname AS table_name, indexrelname AS index_name, idx_scan
--   -- FROM pg_stat_user_indexes WHERE indexrelname = 'idx_workout_logs_user_end_time';
--   -- If idx_scan = 0 consistently:
--   -- DROP INDEX CONCURRENTLY IF EXISTS public.idx_workout_logs_user_end_time;


