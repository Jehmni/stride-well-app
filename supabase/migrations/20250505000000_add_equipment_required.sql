
-- Add equipment_required column to exercises table
ALTER TABLE public.exercises
ADD COLUMN IF NOT EXISTS equipment_required TEXT;

-- Create index for faster searches by equipment
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON public.exercises(equipment_required);
