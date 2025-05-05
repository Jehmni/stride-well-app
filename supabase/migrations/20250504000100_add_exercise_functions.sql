
-- Create function to get user exercise counts safely
CREATE OR REPLACE FUNCTION public.get_user_exercise_counts(user_id_param UUID)
RETURNS TABLE (
  exercise_id UUID,
  count BIGINT,
  name TEXT,
  muscle_group TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as exercise_id,
    COUNT(el.id)::BIGINT as count,
    e.name,
    e.muscle_group
  FROM 
    exercises e
  INNER JOIN 
    exercise_logs el ON e.id = el.exercise_id
  INNER JOIN 
    workout_logs wl ON el.workout_log_id = wl.id
  WHERE 
    wl.user_id = user_id_param
  GROUP BY 
    e.id, e.name, e.muscle_group
  ORDER BY 
    count DESC;
END;
$$;

-- Create function to get top exercises by usage
CREATE OR REPLACE FUNCTION public.get_top_exercises(user_id_param UUID, limit_param INT)
RETURNS TABLE (
  exercise_id UUID,
  name TEXT,
  muscle_group TEXT,
  count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id as exercise_id,
    e.name,
    e.muscle_group,
    COUNT(el.id)::BIGINT as count
  FROM 
    exercises e
  INNER JOIN 
    exercise_logs el ON e.id = el.exercise_id
  INNER JOIN 
    workout_logs wl ON el.workout_log_id = wl.id
  WHERE 
    wl.user_id = user_id_param
  GROUP BY 
    e.id, e.name, e.muscle_group
  ORDER BY 
    count DESC
  LIMIT 
    limit_param;
END;
$$;

-- Create function to get exercise progress history
CREATE OR REPLACE FUNCTION public.get_exercise_progress_history(
  user_id_param UUID,
  exercise_id_param UUID,
  limit_param INT
)
RETURNS TABLE (
  id UUID,
  workout_log_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used NUMERIC,
  notes TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id,
    el.workout_log_id,
    el.completed_at,
    el.sets_completed,
    el.reps_completed,
    el.weight_used,
    el.notes
  FROM 
    exercise_logs el
  INNER JOIN 
    workout_logs wl ON el.workout_log_id = wl.id
  WHERE 
    wl.user_id = user_id_param
    AND el.exercise_id = exercise_id_param
  ORDER BY 
    el.completed_at DESC
  LIMIT 
    limit_param;
END;
$$;
