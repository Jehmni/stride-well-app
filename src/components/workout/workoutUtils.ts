
import { supabase } from "@/integrations/supabase/client";
import { Json, WorkoutPlanInsert } from "@/models/models";
import { toast } from "sonner";
import { WorkoutExerciseDetail, WorkoutPlan } from "./types";

// Fixed function to properly format the data for Supabase
export const insertWorkoutPlan = async (workoutPlans: WorkoutPlan[]) => {
  try {
    // Insert one plan at a time to avoid array insertion issues
    for (const plan of workoutPlans) {
      // Make sure the plan object matches the expected structure for the workout_plans table
      const formattedPlan: WorkoutPlanInsert = {
        title: plan.title,
        description: plan.description,
        fitness_goal: plan.fitness_goal,
        weekly_structure: plan.weekly_structure as Json,
        exercises: plan.exercises as Json
      };

      const { error } = await supabase
        .from('workout_plans')
        .insert(formattedPlan);
        
      if (error) throw error;
    }
    
    console.log("Workout plans inserted successfully");
    return true;
  } catch (error) {
    console.error("Error inserting workout plans:", error);
    return false;
  }
};

export const fetchWorkoutExercises = async (workoutId: string): Promise<WorkoutExerciseDetail[]> => {
  try {
    const { data, error } = await supabase
      .from('workout_exercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('workout_id', workoutId)
      .order('order_position', { ascending: true });
      
    if (error) throw error;
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching workout exercises:", error);
    toast.error("Failed to load workout details");
    return [];
  }
};

export const removeExerciseFromWorkout = async (exerciseId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workout_exercises')
      .delete()
      .eq('id', exerciseId);
      
    if (error) throw error;
    
    toast.success("Exercise removed from workout!");
    return true;
  } catch (error: any) {
    console.error("Error removing exercise:", error);
    toast.error("Failed to remove exercise");
    return false;
  }
};

export const deleteWorkout = async (workoutId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId);
      
    if (error) throw error;
    
    toast.success("Workout deleted successfully!");
    return true;
  } catch (error: any) {
    console.error("Error deleting workout:", error);
    toast.error("Failed to delete workout");
    return false;
  }
};
