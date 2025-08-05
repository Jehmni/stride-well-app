-- Complete Database Fix for Stride Well App
-- Run this SQL in your Supabase SQL Editor to fix all database issues

-- 1. Create missing RPC functions

-- Function: get_user_exercise_counts
CREATE OR REPLACE FUNCTION get_user_exercise_counts(user_id_param UUID)
RETURNS JSON AS $$
DECLARE
  total_count INTEGER := 0;
  completed_count INTEGER := 0;
  completion_rate NUMERIC := 0;
BEGIN
  -- Count total exercises from workout plans
  SELECT COUNT(DISTINCT we.exercise_id)::INTEGER
  INTO total_count
  FROM workout_exercises we
  JOIN workout_plans wp ON we.workout_id = wp.id
  WHERE wp.user_id = user_id_param;
  
  -- Count completed exercises from exercise logs
  SELECT COUNT(DISTINCT el.exercise_id)::INTEGER
  INTO completed_count
  FROM exercise_logs el
  JOIN workout_logs wl ON el.workout_log_id = wl.id
  WHERE wl.user_id = user_id_param;
  
  -- Calculate completion rate
  IF total_count > 0 THEN
    completion_rate := ROUND((completed_count::NUMERIC / total_count::NUMERIC) * 100, 2);
  END IF;
  
  RETURN json_build_object(
    'total_exercises', total_count,
    'completed_exercises', completed_count,
    'completion_rate', completion_rate
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: get_daily_nutrition_summary
CREATE OR REPLACE FUNCTION get_daily_nutrition_summary(user_id_param UUID, date_param DATE DEFAULT CURRENT_DATE)
RETURNS JSON AS $$
DECLARE
  total_calories NUMERIC := 0;
  total_protein NUMERIC := 0;
  total_carbs NUMERIC := 0;
  total_fat NUMERIC := 0;
  total_fiber NUMERIC := 0;
BEGIN
  -- Get nutrition totals for the specified date
  SELECT 
    COALESCE(SUM(calories), 0),
    COALESCE(SUM(protein_g), 0),
    COALESCE(SUM(carbs_g), 0),
    COALESCE(SUM(fat_g), 0),
    COALESCE(SUM(fiber_g), 0)
  INTO total_calories, total_protein, total_carbs, total_fat, total_fiber
  FROM food_logs fl
  WHERE fl.user_id = user_id_param 
    AND DATE(fl.logged_at) = date_param;
  
  RETURN json_build_object(
    'total_calories', total_calories,
    'total_protein_g', total_protein,
    'total_carbs_g', total_carbs,
    'total_fat_g', total_fat,
    'total_fiber_g', total_fiber
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: log_workout_with_exercises
CREATE OR REPLACE FUNCTION log_workout_with_exercises(
  user_id_param UUID,
  workout_name_param TEXT,
  workout_duration_param INTEGER,
  exercises_param JSONB
)
RETURNS UUID AS $$
DECLARE
  workout_log_id UUID;
  exercise_data JSONB;
BEGIN
  -- Create workout log entry
  INSERT INTO workout_logs (user_id, workout_name, duration_minutes, completed_at)
  VALUES (user_id_param, workout_name_param, workout_duration_param, NOW())
  RETURNING id INTO workout_log_id;
  
  -- Insert exercise logs
  FOR exercise_data IN SELECT * FROM jsonb_array_elements(exercises_param)
  LOOP
    INSERT INTO exercise_logs (
      workout_log_id,
      exercise_id,
      sets_completed,
      reps_completed,
      weight_kg,
      notes
    ) VALUES (
      workout_log_id,
      (exercise_data->>'exercise_id')::UUID,
      (exercise_data->>'sets')::INTEGER,
      (exercise_data->>'reps')::INTEGER,
      (exercise_data->>'weight_kg')::NUMERIC,
      exercise_data->>'notes'
    );
  END LOOP;
  
  RETURN workout_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_exercise_counts(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_daily_nutrition_summary(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION log_workout_with_exercises(UUID, TEXT, INTEGER, JSONB) TO authenticated;

-- 3. Fix RLS policies for tables causing 406 errors

-- Enable RLS on workout_plans if not already enabled
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for workout_plans
DROP POLICY IF EXISTS "Users can view their own workout plans" ON workout_plans;
CREATE POLICY "Users can view their own workout plans" ON workout_plans
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout plans" ON workout_plans;
CREATE POLICY "Users can insert their own workout plans" ON workout_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout plans" ON workout_plans;
CREATE POLICY "Users can update their own workout plans" ON workout_plans
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout plans" ON workout_plans;
CREATE POLICY "Users can delete their own workout plans" ON workout_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on nutrition_targets if not already enabled
ALTER TABLE nutrition_targets ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for nutrition_targets
DROP POLICY IF EXISTS "Users can view their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can view their own nutrition targets" ON nutrition_targets
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can insert their own nutrition targets" ON nutrition_targets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can update their own nutrition targets" ON nutrition_targets
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own nutrition targets" ON nutrition_targets;
CREATE POLICY "Users can delete their own nutrition targets" ON nutrition_targets
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Create missing workout_reminders table if it doesn't exist
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

-- 5. Ensure all required tables have proper RLS policies
-- Enable RLS on food_logs if not already enabled
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for food_logs
DROP POLICY IF EXISTS "Users can view their own food logs" ON food_logs;
CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own food logs" ON food_logs;
CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own food logs" ON food_logs;
CREATE POLICY "Users can update their own food logs" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food logs" ON food_logs;
CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on workout_logs if not already enabled
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for workout_logs
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;
CREATE POLICY "Users can view their own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout logs" ON workout_logs;
CREATE POLICY "Users can insert their own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout logs" ON workout_logs;
CREATE POLICY "Users can update their own workout logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout logs" ON workout_logs;
CREATE POLICY "Users can delete their own workout logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on exercise_logs if not already enabled
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for exercise_logs
DROP POLICY IF EXISTS "Users can view their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can view their own exercise logs" ON exercise_logs
  FOR SELECT USING (auth.uid() IN (
    SELECT wl.user_id FROM workout_logs wl WHERE wl.id = workout_log_id
  ));

DROP POLICY IF EXISTS "Users can insert their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can insert their own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (auth.uid() IN (
    SELECT wl.user_id FROM workout_logs wl WHERE wl.id = workout_log_id
  ));

DROP POLICY IF EXISTS "Users can update their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can update their own exercise logs" ON exercise_logs
  FOR UPDATE USING (auth.uid() IN (
    SELECT wl.user_id FROM workout_logs wl WHERE wl.id = workout_log_id
  ));

DROP POLICY IF EXISTS "Users can delete their own exercise logs" ON exercise_logs;
CREATE POLICY "Users can delete their own exercise logs" ON exercise_logs
  FOR DELETE USING (auth.uid() IN (
    SELECT wl.user_id FROM workout_logs wl WHERE wl.id = workout_log_id
  ));

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_ai_generated ON workout_plans(ai_generated);
CREATE INDEX IF NOT EXISTS idx_nutrition_targets_user_id ON nutrition_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_food_logs_logged_at ON food_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout_log_id ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_workout_reminders_user_id ON workout_reminders(user_id);

-- Success message
SELECT 'Database fixes applied successfully!' as message;