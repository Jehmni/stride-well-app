-- Script to fix workout history display issues
-- This script ensures completed workouts show up properly in the Workout History tab

-- 1. Update workout_logs table to ensure proper fields
ALTER TABLE workout_logs 
ADD COLUMN IF NOT EXISTS workout_type VARCHAR DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS workout_name VARCHAR DEFAULT NULL;

-- 2. Update existing workout logs to mark them as completed
UPDATE workout_logs
SET workout_type = 'completed'
WHERE workout_type IS NULL OR workout_type = '';

-- 3. Make sure completed workouts aren't marked as custom workouts
UPDATE workout_logs
SET is_custom = false
WHERE workout_type = 'completed' AND is_custom = true;

-- 4. Add proper workout names for logs that don't have them
UPDATE workout_logs wl
SET workout_name = w.name || ' Workout'
FROM workouts w
WHERE wl.workout_id = w.id AND wl.workout_name IS NULL AND w.name IS NOT NULL;

-- 5. For logs without valid workout_name, add a generic one
UPDATE workout_logs
SET workout_name = 'Completed Workout'
WHERE workout_name IS NULL;

-- 6. Create index to improve query performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout_type ON workout_logs(workout_type);

-- 7. Add comments for documentation
COMMENT ON COLUMN workout_logs.workout_type IS 'Type of workout log (completed, planned, custom)';
COMMENT ON COLUMN workout_logs.is_custom IS 'Whether this is a custom workout created by the user';
COMMENT ON COLUMN workout_logs.workout_name IS 'Display name for the workout log';
