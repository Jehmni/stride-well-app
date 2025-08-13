-- Fix Workout Completion Functions - Add end_time Setting
-- This script ensures that all workout completion functions set end_time for proper dashboard stats

-- =============================================
-- STEP 1: UPDATE EXISTING WORKOUT COMPLETION FUNCTIONS
-- =============================================

-- Update the complete_workout function to set end_time
CREATE OR REPLACE FUNCTION public.complete_workout(
  workout_id_param UUID,
  user_id_param UUID,
  duration_param INTEGER DEFAULT NULL,
  calories_param INTEGER DEFAULT NULL,
  notes_param TEXT DEFAULT NULL,
  rating_param INTEGER DEFAULT NULL,
  is_custom_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
  workout_name_val TEXT;
  workout_description_val TEXT;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Get workout name and description if available
  SELECT name, description INTO workout_name_val, workout_description_val 
  FROM public.workouts 
  WHERE id = workout_id_param;

  -- Start transaction
  BEGIN
    -- Insert the workout log with proper type and end_time
    INSERT INTO public.workout_logs (
      workout_id,
      user_id,
      duration,
      calories_burned,
      notes,
      completed_at,
      end_time, -- CRITICAL: Set end_time for dashboard stats
      date, -- CRITICAL: Set date for weekly/daily filtering
      workout_type,
      is_custom,
      rating,
      workout_name,
      workout_description
    ) VALUES (
      workout_id_param,
      user_id_param,
      duration_param,
      calories_param,
      notes_param,
      NOW(),
      NOW(), -- end_time = current time when workout is completed
      CURRENT_DATE, -- date = current date for stats filtering
      CASE WHEN is_custom_param THEN 'custom' ELSE 'completed' END,
      is_custom_param,
      rating_param,
      workout_name_val,
      workout_description_val
    )
    RETURNING id INTO workout_log_id;
  
    -- If anything fails, roll back the entire transaction
    EXCEPTION WHEN OTHERS THEN
      RAISE;
  END;
  
  RETURN workout_log_id;
END;
$$;

-- Update the create_workout_log function to set end_time
CREATE OR REPLACE FUNCTION public.create_workout_log(
  workout_id_param UUID,
  user_id_param UUID,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Insert the workout log with end_time set
  INSERT INTO public.workout_logs (
    workout_id,
    user_id,
    notes,
    completed_at,
    end_time, -- CRITICAL: Set end_time for dashboard stats
    date, -- CRITICAL: Set date for weekly/daily filtering
    workout_type,
    is_custom
  ) VALUES (
    workout_id_param,
    user_id_param,
    notes_param,
    NOW(),
    NOW(), -- end_time = current time when workout log is created
    CURRENT_DATE, -- date = current date for stats filtering
    'completed',
    FALSE
  )
  RETURNING id INTO workout_log_id;
  
  RETURN workout_log_id;
END;
$$;

-- Update the log_exercise_completion function to ensure end_time is set
CREATE OR REPLACE FUNCTION public.log_exercise_completion(
  workout_log_id_param UUID,
  exercise_id_param UUID,
  sets_completed_param INTEGER,
  reps_completed_param INTEGER DEFAULT NULL,
  weight_used_param NUMERIC DEFAULT NULL,
  notes_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_user_id UUID;
  exercise_log_id UUID;
BEGIN
  -- First verify the workout_log exists
  SELECT user_id INTO workout_user_id
  FROM workout_logs
  WHERE id = workout_log_id_param;
  
  -- Check if workout exists
  IF workout_user_id IS NULL THEN
    RAISE EXCEPTION 'Workout log not found';
  END IF;
  
  -- Check if both ids are valid UUIDs
  IF workout_log_id_param IS NULL OR exercise_id_param IS NULL THEN
    RAISE EXCEPTION 'Invalid workout_log_id or exercise_id';
  END IF;

  -- Update the workout log to ensure end_time is set and type is correct
  UPDATE workout_logs
  SET 
    workout_type = COALESCE(workout_type, 'completed'),
    is_custom = COALESCE(is_custom, FALSE),
    end_time = COALESCE(end_time, NOW()), -- CRITICAL: Ensure end_time is set
    date = COALESCE(date, CURRENT_DATE) -- CRITICAL: Ensure date is set
  WHERE id = workout_log_id_param;

  -- Insert the exercise log - the RLS policy will handle permissions
  INSERT INTO public.exercise_logs (
    workout_log_id,
    exercise_id,
    sets_completed,
    reps_completed,
    weight_used,
    notes,
    completed_at
  ) VALUES (
    workout_log_id_param,
    exercise_id_param,
    sets_completed_param,
    reps_completed_param,
    weight_used_param,
    notes_param,
    NOW()
  )
  RETURNING id INTO exercise_log_id;
  
  RETURN exercise_log_id;
END;
$$;

-- =============================================
-- STEP 2: CREATE NEW FUNCTION FOR COMPREHENSIVE WORKOUT COMPLETION
-- =============================================

-- Create a comprehensive workout completion function that handles everything
CREATE OR REPLACE FUNCTION public.complete_workout_comprehensive(
  workout_id_param UUID,
  user_id_param UUID,
  duration_param INTEGER DEFAULT NULL,
  calories_param INTEGER DEFAULT NULL,
  notes_param TEXT DEFAULT NULL,
  rating_param INTEGER DEFAULT NULL,
  exercises_param JSONB DEFAULT NULL,
  is_ai_workout_param BOOLEAN DEFAULT FALSE,
  ai_workout_plan_id_param UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
  workout_name_val TEXT;
  workout_description_val TEXT;
  exercise_record JSONB;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Get workout name and description if available
  SELECT name, description INTO workout_name_val, workout_description_val 
  FROM public.workouts 
  WHERE id = workout_id_param;

  -- Start transaction
  BEGIN
    -- Insert the workout log with ALL required fields
    INSERT INTO public.workout_logs (
      workout_id,
      user_id,
      duration,
      calories_burned,
      notes,
      completed_at,
      end_time, -- CRITICAL: Set end_time for dashboard stats
      date, -- CRITICAL: Set date for weekly/daily filtering
      workout_type,
      is_custom,
      is_from_ai_plan,
      ai_workout_plan_id,
      rating,
      workout_name,
      workout_description
    ) VALUES (
      workout_id_param,
      user_id_param,
      duration_param,
      calories_param,
      notes_param,
      NOW(),
      NOW(), -- end_time = current time when workout is completed
      CURRENT_DATE, -- date = current date for stats filtering
      CASE 
        WHEN is_ai_workout_param THEN 'ai_generated'
        ELSE 'completed'
      END,
      FALSE, -- Not custom
      is_ai_workout_param,
      ai_workout_plan_id_param,
      rating_param,
      workout_name_val,
      workout_description_val
    )
    RETURNING id INTO workout_log_id;

    -- If exercises are provided, log them
    IF exercises_param IS NOT NULL AND jsonb_array_length(exercises_param) > 0 THEN
      FOR exercise_record IN SELECT * FROM jsonb_array_elements(exercises_param)
      LOOP
        INSERT INTO public.exercise_logs (
          workout_log_id,
          exercise_id,
          sets_completed,
          reps_completed,
          weight_used,
          notes,
          completed_at
        ) VALUES (
          workout_log_id,
          (exercise_record->>'exercise_id')::UUID,
          (exercise_record->>'sets_completed')::INTEGER,
          (exercise_record->>'reps_completed')::INTEGER,
          (exercise_record->>'weight_used')::NUMERIC,
          exercise_record->>'notes',
          NOW()
        );
      END LOOP;
    END IF;
  
    -- If anything fails, roll back the entire transaction
    EXCEPTION WHEN OTHERS THEN
      RAISE;
  END;
  
  RETURN workout_log_id;
END;
$$;

-- =============================================
-- STEP 3: UPDATE EXISTING WORKOUT LOGS TO SET END_TIME
-- =============================================

-- Update all existing workout logs that don't have end_time set
UPDATE public.workout_logs 
SET 
  end_time = completed_at,
  date = DATE(completed_at)
WHERE end_time IS NULL OR date IS NULL;

-- =============================================
-- STEP 4: CREATE TRIGGER TO AUTO-SET END_TIME
-- =============================================

-- Create a trigger function to automatically set end_time and date
CREATE OR REPLACE FUNCTION public.auto_set_workout_completion_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Always set end_time when workout is marked as completed
  IF NEW.workout_type = 'completed' OR NEW.workout_type = 'ai_generated' THEN
    NEW.end_time = COALESCE(NEW.end_time, NOW());
    NEW.date = COALESCE(NEW.date, CURRENT_DATE);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_auto_set_workout_completion ON public.workout_logs;
CREATE TRIGGER trigger_auto_set_workout_completion
  BEFORE INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_workout_completion_fields();

-- =============================================
-- STEP 5: VERIFY THE FIXES
-- =============================================

-- Test the new comprehensive function
SELECT 
  'Testing comprehensive workout completion function' as test_description,
  public.complete_workout_comprehensive(
    '00000000-0000-0000-0000-000000000001'::UUID, -- Test UUID
    '00000000-0000-0000-0000-000000000001'::UUID, -- Test UUID
    30, -- duration
    150, -- calories
    'Test workout completion', -- notes
    5, -- rating
    NULL, -- exercises
    FALSE, -- not AI workout
    NULL -- no AI plan ID
  ) as test_result;

-- Check current state of workout_logs
SELECT 
  'Current workout_logs state' as status,
  COUNT(*) as total_workouts,
  COUNT(end_time) as workouts_with_end_time,
  COUNT(date) as workouts_with_date,
  COUNT(*) FILTER (WHERE end_time IS NOT NULL) as completed_workouts
FROM public.workout_logs;

-- =============================================
-- STEP 6: GRANT PERMISSIONS
-- =============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.complete_workout(UUID, UUID, INTEGER, INTEGER, TEXT, INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_workout_log(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_exercise_completion(UUID, UUID, INTEGER, INTEGER, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_workout_comprehensive(UUID, UUID, INTEGER, INTEGER, TEXT, INTEGER, JSONB, BOOLEAN, UUID) TO authenticated;

-- =============================================
-- STEP 7: COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON FUNCTION public.complete_workout(UUID, UUID, INTEGER, INTEGER, TEXT, INTEGER, BOOLEAN) IS 'Completes a workout and sets end_time for dashboard stats';
COMMENT ON FUNCTION public.create_workout_log(UUID, UUID, TEXT) IS 'Creates a workout log with end_time set for dashboard stats';
COMMENT ON FUNCTION public.log_exercise_completion(UUID, UUID, INTEGER, INTEGER, NUMERIC, TEXT) IS 'Logs exercise completion and ensures workout has end_time set';
COMMENT ON FUNCTION public.complete_workout_comprehensive(UUID, UUID, INTEGER, INTEGER, TEXT, INTEGER, JSONB, BOOLEAN, UUID) IS 'Comprehensive workout completion with exercises and proper end_time setting';

-- =============================================
-- SUMMARY OF CHANGES
-- =============================================

/*
✅ FIXES APPLIED:

1. Updated complete_workout() to set end_time and date
2. Updated create_workout_log() to set end_time and date  
3. Updated log_exercise_completion() to ensure end_time is set
4. Created complete_workout_comprehensive() for full workout + exercises
5. Added trigger to auto-set end_time and date
6. Updated existing records to populate missing fields
7. Added proper permissions and documentation

🎯 EXPECTED RESULT:
- Dashboard will now show correct workout completion count
- All workout completion functions properly set end_time
- Stats will work correctly with weekly/daily filtering
- Exercise completion tracking will be accurate

⚠️  IMPORTANT:
- Use complete_workout_comprehensive() for new workout completions
- All existing functions now set end_time automatically
- Trigger ensures end_time is always set for completed workouts
- Dashboard counts workouts with end_time NOT NULL
*/
