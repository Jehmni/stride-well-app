-- Create schema for the fitness app

-- Enable the PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  age INTEGER,
  sex TEXT,
  height NUMERIC,
  weight NUMERIC,
  fitness_goal TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout plans table
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  fitness_goal TEXT NOT NULL,
  weekly_structure JSONB NOT NULL,
  exercises JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  fitness_goal TEXT NOT NULL,
  meal_plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User meal plans table (saved meal plans)
CREATE TABLE IF NOT EXISTS public.user_meal_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  meal_plan_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Completed workouts table
CREATE TABLE IF NOT EXISTS public.completed_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  workout_title TEXT NOT NULL,
  duration INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weight records table
CREATE TABLE IF NOT EXISTS public.weight_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strength records table
CREATE TABLE IF NOT EXISTS public.strength_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  exercise TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  reps INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Body measurements table
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  chest NUMERIC,
  waist NUMERIC,
  hips NUMERIC,
  arms NUMERIC,
  thighs NUMERIC,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meal logs table
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL,
  meal_name TEXT NOT NULL,
  calories INTEGER,
  protein INTEGER,
  carbs INTEGER,
  fat INTEGER,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for security

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strength_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Workout plans policies (public read access)
CREATE POLICY "Anyone can view workout plans"
  ON public.workout_plans
  FOR SELECT
  USING (true);

-- Meal plans policies (public read access)
CREATE POLICY "Anyone can view meal plans"
  ON public.meal_plans
  FOR SELECT
  USING (true);

-- User meal plans policies
CREATE POLICY "Users can view their own meal plans"
  ON public.user_meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.user_meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON public.user_meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.user_meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Completed workouts policies
CREATE POLICY "Users can view their completed workouts"
  ON public.completed_workouts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their completed workouts"
  ON public.completed_workouts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Weight records policies
CREATE POLICY "Users can view their weight records"
  ON public.weight_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their weight records"
  ON public.weight_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Strength records policies
CREATE POLICY "Users can view their strength records"
  ON public.strength_records
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their strength records"
  ON public.strength_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Body measurements policies
CREATE POLICY "Users can view their body measurements"
  ON public.body_measurements
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their body measurements"
  ON public.body_measurements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Meal logs policies
CREATE POLICY "Users can view their meal logs"
  ON public.meal_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their meal logs"
  ON public.meal_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create trigger to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, age, sex, height, weight, fitness_goal)
  VALUES (
    new.id, 
    COALESCE((new.raw_user_meta_data->>'age')::integer, 30),
    COALESCE(new.raw_user_meta_data->>'sex', 'other'),
    COALESCE((new.raw_user_meta_data->>'height')::numeric, 170),
    COALESCE((new.raw_user_meta_data->>'weight')::numeric, 70),
    COALESCE(new.raw_user_meta_data->>'fitness_goal', 'general-fitness')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user(); 