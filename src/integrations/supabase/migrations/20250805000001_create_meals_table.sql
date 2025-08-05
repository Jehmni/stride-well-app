-- Create meals table for meal planning functionality
-- This table stores individual meals within meal plans

CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  calories INTEGER NOT NULL DEFAULT 0,
  protein NUMERIC(5,2) NOT NULL DEFAULT 0,
  carbs NUMERIC(5,2) NOT NULL DEFAULT 0,
  fat NUMERIC(5,2) NOT NULL DEFAULT 0,
  recipe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meals table
-- Users can only access meals from their own meal plans
CREATE POLICY "Users can view their own meals" ON public.meals
  FOR SELECT USING (
    meal_plan_id IN (
      SELECT id FROM public.meal_plans 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meals" ON public.meals
  FOR INSERT WITH CHECK (
    meal_plan_id IN (
      SELECT id FROM public.meal_plans 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own meals" ON public.meals
  FOR UPDATE USING (
    meal_plan_id IN (
      SELECT id FROM public.meal_plans 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own meals" ON public.meals
  FOR DELETE USING (
    meal_plan_id IN (
      SELECT id FROM public.meal_plans 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meals_meal_plan_id ON public.meals(meal_plan_id);
CREATE INDEX IF NOT EXISTS idx_meals_meal_type ON public.meals(meal_type);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON public.meals(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_meals_updated_at 
  BEFORE UPDATE ON public.meals 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 