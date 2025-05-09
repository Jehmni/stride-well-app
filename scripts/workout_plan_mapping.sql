-- Update workout_plans table to add mapping fields
ALTER TABLE workout_plans 
ADD COLUMN IF NOT EXISTS mapped_exercises BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workout_id UUID DEFAULT NULL REFERENCES workouts(id);

-- Create an index to improve lookup performance
CREATE INDEX IF NOT EXISTS idx_workout_plans_ai_generated ON workout_plans (user_id, ai_generated);

-- Comment the changes for documentation
COMMENT ON COLUMN workout_plans.mapped_exercises IS 'Indicates whether the AI plan exercises have been mapped to the workout_exercises table';
COMMENT ON COLUMN workout_plans.workout_id IS 'Reference to the workout that contains the mapped exercises for this plan';
