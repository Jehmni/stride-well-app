/**
 * Utility to map workout plans to actual database exercises
 * This is needed to fix issues with AI-generated workout plans not showing exercises
 */
import { supabase } from "@/integrations/supabase/client";
import { Exercise } from "@/models/models";
import { WorkoutPlan } from "@/components/workout/types";

/**
 * Maps the workout plan key exercises to workout_exercises table entries
 * This ensures that the AI-generated workout plans have actual exercises linked in the database
 * @param workoutPlanId The workout plan ID to map exercises for
 * @returns true if successful, false otherwise
 */
export async function mapWorkoutPlanExercises(workoutPlanId: string): Promise<boolean> {
  try {
    // 1. Fetch the workout plan
    const { data: workoutPlan, error: planError } = await supabase
      .from('workout_plans')
      .select('exercises, user_id')
      .eq('id', workoutPlanId)
      .single();

    if (planError || !workoutPlan) {
      console.error("Error fetching workout plan:", planError);
      return false;
    }

    const exercises = workoutPlan.exercises || [];
    if (!Array.isArray(exercises) || exercises.length === 0) {
      console.warn("No exercises to map for workout plan:", workoutPlanId);
      return false;
    }
    
    // 2. Fetch available exercises from database to match against plan
    const { data: availableExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, muscle_group')
      .limit(100);

    if (exercisesError || !availableExercises) {
      console.error("Error fetching available exercises:", exercisesError);
      return false;
    }
    
    // Create a workout to reference in workout_exercises
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .insert({
        name: "AI Workout Plan",
        description: "Generated from AI workout plan",
        user_id: workoutPlan.user_id,
        day_of_week: new Date().getDay() === 0 ? 7 : new Date().getDay() // Convert Sunday from 0 to 7
      })
      .select('id')
      .single();
      
    if (workoutError || !workout) {
      console.error("Error creating workout:", workoutError);
      return false;
    }
    
    const workoutId = workout.id;
    
    // 3. Loop through plan exercises and map to actual exercises
    let insertCount = 0;
    for (let i = 0; i < exercises.length; i++) {
      const planExercise = exercises[i];
      
      // Try to find matching exercise by name
      let matchingExercise = availableExercises.find(ex => 
        ex.name.toLowerCase() === planExercise.name.toLowerCase());
      
      // If no exact match, try by muscle group
      if (!matchingExercise) {
        matchingExercise = availableExercises.find(ex => 
          ex.muscle_group.toLowerCase().includes(planExercise.muscle.toLowerCase()));
      }
      
      // If still no match, just use first exercise of appropriate type
      if (!matchingExercise) {
        console.warn(`No matching exercise found for ${planExercise.name}, using default`);
        matchingExercise = availableExercises[i % availableExercises.length];
      }
      
      // Insert into workout_exercises table
      const { data: workoutExercise, error: insertError } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: workoutId,
          exercise_id: matchingExercise.id,
          sets: planExercise.sets, 
          reps: parseInt(planExercise.reps) || null,
          duration: null,
          rest_time: 60, // default 60s rest between sets
          order_position: i,
          notes: null
        })
        .select()
        .single();
      
      if (insertError) {
        console.error(`Error inserting workout exercise ${i}:`, insertError);
      } else {
        insertCount++;
      }
    }
    
    // 4. Update the workout plan with the workout ID reference
    const { error: updateError } = await supabase
      .from('workout_plans')
      .update({ 
        workout_id: workoutId,
        mapped_exercises: true
      })
      .eq('id', workoutPlanId);
    
    if (updateError) {
      console.error("Error updating workout plan with workout ID:", updateError);
      return false;
    }
    
    console.log(`Successfully mapped ${insertCount} out of ${exercises.length} exercises for workout plan ${workoutPlanId}`);
    return insertCount > 0;
    
  } catch (error) {
    console.error("Error mapping workout plan exercises:", error);
    return false;
  }
}

/**
 * Gets exercises for a workout plan by first checking if they've been mapped,
 * and if not, maps them and then returns them
 * @param workoutPlanId The ID of the workout plan to get exercises for
 * @returns Array of exercise details or null if error
 */
export async function getWorkoutPlanExercises(workoutPlanId: string) {
  try {
    // 1. Check if plan has already been mapped to workout_exercises
    const { data: plan, error: planError } = await supabase
      .from('workout_plans')
      .select('mapped_exercises, workout_id')
      .eq('id', workoutPlanId)
      .single();
      
    if (planError) {
      console.error("Error fetching workout plan mapping status:", planError);
      return null;
    }
    
    // If not yet mapped, map it first
    if (!plan.mapped_exercises && !plan.workout_id) {
      const success = await mapWorkoutPlanExercises(workoutPlanId);
      if (!success) {
        console.error("Failed to map workout plan exercises");
        return null;
      }
      
      // Fetch the updated plan with workout_id
      const { data: updatedPlan, error: updatedError } = await supabase
        .from('workout_plans')
        .select('workout_id')
        .eq('id', workoutPlanId)
        .single();
        
      if (updatedError || !updatedPlan || !updatedPlan.workout_id) {
        console.error("Error fetching updated workout plan:", updatedError);
        return null;
      }
      
      // Now fetch the exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          workout_id,
          exercise_id,
          sets,
          reps,
          duration,
          rest_time,
          order_position,
          notes,
          exercise:exercises(
            id,
            name,
            muscle_group,
            equipment_required
          )
        `)
        .eq('workout_id', updatedPlan.workout_id)
        .order('order_position', { ascending: true });
        
      if (exercisesError) {
        console.error("Error fetching mapped exercises:", exercisesError);
        return null;
      }
      
      return exercises;
    } 
    // If already mapped, just fetch the exercises
    else if (plan.workout_id) {
      const { data: exercises, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          id,
          workout_id,
          exercise_id,
          sets,
          reps,
          duration,
          rest_time,
          order_position,
          notes,
          exercise:exercises(
            id,
            name,
            muscle_group,
            equipment_required
          )
        `)
        .eq('workout_id', plan.workout_id)
        .order('order_position', { ascending: true });
        
      if (exercisesError) {
        console.error("Error fetching mapped exercises:", exercisesError);
        return null;
      }
      
      return exercises;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting workout plan exercises:", error);
    return null;
  }
}
