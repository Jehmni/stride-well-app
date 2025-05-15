import { supabase } from "@/integrations/supabase/client";
import { WorkoutTemplate, WorkoutTemplateExercise } from "@/models/models";
import { v4 as uuidv4 } from 'uuid';

/**
 * Fetch user's workout templates
 * @param userId User ID
 * @returns Array of workout templates
 */
export const fetchWorkoutTemplates = async (userId: string): Promise<WorkoutTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('last_used_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching workout templates:", error);
    return [];
  }
};

/**
 * Get a single workout template by ID
 * @param templateId Template ID
 * @returns Workout template or null
 */
export const getWorkoutTemplate = async (templateId: string): Promise<WorkoutTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select(`
        *,
        exercises:workout_template_exercises(
          *,
          exercise:exercises(*)
        )
      `)
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching workout template:", error);
    return null;
  }
};

/**
 * Create a new workout template from a completed workout
 * @param userId User ID
 * @param name Template name
 * @param description Template description
 * @param workoutLogId Source workout log ID (optional)
 * @param workoutId Source workout ID (optional)
 * @param exercises Exercises to include in the template
 * @returns Created template or null
 */
export const createWorkoutTemplate = async (
  userId: string,
  name: string,
  description: string | null,
  workoutLogId?: string,
  workoutId?: string,
  exercises?: Array<{
    exercise_id: string;
    sets: number;
    reps: string | number;
    rest_time?: number;
    weight?: number;
    notes?: string;
  }>
): Promise<WorkoutTemplate | null> => {
  try {
    // Generate a new ID for the template
    const templateId = uuidv4();
    
    // Create the template record
    const { data, error } = await supabase
      .from('workout_templates')
      .insert({
        id: templateId,
        user_id: userId,
        name,
        description,
        source_workout_log_id: workoutLogId || null,
        source_workout_id: workoutId || null,
        is_favorite: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        use_count: 0
      })
      .select()
      .single();

    if (error) throw error;

    // If exercises were provided, add them to the template
    if (exercises && exercises.length > 0) {
      const exerciseRecords = exercises.map((exercise, index) => ({
        id: uuidv4(),
        template_id: templateId,
        exercise_id: exercise.exercise_id,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_time: exercise.rest_time || null,
        weight: exercise.weight || null,
        order_position: index,
        notes: exercise.notes || null
      }));

      const { error: exerciseError } = await supabase
        .from('workout_template_exercises')
        .insert(exerciseRecords);

      if (exerciseError) throw exerciseError;
    } 
    // If workoutLogId is provided, fetch exercises from the workout log
    else if (workoutLogId) {
      // Fetch exercise logs for the workout
      const { data: exerciseLogs, error: logsError } = await supabase
        .from('exercise_logs')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_log_id', workoutLogId);

      if (logsError) throw logsError;

      if (exerciseLogs && exerciseLogs.length > 0) {
        // Create template exercises from logs
        const templateExercises = exerciseLogs.map((log, index) => ({
          id: uuidv4(),
          template_id: templateId,
          exercise_id: log.exercise_id,
          sets: log.sets_completed || 3,
          reps: log.reps_completed || '10-12',
          rest_time: 60,
          weight: log.weight_used,
          order_position: index,
          notes: log.notes
        }));

        const { error: exerciseError } = await supabase
          .from('workout_template_exercises')
          .insert(templateExercises);

        if (exerciseError) throw exerciseError;
      }
    }
    // If workoutId is provided, fetch exercises from the workout
    else if (workoutId) {
      // Fetch workout exercises
      const { data: workoutExercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workoutId);

      if (exercisesError) throw exercisesError;

      if (workoutExercises && workoutExercises.length > 0) {
        // Create template exercises from workout exercises
        const templateExercises = workoutExercises.map((ex, index) => ({
          id: uuidv4(),
          template_id: templateId,
          exercise_id: ex.exercise_id,
          sets: ex.sets || 3,
          reps: ex.reps || '10-12',
          rest_time: ex.rest_time || 60,
          weight: null,
          order_position: ex.order_position || index,
          notes: ex.notes
        }));

        const { error: exerciseError } = await supabase
          .from('workout_template_exercises')
          .insert(templateExercises);

        if (exerciseError) throw exerciseError;
      }
    }

    // Return the created template with exercises
    return getWorkoutTemplate(templateId);
  } catch (error) {
    console.error("Error creating workout template:", error);
    return null;
  }
};

