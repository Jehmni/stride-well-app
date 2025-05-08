-- Update to complete_workout function to support all parameters
CREATE OR REPLACE FUNCTION public.complete_workout(
  workout_id_param UUID,
  user_id_param UUID,
  duration_param INTEGER DEFAULT NULL,
  calories_param INTEGER DEFAULT NULL,
  notes_param TEXT DEFAULT NULL,
  rating_param INTEGER DEFAULT NULL,
  is_custom_param BOOLEAN DEFAULT FALSE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  workout_log_id UUID;
  workout_name_val TEXT;
  workout_description_val TEXT;
BEGIN
  -- Check parameters
  IF workout_id_param IS NULL OR user_id_param IS NULL THEN
    RAISE EXCEPTION 'Missing required parameters: workout_id or user_id';
  END IF;

  -- Get workout name and description if available
  SELECT name, description INTO workout_name_val, workout_description_val 
  FROM public.workouts 
  WHERE id = workout_id_param;

  -- Start transaction
  BEGIN
    -- Insert the workout log with proper type
    INSERT INTO public.workout_logs (
      workout_id,
      user_id,
      duration,
      calories_burned,
      notes,
      completed_at,
      workout_type,
      is_custom,
      rating,
      workout_name,
      workout_description
    ) VALUES (
      workout_id_param,
      user_id_param,
      duration_param,
      calories_param,
      notes_param,
      NOW(),
      CASE WHEN is_custom_param THEN 'custom' ELSE 'completed' END,
      is_custom_param,
      rating_param,
      workout_name_val,
      workout_description_val
    )
    RETURNING id INTO workout_log_id;
  
    -- If anything fails, roll back the entire transaction
    EXCEPTION WHEN OTHERS THEN
      RAISE;
  END;
  
  RETURN workout_log_id;
END;
$$;
