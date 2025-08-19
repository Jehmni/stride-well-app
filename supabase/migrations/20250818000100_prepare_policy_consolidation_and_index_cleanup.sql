-- Migration: Prepare policy consolidation and safe index cleanup
-- Date: 2025-08-18
-- Purpose:
--   1) Document and stage consolidation for duplicate permissive RLS policies (performance optimization)
--   2) Stage removal of duplicate/unused indexes after an observation window
--
-- IMPORTANT:
-- - This migration is NON-DESTRUCTIVE by default. All destructive commands are commented out.
-- - Review production query patterns and index usage over a 7–14 day observation window before enabling drops.
-- - Replace TODO placeholders with your combined predicates if consolidating policies.

-- =============================================
-- CONTEXT: Why consolidate permissive policies?
-- =============================================
-- Multiple permissive policies for the same table/role/action cause Postgres to evaluate more predicates per query.
-- Consolidation reduces overhead by combining equivalent conditions (often via OR) into a single policy per role/action.
--
-- Example pattern (illustrative only; adapt to each table's semantics):
--
-- DROP POLICY IF EXISTS "Users can manage their own activity" ON public.activity_feed;
-- DROP POLICY IF EXISTS "Users can view their own activity feed" ON public.activity_feed;
-- CREATE POLICY "Users can read activity" ON public.activity_feed
--   FOR SELECT TO authenticated
--   USING (
--     -- TODO: Combine original predicates here using OR, e.g.:
--     -- (user_id = (select auth.uid())) OR (visibility IN ('friends','public'))
--     true
--   );
--
-- Notes:
-- - Keep role scoping explicit (TO authenticated/anon) where appropriate.
-- - Preserve stricter policies (e.g., admin overrides) if they model different access paths.

-- =============================================
-- STAGED INDEX CLEANUP (Duplicate/Unused)
-- =============================================
-- Based on advisor output, the following indexes are duplicates. Drop one of each pair.
-- Execute during a low-traffic window AFTER confirming no dependencies (e.g., views, constraints) rely on them.

-- exercise_logs duplicates
-- DROP INDEX IF EXISTS public.exercise_logs_exercise_id_idx;      -- keep: idx_exercise_logs_exercise_id
-- DROP INDEX IF EXISTS public.exercise_logs_workout_log_id_idx;   -- keep: idx_exercise_logs_workout_log_id

-- food_diary_entries duplicates
-- DROP INDEX IF EXISTS public.idx_food_diary_user_date;           -- keep: idx_food_diary_entries_user_date

-- nutrition_targets duplicates
-- DROP INDEX IF EXISTS public.idx_nutrition_targets_active;       -- keep: idx_nutrition_targets_user_active

-- workout_logs duplicates
-- DROP INDEX IF EXISTS public.workout_logs_user_id_idx;           -- keep: idx_workout_logs_user_id

-- =============================================
-- UN-USED INDEXES (Candidates)
-- =============================================
-- The advisor flagged many unused indexes. Index usage stats can reset on restart and may be environment-specific.
-- Observe for 7–14 days under typical load, then consider dropping those still unused.
--
-- Suggested approach:
-- 1) Record current usage via pg_stat_user_indexes.
-- 2) Re-check after observation. Only then drop indexes still at zero scans.
--
-- Helper: quick snapshot of index usage (run manually):
--   SELECT schemaname, relname AS table_name, indexrelname AS index_name,
--          idx_scan, idx_tup_read, idx_tup_fetch, last_vacuum, last_analyze
--   FROM pg_stat_user_indexes
--   WHERE schemaname = 'public'
--   ORDER BY idx_scan ASC, indexrelname;
--
-- Example candidates (DO NOT DROP until confirmed unused in prod):
-- -- workout_logs
-- -- DROP INDEX IF EXISTS public.idx_workout_logs_completed_at;
-- -- DROP INDEX IF EXISTS public.idx_workout_logs_end_time;
-- -- DROP INDEX IF EXISTS public.idx_workout_logs_workout_id;
-- -- DROP INDEX IF EXISTS public.workout_logs_user_id_idx; -- note: duplicate listed above; prefer dropping this as duplicate
--
-- -- exercise_logs
-- -- DROP INDEX IF EXISTS public.idx_exercise_logs_completed_at;
-- -- DROP INDEX IF EXISTS public.idx_exercise_logs_exercise_id;     -- if truly unused; else keep
-- -- DROP INDEX IF EXISTS public.exercise_logs_completed_at_idx;
--
-- -- user_profiles
-- -- DROP INDEX IF EXISTS public.idx_user_profiles_email;
-- -- DROP INDEX IF EXISTS public.idx_user_profiles_fitness_level;
-- -- DROP INDEX IF EXISTS public.idx_user_profiles_id;
--
-- (More unused indexes were reported; curate based on real workload.)

-- =============================================
-- NOTES & SAFETY
-- =============================================
-- - Always test policy changes in staging; consolidation must preserve access semantics.
-- - For index removals: capture EXPLAIN ANALYZE on critical queries before/after.
-- - Recreate any dropped index quickly if regressions appear.

DO $$
BEGIN
  RAISE NOTICE 'Policy consolidation and index cleanup are staged. Review and enable specific DROP/CREATE statements after observation.';
END $$;


