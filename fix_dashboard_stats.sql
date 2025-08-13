-- Fix Dashboard Stats - Add Missing Columns for Workout Completion Tracking
-- This script addresses the issue where dashboard shows "4" workouts but more exercises are completed

-- =============================================
-- STEP 1: ADD MISSING COLUMNS TO WORKOUT_LOGS
-- =============================================

-- Add end_time column (critical for stats to determine completion)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='end_time') THEN
    ALTER TABLE public.workout_logs ADD COLUMN end_time TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added end_time column to workout_logs';
  ELSE
    RAISE NOTICE 'end_time column already exists in workout_logs';
  END IF;
END $$;

-- Add date column (critical for weekly/daily stats filtering)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_name='workout_logs' AND column_name='date') THEN
    ALTER TABLE public.workout_logs ADD COLUMN date DATE DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added date column to workout_logs';
  ELSE
    RAISE NOTICE 'date column already exists in workout_logs';
  END IF;
END $$;

-- =============================================
-- STEP 2: UPDATE EXISTING WORKOUT LOGS
-- =============================================

-- Set end_time for existing completed workouts (use completed_at as fallback)
UPDATE public.workout_logs 
SET end_time = completed_at 
WHERE end_time IS NULL AND completed_at IS NOT NULL;

-- Set date for existing workouts (extract from completed_at)
UPDATE public.workout_logs 
SET date = DATE(completed_at) 
WHERE date IS NULL AND completed_at IS NOT NULL;

-- =============================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Index for end_time (used by stats queries)
CREATE INDEX IF NOT EXISTS idx_workout_logs_end_time 
ON public.workout_logs(end_time) 
WHERE end_time IS NOT NULL;

-- Index for date (used by weekly/daily filtering)
CREATE INDEX IF NOT EXISTS idx_workout_logs_date 
ON public.workout_logs(date);

-- Composite index for user_id + end_time (most common stats query)
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_end_time 
ON public.workout_logs(user_id, end_time) 
WHERE end_time IS NOT NULL;

-- =============================================
-- STEP 4: VERIFY EXERCISE LOGS COUNT
-- =============================================

-- Count total exercise logs vs workout logs to identify discrepancy
SELECT 
  'Total Workout Logs' as metric,
  COUNT(*) as count
FROM public.workout_logs
WHERE user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID if needed

UNION ALL

SELECT 
  'Workout Logs with end_time' as metric,
  COUNT(*) as count
FROM public.workout_logs
WHERE user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID if needed
  AND end_time IS NOT NULL

UNION ALL

SELECT 
  'Total Exercise Logs' as metric,
  COUNT(*) as count
FROM public.exercise_logs el
JOIN public.workout_logs wl ON el.workout_log_id = wl.id
WHERE wl.user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID if needed

UNION ALL

SELECT 
  'Exercise Logs from Completed Workouts' as metric,
  COUNT(*) as count
FROM public.exercise_logs el
JOIN public.workout_logs wl ON el.workout_log_id = wl.id
WHERE wl.user_id = (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID if needed
  AND wl.end_time IS NOT NULL;

-- =============================================
-- STEP 5: CREATE HELPER FUNCTION FOR STATS
-- =============================================

-- Function to get accurate workout completion count
CREATE OR REPLACE FUNCTION public.get_workout_completion_count(user_id_param UUID)
RETURNS TABLE (
  total_workouts BIGINT,
  completed_workouts BIGINT,
  total_exercises BIGINT,
  completed_exercises BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    -- Total workout logs
    (SELECT COUNT(*) FROM public.workout_logs WHERE user_id = user_id_param) as total_workouts,
    
    -- Workouts with end_time (completed)
    (SELECT COUNT(*) FROM public.workout_logs 
     WHERE user_id = user_id_param AND end_time IS NOT NULL) as completed_workouts,
    
    -- Total exercise logs
    (SELECT COUNT(*) FROM public.exercise_logs el
     JOIN public.workout_logs wl ON el.workout_log_id = wl.id
     WHERE wl.user_id = user_id_param) as total_exercises,
    
    -- Exercise logs from completed workouts
    (SELECT COUNT(*) FROM public.exercise_logs el
     JOIN public.workout_logs wl ON el.workout_log_id = wl.id
     WHERE wl.user_id = user_id_param AND wl.end_time IS NOT NULL) as completed_exercises;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_workout_completion_count(UUID) TO authenticated;

-- =============================================
-- STEP 6: UPDATE RLS POLICIES (if needed)
-- =============================================

-- Ensure users can read their own workout logs with new columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workout_logs' AND policyname = 'Users can view their own workout logs') THEN
    -- Policy exists, no action needed
    RAISE NOTICE 'RLS policy already exists for workout_logs';
  ELSE
    -- Create policy if it doesn't exist
    CREATE POLICY "Users can view their own workout logs"
    ON public.workout_logs
    FOR SELECT
    USING (user_id = auth.uid());
    
    RAISE NOTICE 'Created RLS policy for workout_logs';
  END IF;
END $$;

-- =============================================
-- STEP 7: FINAL VERIFICATION
-- =============================================

-- Test the new function
SELECT * FROM public.get_workout_completion_count(
  (SELECT id FROM auth.users LIMIT 1) -- Replace with actual user ID if needed
);

-- Show the current state of workout_logs columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'workout_logs' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- =============================================
-- STEP 8: COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON COLUMN public.workout_logs.end_time IS 'Timestamp when workout was completed - used by dashboard stats to count completed workouts';
COMMENT ON COLUMN public.workout_logs.date IS 'Date when workout was completed - used by weekly/daily stats filtering';
COMMENT ON FUNCTION public.get_workout_completion_count(UUID) IS 'Returns accurate counts of workouts and exercises for dashboard display';

-- =============================================
-- SUMMARY OF CHANGES
-- =============================================

/*
✅ FIXES APPLIED:

1. Added 'end_time' column to workout_logs (critical for stats)
2. Added 'date' column to workout_logs (critical for weekly/daily filtering)
3. Updated existing records to populate these columns
4. Created performance indexes for faster stats queries
5. Created helper function for accurate completion counting
6. Verified RLS policies are in place
7. Added documentation comments

🎯 EXPECTED RESULT:
- Dashboard will now show correct workout completion count
- Stats will properly filter by week/day
- Performance will be improved with new indexes
- Exercise completion tracking will be accurate

⚠️  IMPORTANT:
- The dashboard counts workouts with 'end_time' NOT NULL
- Exercise logs are linked to workout_logs via workout_log_id
- Make sure to set 'end_time' when marking workouts as complete
*/
