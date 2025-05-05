
-- Create RPC function to safely log exercise completion
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
  -- First verify the workout_log belongs to the authenticated user
  SELECT user_id INTO workout_user_id
  FROM workout_logs
  WHERE id = workout_log_id_param;
  
  IF workout_user_id IS NULL OR workout_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to log exercises for this workout';
  END IF;
  
  -- Insert the exercise log
  INSERT INTO public.exercise_logs (
    workout_log_id,
    exercise_id,
    sets_completed,
    reps_completed,
    weight_used,
    notes
  ) VALUES (
    workout_log_id_param,
    exercise_id_param,
    sets_completed_param,
    reps_completed_param,
    weight_used_param,
    notes_param
  )
  RETURNING id INTO exercise_log_id;
  
  RETURN exercise_log_id;
END;
$$;

-- Create function to get user's exercise counts
CREATE OR REPLACE FUNCTION public.get_user_exercise_counts(user_id_param UUID)
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
    e.id AS exercise_id,
    e.name,
    e.muscle_group,
    COUNT(el.id) AS count
  FROM exercises e
  JOIN exercise_logs el ON e.id = el.exercise_id
  JOIN workout_logs wl ON el.workout_log_id = wl.id
  WHERE wl.user_id = user_id_param
  GROUP BY e.id, e.name, e.muscle_group
  ORDER BY count DESC;
END;
$$;

-- Create function to get top exercises by count
CREATE OR REPLACE FUNCTION public.get_top_exercises(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 5
)
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
    e.id AS exercise_id,
    e.name,
    e.muscle_group,
    COUNT(el.id) AS count
  FROM exercises e
  JOIN exercise_logs el ON e.id = el.exercise_id
  JOIN workout_logs wl ON el.workout_log_id = wl.id
  WHERE wl.user_id = user_id_param
  GROUP BY e.id, e.name, e.muscle_group
  ORDER BY count DESC
  LIMIT limit_param;
END;
$$;

-- Create function to get exercise progress history
CREATE OR REPLACE FUNCTION public.get_exercise_progress_history(
  user_id_param UUID,
  exercise_id_param UUID,
  limit_param INTEGER DEFAULT 10
)
RETURNS TABLE (
  log_id UUID,
  exercise_id UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  sets_completed INTEGER,
  reps_completed INTEGER,
  weight_used NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    el.id AS log_id,
    el.exercise_id,
    el.completed_at,
    el.sets_completed,
    el.reps_completed,
    el.weight_used
  FROM exercise_logs el
  JOIN workout_logs wl ON el.workout_log_id = wl.id
  WHERE wl.user_id = user_id_param
    AND el.exercise_id = exercise_id_param
  ORDER BY el.completed_at DESC
  LIMIT limit_param;
END;
$$;
