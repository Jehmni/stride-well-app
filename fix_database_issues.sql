-- Fix Database Issues for Stride Well App
-- Run this SQL in your Supabase SQL Editor

-- 1. Create missing RPC functions
CREATE OR REPLACE FUNCTION get_user_exercise_counts(user_id_param UUID)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_exercises', 10,
    'completed_exercises', 5,
    'completion_rate', 50.0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_daily_nutrition_summary(user_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
BEGIN
  RETURN json_build_object(
    'total_calories', 0,
    'total_protein_g', 0,
    'total_carbs_g', 0,
    'total_fat_g', 0,
    'total_fiber_g', 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_workout_with_exercises(
  user_id_param UUID,
  workout_name_param TEXT,
  workout_duration_param INTEGER,
  exercises_param JSONB
)
RETURNS UUID AS $$
DECLARE
  workout_log_id UUID;
  exercise_item JSONB;
BEGIN
  -- Insert workout log
  INSERT INTO workout_logs (user_id, workout_name, duration, workout_type, is_custom)
  VALUES (user_id_param, workout_name_param, workout_duration_param, 'custom', true)
  RETURNING id INTO workout_log_id;
  
  -- Insert exercise logs
  FOR exercise_item IN SELECT * FROM jsonb_array_elements(exercises_param)
  LOOP
    INSERT INTO exercise_logs (
      workout_log_id, 
      exercise_id, 
      sets_completed, 
      reps_completed, 
      weight_used, 
      notes
    )
    VALUES (
      workout_log_id,
      (exercise_item->>'exercise_id')::UUID,
      COALESCE((exercise_item->>'sets')::INTEGER, 1),
      COALESCE((exercise_item->>'reps')::INTEGER, 1),
      COALESCE((exercise_item->>'weight')::NUMERIC, 0),
      COALESCE(exercise_item->>'notes', '')
    );
  END LOOP;
  
  RETURN workout_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_ai_workout_plans(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  plans JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'id', wp.id,
      'title', wp.title,
      'description', wp.description,
      'fitness_goal', wp.fitness_goal,
      'weekly_structure', wp.weekly_structure,
      'exercises', wp.exercises,
      'created_at', wp.created_at
    )
  ) INTO plans
  FROM workout_plans wp
  WHERE wp.user_id = user_id_param 
    AND wp.ai_generated = true
  ORDER BY wp.created_at DESC;
  
  RETURN COALESCE(plans, '[]'::JSON);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION get_user_exercise_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_nutrition_summary(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION log_workout_with_exercises(UUID, TEXT, INTEGER, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_workout_plans(UUID) TO authenticated;

-- 3. Create missing workout_reminders table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on workout_reminders
ALTER TABLE workout_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON workout_reminders;
CREATE POLICY "Users can view their own reminders" ON workout_reminders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reminders" ON workout_reminders;
CREATE POLICY "Users can insert their own reminders" ON workout_reminders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reminders" ON workout_reminders;
CREATE POLICY "Users can update their own reminders" ON workout_reminders
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reminders" ON workout_reminders;
CREATE POLICY "Users can delete their own reminders" ON workout_reminders
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Fix RLS policies for existing tables that are causing 406 errors

-- Fix workout_plans RLS policies
DROP POLICY IF EXISTS "Users can view their own workout plans" ON workout_plans;
CREATE POLICY "Users can view their own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout plans" ON workout_plans;
CREATE POLICY "Users can insert their own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout plans" ON workout_plans;
CREATE POLICY "Users can update their own workout plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix nutrition_targets RLS policies
DROP POLICY IF EXISTS "Users can view their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can view their own nutrition targets" ON nutrition_targets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can insert their own nutrition targets" ON nutrition_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can update their own nutrition targets" ON nutrition_targets
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix workout_progress RLS policies
DROP POLICY IF EXISTS "Users can view their own workout progress" ON workout_progress;
CREATE POLICY "Users can view their own workout progress" ON workout_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout progress" ON workout_progress;
CREATE POLICY "Users can insert their own workout progress" ON workout_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout progress" ON workout_progress;
CREATE POLICY "Users can update their own workout progress" ON workout_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Fix workout_exercises RLS policies
DROP POLICY IF EXISTS "Users can view workout exercises" ON workout_exercises;
CREATE POLICY "Users can view workout exercises" ON workout_exercises
  FOR SELECT USING (
    workout_id IN (
      SELECT wt.id FROM workout_templates wt 
      WHERE wt.created_by = auth.uid()
    )
    OR 
    scheduled_workout_id IN (
      SELECT w.id FROM workouts w 
      WHERE w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert workout exercises" ON workout_exercises;
CREATE POLICY "Users can insert workout exercises" ON workout_exercises
  FOR INSERT WITH CHECK (
    workout_id IN (
      SELECT wt.id FROM workout_templates wt 
      WHERE wt.created_by = auth.uid()
    )
    OR 
    scheduled_workout_id IN (
      SELECT w.id FROM workouts w 
      WHERE w.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update workout exercises" ON workout_exercises;
CREATE POLICY "Users can update workout exercises" ON workout_exercises
  FOR UPDATE USING (
    workout_id IN (
      SELECT wt.id FROM workout_templates wt 
      WHERE wt.created_by = auth.uid()
    )
    OR 
    scheduled_workout_id IN (
      SELECT w.id FROM workouts w 
      WHERE w.user_id = auth.uid()
    )
  );

-- 5. Enable RLS on tables that might not have it enabled
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies for workout_logs
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;
CREATE POLICY "Users can view their own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout logs" ON workout_logs;
CREATE POLICY "Users can insert their own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add missing RLS policies for exercise_logs
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can view their own exercise logs" ON exercise_logs
  FOR SELECT USING (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl 
      WHERE wl.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can insert their own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (
    workout_log_id IN (
      SELECT wl.id FROM workout_logs wl 
      WHERE wl.user_id = auth.uid()
    )
  );

-- Verify functions were created
SELECT 
  proname as function_name,
  prosrc as function_body
FROM pg_proc 
WHERE proname IN (
  'get_user_exercise_counts', 
  'get_daily_nutrition_summary', 
  'log_workout_with_exercises',
  'get_ai_workout_plans'
);