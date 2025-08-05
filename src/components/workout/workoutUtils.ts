import { supabase } from "@/integrations/supabase/client";
import { WorkoutExerciseDetail } from "./types";
import { Exercise } from "@/models/models";

/**
 * Fetches workout exercises with detailed information
 * @param workoutId The ID of the workout to fetch exercises for
 * @returns Array of workout exercises with detailed information
 */
export const fetchWorkoutExercises = async (workoutId: string): Promise<WorkoutExerciseDetail[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_in_workout', { ascending: true });

    if (error) throw error;

    // Ensure equipment_required is set (even if null) on all exercises
    return (data || []).map(ex => ({
      ...ex,
      exercise: {
        ...ex.exercise,
        equipment_required: ex.exercise?.equipment_required || null
      } as Exercise
    })) as WorkoutExerciseDetail[];
  } catch (error) {
    console.error("Error fetching workout exercises:", error);
    return [];
  }
};

/**
 * Handles deleting a workout exercise
 * @param exerciseId The ID of the workout exercise to delete
 * @returns Boolean indicating if the deletion was successful
 */
export const deleteWorkoutExercise = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting workout exercise:", error);
    return false;
  }
};

/**
 * Reorders workout exercises
 * @param exerciseId The ID of the exercise to move
 * @param workoutId The ID of the workout
 * @param direction 'up' or 'down'
 * @returns Boolean indicating if the reorder was successful
 */
export const reorderExercise = async (
  exerciseId: string, 
  workoutId: string, 
  direction: 'up' | 'down'
): Promise<boolean> => {
  try {
    // Fetch all exercises for this workout
    const { data: exercises, error: fetchError } = await supabase
      .from('workout_exercises')
      .select('*')
      .eq('workout_id', workoutId)
      .order('order_in_workout', { ascending: true });
      
    if (fetchError) throw fetchError;
    
    if (!exercises || exercises.length <= 1) {
      return false; // Nothing to reorder
    }
    
    // Find the current exercise and its index
    const currentIndex = exercises.findIndex(ex => ex.id === exerciseId);
    if (currentIndex === -1) return false;
    
    // Calculate the target index
    const targetIndex = direction === 'up' 
      ? Math.max(currentIndex - 1, 0) 
      : Math.min(currentIndex + 1, exercises.length - 1);
    
    // If there's no change in position, return
    if (targetIndex === currentIndex) return false;
    
    // Swap positions
    const targetExercise = exercises[targetIndex];
    const currentExercise = exercises[currentIndex];
    
    const { error: updateError } = await supabase
      .from('workout_exercises')
      .update({ order_in_workout: targetExercise.order_in_workout })
      .eq('id', currentExercise.id);
      
    if (updateError) throw updateError;
    
    const { error: updateError2 } = await supabase
      .from('workout_exercises')
      .update({ order_in_workout: currentExercise.order_in_workout })
      .eq('id', targetExercise.id);
      
    if (updateError2) throw updateError2;
    
    return true;
  } catch (error) {
    console.error("Error reordering exercise:", error);
    return false;
  }
};
