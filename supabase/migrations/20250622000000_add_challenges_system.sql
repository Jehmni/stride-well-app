-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('steps', 'workouts', 'weight', 'distance', 'duration', 'custom')),
  goal_value NUMERIC NOT NULL,
  goal_unit TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  max_participants INTEGER,
  reward_description TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge participants table
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  current_progress NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(challenge_id, user_id)
);

-- Create challenge progress logs table
CREATE TABLE IF NOT EXISTS public.challenge_progress_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  progress_value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenges_type ON public.challenges(challenge_type);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_user ON public.challenge_progress_logs(challenge_id, user_id);

-- Add RLS policies
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress_logs ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Anyone can view public challenges"
  ON public.challenges
  FOR SELECT
  USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create challenges"
  ON public.challenges
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges"
  ON public.challenges
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Challenge participants policies
CREATE POLICY "Users can view their challenge participations"
  ON public.challenge_participants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join challenges"
  ON public.challenge_participants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their challenge participation"
  ON public.challenge_participants
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Challenge progress logs policies
CREATE POLICY "Users can view their progress logs"
  ON public.challenge_progress_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can log their progress"
  ON public.challenge_progress_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert sample challenges
INSERT INTO public.challenges (title, description, challenge_type, goal_value, goal_unit, start_date, end_date, is_public, difficulty_level, reward_description, max_participants) VALUES
('New Year Fitness Challenge', 'Complete 20 workouts in January to kickstart your fitness journey!', 'workouts', 20, 'workouts', '2025-01-01', '2025-01-31', true, 'beginner', 'Digital badge and progress certificate', 1000),
('10K Steps Daily', 'Walk 10,000 steps every day for 30 days', 'steps', 300000, 'steps', CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true, 'beginner', 'Step master badge', 500),
('Weight Loss Warriors', 'Lose 5% of your body weight in 8 weeks', 'weight', 5, 'percentage', CURRENT_DATE, CURRENT_DATE + INTERVAL '8 weeks', true, 'intermediate', 'Weight loss champion certificate', 100),
('Marathon Training', 'Run a total of 100 miles in preparation for marathon season', 'distance', 100, 'miles', CURRENT_DATE, CURRENT_DATE + INTERVAL '12 weeks', true, 'advanced', 'Marathon readiness badge', 50),
('Consistency Challenge', 'Work out for at least 30 minutes, 5 days a week for 4 weeks', 'duration', 600, 'minutes', CURRENT_DATE, CURRENT_DATE + INTERVAL '4 weeks', true, 'intermediate', 'Consistency champion badge', 200);

-- Create function to automatically update challenge completion status
CREATE OR REPLACE FUNCTION update_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has reached the goal
  IF NEW.current_progress >= (SELECT goal_value FROM challenges WHERE id = NEW.challenge_id) THEN
    NEW.completed = true;
    NEW.completed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update completion status
CREATE TRIGGER trigger_update_challenge_completion
  BEFORE UPDATE ON public.challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_completion();

-- Create function to get user's challenges with progress
CREATE OR REPLACE FUNCTION get_user_challenges(user_id_param UUID)
RETURNS TABLE (
  challenge_id UUID,
  title TEXT,
  description TEXT,
  challenge_type TEXT,
  goal_value NUMERIC,
  goal_unit TEXT,
  start_date DATE,
  end_date DATE,
  current_progress NUMERIC,
  completed BOOLEAN,
  total_participants BIGINT,
  user_rank INTEGER,
  difficulty_level TEXT,
  reward_description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as challenge_id,
    c.title,
    c.description,
    c.challenge_type,
    c.goal_value,
    c.goal_unit,
    c.start_date,
    c.end_date,
    COALESCE(cp.current_progress, 0) as current_progress,
    COALESCE(cp.completed, false) as completed,
    COUNT(cp2.user_id) as total_participants,
    CASE 
      WHEN cp.current_progress IS NOT NULL THEN
        RANK() OVER (PARTITION BY c.id ORDER BY cp.current_progress DESC)::INTEGER
      ELSE NULL
    END as user_rank,
    c.difficulty_level,
    c.reward_description
  FROM public.challenges c
  LEFT JOIN public.challenge_participants cp ON c.id = cp.challenge_id AND cp.user_id = user_id_param
  LEFT JOIN public.challenge_participants cp2 ON c.id = cp2.challenge_id
  WHERE c.is_public = true AND c.end_date >= CURRENT_DATE
  GROUP BY c.id, c.title, c.description, c.challenge_type, c.goal_value, c.goal_unit, 
           c.start_date, c.end_date, cp.current_progress, cp.completed, c.difficulty_level, c.reward_description
  ORDER BY c.start_date DESC;
END;
$$ LANGUAGE plpgsql;