/**
 * Toggle favorite status for a template
 * @param templateId Template ID
 * @param isFavorite Whether to mark as favorite
 * @returns Updated template or null
 */
export const toggleFavoriteTemplate = async (
  templateId: string,
  isFavorite: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_templates')
      .update({ is_favorite: isFavorite })
      .eq('id', templateId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating template favorite status:", error);
    return false;
  }
};

/**
 * Delete a workout template
 * @param templateId Template ID
 * @returns Success status
 */
export const deleteWorkoutTemplate = async (templateId: string): Promise<boolean> => {
  try {
    // Delete associated exercises first
    const { error: exerciseError } = await supabase
      .from('workout_template_exercises')
      .delete()
      .eq('template_id', templateId);

    if (exerciseError) throw exerciseError;

    // Then delete the template
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting workout template:", error);
    return false;
  }
};

/**
 * Start a workout from a template
 * @param templateId Template ID
 * @param userId User ID
 * @returns Created workout ID or null
 */
export const startWorkoutFromTemplate = async (
  templateId: string,
  userId: string
): Promise<{ workoutId: string; exercises: any[] } | null> => {
  try {
    // Update template usage stats
    await supabase
      .from('workout_templates')
      .update({ 
        last_used_at: new Date().toISOString(),
        use_count: supabase.rpc('increment_counter', { row_id: templateId })
      })
      .eq('id', templateId);
      
    // Get the template with exercises
    const template = await getWorkoutTemplate(templateId);
    if (!template) throw new Error("Template not found");
    
    // Create a new workout
    const workoutId = uuidv4();
    const { error: workoutError } = await supabase
      .from('workouts')
      .insert({
        id: workoutId,
        user_id: userId,
        name: `${template.name}`,
        description: template.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        day_of_week: new Date().getDay() === 0 ? 7 : new Date().getDay() // Convert Sunday from 0 to 7
      });
      
    if (workoutError) throw workoutError;
    
    // Add exercises to the workout
    if (template.exercises && template.exercises.length > 0) {
      const workoutExercises = template.exercises.map(ex => ({
        id: uuidv4(),
        workout_id: workoutId,
        exercise_id: ex.exercise_id,
        sets: ex.sets,
        reps: ex.reps,
        duration: null,
        rest_time: ex.rest_time,
        order_position: ex.order_position,
        notes: ex.notes
      }));
      
      const { error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert(workoutExercises);
        
      if (exerciseError) throw exerciseError;
      
      return { 
        workoutId, 
        exercises: template.exercises.map(ex => ({
          id: ex.id,
          exercise_id: ex.exercise_id,
          exercise: ex.exercise,
          sets: ex.sets,
          reps: ex.reps
        }))
      };
    }
    
    return { workoutId, exercises: [] };
  } catch (error) {
    console.error("Error starting workout from template:", error);
    return null;
  }
};

/**
 * Create a template from the last completed workout
 * @param userId User ID
 * @param name Template name
 * @param description Template description (optional)
 * @returns Created template or null
 */
export const createTemplateFromLastWorkout = async (
  userId: string,
  name: string,
  description?: string
): Promise<WorkoutTemplate | null> => {
  try {
    // Get the most recent workout log
    const { data: recentLogs, error: logsError } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(1);

    if (logsError) throw logsError;
    if (!recentLogs || recentLogs.length === 0) {
      throw new Error("No recent workouts found");
    }

    const recentLog = recentLogs[0];

    // Create template from this log
    return createWorkoutTemplate(
      userId,
      name,
      description || `Template from workout on ${new Date(recentLog.completed_at).toLocaleDateString()}`,
      recentLog.id
    );
  } catch (error) {
    console.error("Error creating template from last workout:", error);
    return null;
  }
}; 