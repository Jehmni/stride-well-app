import { supabase } from '@/integrations/supabase/client';

/**
 * Log a completed workout
 * @param userId User ID completing the workout
 * @param workoutId The workout being completed
 * @param data Additional workout data
 * @returns Created workout log ID or null if failed
 */
export const logCompletedWorkout = async (
  userId: string,
  workoutId: string,
  data: {
    duration?: number;
    caloriesBurned?: number;
    notes?: string;
    rating?: number;
    workoutName?: string;
    workoutDescription?: string;
  }
): Promise<string | null> => {
  try {
    console.log(`Logging completed workout: ${workoutId} for user: ${userId}`);
    
    // First try using the RPC function if available
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('create_workout_log', { 
          workout_id_param: workoutId, 
          user_id_param: userId,
          notes_param: data.notes || null
        });
        
      if (!rpcError && rpcData) {
        console.log("Successfully created workout log via RPC:", rpcData);
        
        // Now update with additional fields
        const { error: updateError } = await supabase
          .from('workout_logs')
          .update({
            duration: data.duration,
            calories_burned: data.caloriesBurned,
            rating: data.rating,
            workout_name: data.workoutName,
            workout_description: data.workoutDescription,
            workout_type: 'completed' // Explicitly mark as completed workout
          })
          .eq('id', rpcData)
          .eq('user_id', userId);
          
        if (updateError) {
          console.error("Error updating workout log:", updateError);
        }
        
        return rpcData;
      } else {
        console.warn("RPC error, falling back to direct insert:", rpcError);
      }
    } catch (rpcError) {
      console.warn("RPC function failed, falling back to direct insert:", rpcError);
    }
    
    // Fall back to direct insert if RPC fails
    const { data: insertData, error: insertError } = await supabase
      .from('workout_logs')
      .insert({
        workout_id: workoutId,
        user_id: userId,
        notes: data.notes,
        completed_at: new Date().toISOString(),
        duration: data.duration,
        calories_burned: data.caloriesBurned,
        rating: data.rating,
        workout_name: data.workoutName,
        workout_description: data.workoutDescription,
        workout_type: 'completed' // Explicitly mark as completed workout
      })
      .select('id')
      .single();
      
    if (insertError) {
      console.error("Error logging workout completion:", insertError);
      return null;
    }
    
    return insertData.id;
    
  } catch (error) {
    console.error("Error in logCompletedWorkout:", error);
    return null;
  }
};

/**
 * Log exercises completed during a workout
 * @param workoutLogId ID of the workout log
 * @param exercises List of completed exercises
 * @returns Whether the operation was successful
 */
export const logCompletedExercises = async (
  workoutLogId: string,
  exercises: Array<{
    exerciseId: string;
    setsCompleted: number;
    repsCompleted?: number;
    weightUsed?: number;
    notes?: string;
  }>
): Promise<boolean> => {
  try {
    // Format exercises for the database
    const exerciseLogs = exercises.map(exercise => ({
      workout_log_id: workoutLogId,
      exercise_id: exercise.exerciseId,
      sets_completed: exercise.setsCompleted,
      reps_completed: exercise.repsCompleted || null,
      weight_used: exercise.weightUsed || null,
      notes: exercise.notes || null,
      completed_at: new Date().toISOString()
    }));
    
    // Insert all exercise logs
    const { error } = await supabase
      .from('exercise_logs')
      .insert(exerciseLogs);
      
    if (error) {
      console.error("Error logging exercise completions:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error in logCompletedExercises:", error);
    return false;
  }
};
