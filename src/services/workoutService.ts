import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";
import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";
import { getExerciseProgressHistoryRPC, logExerciseCompletionRPC } from '@/integrations/supabase/functions';
import { generateAIWorkoutPlan } from '@/integrations/ai/workoutAIService';
import { isValidUUID } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a personalized workout plan based on user data and fitness goal
 * Tries AI-generation first, then falls back to rule-based if needed
 * @param userProfile User's profile data
 * @param forceRegenerate If true, will always generate a new plan even if one exists
 * @returns A workout plan or null if generation failed
 */
export const generatePersonalizedWorkoutPlan = async (
  userProfile: UserProfile,
  forceRegenerate = false
): Promise<WorkoutPlan | null> => {  
  try {
    // First, check for existing plans in the database unless regeneration is forced
    const existingPlan = await getExistingWorkoutPlan(userProfile, forceRegenerate);
    if (existingPlan) {
      console.log("Using existing workout plan from the database");
      return existingPlan;
    }

    // Try AI-based generation first
    console.log("Attempting to generate AI workout plan");
    const aiPlan = await generateAIWorkoutPlan(userProfile);
    if (aiPlan) {
      console.log("Successfully generated AI workout plan");
      return aiPlan;
    }
    
    console.log("AI generation failed, falling back to rule-based generation");
    // Fallback to rule-based generation
    console.log("AI generation unavailable, falling back to rule-based workout generation");
    const plan = await generateRuleBasedWorkoutPlanInternal(
      userProfile.fitness_goal,
      userProfile.age,
      userProfile.sex,
      userProfile.height,
      userProfile.weight
    );

    // Store the rule-based plan in the database
    if (plan) {
      return await saveWorkoutPlan(plan, userProfile.id);
    }

    return null;
  } catch (error) {
    console.error("Error generating personalized workout plan:", error);
    return null;
  }
};

/**
 * Get existing workout plan from the database for a user
 * @param userProfile User profile to get workout plan for
 * @param forceRegenerate If true, will return null to force regeneration even if a plan exists
 * @returns Existing workout plan or null
 */
const getExistingWorkoutPlan = async (
  userProfile: UserProfile,
  forceRegenerate = false
): Promise<WorkoutPlan | null> => {
  // If regeneration is forced, skip checking for existing plans
  if (forceRegenerate) {
    console.log("Force regenerate flag is set, will create a new plan");
    return null;
  }

  try {
    // Check for existing AI workout plans
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('ai_generated', true)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error("Error fetching existing workout plans:", error);
      return null;
    }
    
    if (data && data.length > 0) {
      // Found an existing workout plan
      const existingPlan = data[0];
      
      // Convert to proper format
      return {
        id: existingPlan.id,
        title: existingPlan.title,
        description: existingPlan.description,
        fitness_goal: existingPlan.fitness_goal,
        weekly_structure: (existingPlan.weekly_structure || []) as WorkoutDay[],
        exercises: (existingPlan.exercises || []) as WorkoutExercise[],
        ai_generated: existingPlan.ai_generated
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error in getExistingWorkoutPlan:", error);
    return null;
  }
};

/**
 * Save a workout plan to the database
 * @param plan Workout plan to save
 * @param userId User ID to associate with the plan
 * @returns Saved workout plan with ID
 */
async function saveWorkoutPlan(
  plan: Omit<WorkoutPlan, "id">, 
  userId: string
): Promise<WorkoutPlan | null> {
  try {    const { data: insertedPlan, error } = await supabase
      .from('workout_plans')
      .insert({
        name: plan.title, // Use title as name since name is required
        title: plan.title,
        description: plan.description,
        fitness_goal: plan.fitness_goal,
        weekly_structure: plan.weekly_structure as any,
        exercises: plan.exercises as any,
        user_id: userId,
        ai_generated: plan.ai_generated || false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving workout plan:", error);
      return null;
    }

    return {
      ...plan,
      id: insertedPlan.id
    };
  } catch (error) {
    console.error("Error saving workout plan:", error);
    return null;
  }
}

// Helper functions for rule-based workout generation

/**
 * Generate rule-based workout plan based on fitness goal
 * @param fitnessGoal User's fitness goal
 * @param age User's age
 * @param sex User's biological sex
 * @param height User's height in cm
 * @param weight User's weight in kg
 * @returns Generated workout plan or null if generation failed
 */
const generateRuleBasedWorkoutPlanInternal = async (
  fitnessGoal: string,
  age: number,
  sex: string,
  height: number,
  weight: number
): Promise<Omit<WorkoutPlan, "id"> | null> => {
  try {
    // Fetch exercises from the database
    const { data: exercises, error } = await supabase
      .from('exercises')
      .select('*')
      .filter('difficulty', 'in', getAppropriateDifficulty(age))
      .filter('exercise_type', 'in', getExerciseTypes(fitnessGoal))
      .limit(30);

    if (error) {
      console.error("Error fetching exercises:", error);
      return null;
    }

    // Group exercises by muscle group
    const exercisesByMuscle = groupExercisesByMuscleGroup(exercises);

    // Generate weekly structure based on fitness goal
    const weeklyStructure = generateWeeklyStructure(fitnessGoal);

    // Select key exercises for the plan
    const keyExercises = selectKeyExercises(exercisesByMuscle, fitnessGoal);

    return {
      title: getPlanTitle(fitnessGoal),
      description: getPlanDescription(fitnessGoal),
      fitness_goal: fitnessGoal,
      weekly_structure: weeklyStructure,
      exercises: keyExercises
    };
  } catch (error) {
    console.error("Error generating rule-based workout plan:", error);
    return null;
  }
};

// Helper function to get appropriate difficulty based on user age
const getAppropriateDifficulty = (age: number): string[] => {
  if (age < 30) return ['beginner', 'intermediate'];
  if (age < 50) return ['beginner', 'intermediate'];
  return ['beginner'];
};

// Helper function to get exercise types based on fitness goal
const getExerciseTypes = (fitnessGoal: string): string[] => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return ['cardio', 'hiit', 'circuit'];
    case 'muscle-gain':
      return ['strength', 'resistance'];
    case 'general-fitness':
      return ['functional', 'mobility', 'cardio', 'strength'];
    case 'endurance':
      return ['cardio', 'circuit', 'endurance'];
    default:
      return ['functional', 'strength', 'cardio'];
  }
};

// Group exercises by muscle group
const groupExercisesByMuscleGroup = (exercises: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  
  for (const exercise of exercises) {
    if (!groups[exercise.muscle_group]) {
      groups[exercise.muscle_group] = [];
    }
    groups[exercise.muscle_group].push(exercise);
  }
  
  return groups;
};

// Generate weekly structure based on fitness goal
const generateWeeklyStructure = (fitnessGoal: string): WorkoutDay[] => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return [
        { day: "Monday", focus: "HIIT & Core", duration: 40 },
        { day: "Tuesday", focus: "Lower Body", duration: 40 },
        { day: "Wednesday", focus: "Cardio", duration: 45 },
        { day: "Thursday", focus: "Upper Body", duration: 40 },
        { day: "Friday", focus: "Full Body Circuit", duration: 45 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
    case 'muscle-gain':
      return [
        { day: "Monday", focus: "Chest & Triceps", duration: 60 },
        { day: "Tuesday", focus: "Back & Biceps", duration: 60 },
        { day: "Wednesday", focus: "Rest", duration: 0 },
        { day: "Thursday", focus: "Legs & Core", duration: 60 },
        { day: "Friday", focus: "Shoulders & Arms", duration: 60 },
        { day: "Saturday", focus: "Full Body", duration: 45 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
    case 'general-fitness':
      return [
        { day: "Monday", focus: "Full Body", duration: 45 },
        { day: "Tuesday", focus: "Cardio", duration: 30 },
        { day: "Wednesday", focus: "Core & Mobility", duration: 30 },
        { day: "Thursday", focus: "Rest", duration: 0 },
        { day: "Friday", focus: "Full Body", duration: 45 },
        { day: "Saturday", focus: "Cardio & Core", duration: 40 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
    case 'endurance':
      return [
        { day: "Monday", focus: "Long Cardio", duration: 60 },
        { day: "Tuesday", focus: "Strength Endurance", duration: 45 },
        { day: "Wednesday", focus: "Interval Training", duration: 40 },
        { day: "Thursday", focus: "Active Recovery", duration: 30 },
        { day: "Friday", focus: "Cardio & Core", duration: 45 },
        { day: "Saturday", focus: "Long Cardio", duration: 75 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
    default:
      return [
        { day: "Monday", focus: "Full Body", duration: 45 },
        { day: "Tuesday", focus: "Cardio", duration: 30 },
        { day: "Wednesday", focus: "Rest", duration: 0 },
        { day: "Thursday", focus: "Full Body", duration: 45 },
        { day: "Friday", focus: "Cardio", duration: 30 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
  }
};

// Select key exercises for the plan based on muscle groups
const selectKeyExercises = (
  exercisesByMuscle: Record<string, any[]>,
  fitnessGoal: string
): WorkoutExercise[] => {
  const result: WorkoutExercise[] = [];
  
  // Define which muscle groups to prioritize based on fitness goal
  const priorityMuscles = getPriorityMuscleGroups(fitnessGoal);
  
  // Add 1-2 exercises from each priority muscle group
  for (const muscle of priorityMuscles) {
    if (exercisesByMuscle[muscle] && exercisesByMuscle[muscle].length > 0) {
      // Get up to 2 exercises from this muscle group
      const count = Math.min(2, exercisesByMuscle[muscle].length);
      
      for (let i = 0; i < count; i++) {
        const exercise = exercisesByMuscle[muscle][i];
        result.push({
          name: exercise.name,
          sets: getSetsForGoal(fitnessGoal),
          reps: getRepsForGoal(fitnessGoal),
          muscle: muscle
        });
      }
    }
  }
  
  return result;
};

// Get priority muscle groups based on fitness goal
const getPriorityMuscleGroups = (fitnessGoal: string): string[] => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return ['legs', 'back', 'chest', 'core'];
    case 'muscle-gain':
      return ['chest', 'back', 'legs', 'shoulders', 'arms'];
    case 'general-fitness':
      return ['core', 'legs', 'back', 'chest', 'shoulders'];
    case 'endurance':
      return ['legs', 'core', 'back', 'shoulders'];
    default:
      return ['legs', 'back', 'chest', 'core'];
  }
};

// Get recommended sets based on fitness goal
const getSetsForGoal = (fitnessGoal: string): number => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return 3;
    case 'muscle-gain':
      return 4;
    case 'general-fitness':
      return 3;
    case 'endurance':
      return 2;
    default:
      return 3;
  }
};

// Get recommended reps based on fitness goal
const getRepsForGoal = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return '12-15';
    case 'muscle-gain':
      return '8-12';
    case 'general-fitness':
      return '10-12';
    case 'endurance':
      return '15-20';
    default:
      return '10-15';
  }
};

// Get plan title based on fitness goal
const getPlanTitle = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return 'Fat Burning Plan';
    case 'muscle-gain':
      return 'Muscle Building Plan';
    case 'general-fitness':
      return 'Total Fitness Plan';
    case 'endurance':
      return 'Endurance Builder';
    default:
      return 'Personalized Workout Plan';
  }
};

// Get plan description based on fitness goal
const getPlanDescription = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return 'High-intensity workouts designed for maximum calorie burn and fat loss';
    case 'muscle-gain':
      return 'Progressive resistance training focused on building muscle and strength';
    case 'general-fitness':
      return 'Balanced approach to improve overall fitness, mobility, and health';
    case 'endurance':
      return 'Cardio-focused plan to build stamina and cardiovascular health';
    default:
      return 'Customized workout plan based on your fitness profile';
  }
};

/**
 * Clear all existing AI-generated workout plans for a user
 * @param userId User ID to clear plans for
 * @returns True if successful
 */
export const clearExistingAIPlans = async (userId: string): Promise<boolean> => {
  try {
    console.log(`Attempting to clear AI plans for user: ${userId}`);
    
    // First, count how many plans will be deleted
    const { count, error: countError } = await supabase
      .from('workout_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('ai_generated', true);
      
    console.log(`Found ${count || 0} AI workout plans to delete`);
    
    // Then delete them
    const { error } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId)
      .eq('ai_generated', true);
    
    if (error) {
      console.error("Error clearing existing AI plans:", error);
      return false;
    }
    
    console.log(`✓ Cleared ${count || 0} existing AI workout plans for user: ${userId}`);
    return true;
  } catch (error) {
    console.error("Error in clearExistingAIPlans:", error);
    return false;
  }
};

// Fetch user's saved workouts
export const fetchUserWorkouts = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching user workouts:", error);
    return [];
  }
};

// Log a completed workout
export const logWorkoutCompletion = async (
  userId: string,
  workoutId: string,
  duration: number,
  caloriesBurned: number | null = null,
  notes: string | null = null,
  rating: number | null = null,
  isCustom: boolean = false
) => {
  try {
    console.log("Logging workout completion with params:", { 
      userId, workoutId, duration, caloriesBurned, 
      notes, rating, isCustom 
    });
    
    let actualWorkoutId = workoutId;
    let workoutName = null;
    let workoutDescription = null;
    
    // For special IDs like "today-workout", create a real workout entry
    if (workoutId === 'today-workout' || !isValidUUID(workoutId)) {
      console.log("Converting non-UUID workout ID to valid UUID:", workoutId);
      
      // Create a real workout entry
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          user_id: userId,
          name: "Daily Workout",
          description: "Completed daily workout",
          day_of_week: new Date().getDay() === 0 ? 7 : new Date().getDay() // Convert Sunday from 0 to 7
        })
        .select('id, name, description')
        .single();
        
      if (workoutError) {
        console.error("Error creating workout record:", workoutError);
        throw workoutError;
      }
      
      console.log("Created new workout with ID:", workoutData.id);
      actualWorkoutId = workoutData.id;
      workoutName = workoutData.name;
      workoutDescription = workoutData.description;
    } else {
      // Get the workout name and description if possible
      try {
        const { data: workoutData } = await supabase
          .from('workouts')
          .select('name, description')
          .eq('id', actualWorkoutId)
          .single();
          
        if (workoutData) {
          workoutName = workoutData.name;
          workoutDescription = workoutData.description;
        }
      } catch (e) {
        console.log("Could not fetch workout details:", e);
      }
    }
    
    // Use the new complete_workout function if available
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'complete_workout',
        {
          p_workout_id: actualWorkoutId,
          p_user_id: userId,
          p_duration: duration,
          p_calories_burned: caloriesBurned,
          p_notes: notes,
          p_rating: rating,
          p_is_from_ai_plan: false
        }
      );
      
      if (!rpcError && rpcData) {
        // No need to update rating separately as it's included in the function call
        console.log("Successfully created workout log via RPC:", rpcData);
        
        return rpcData;
      }
    } catch (rpcErr) {
      console.warn("RPC function not available, falling back to direct insert:", rpcErr);
    }
    
    // Fall back to direct insert if RPC fails
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_id: actualWorkoutId,
        duration,
        calories_burned: caloriesBurned,
        notes,
        rating,
        completed_at: new Date().toISOString(),
        workout_type: isCustom ? 'custom' : 'completed',
        is_custom: isCustom,
        workout_name: workoutName,
        workout_description: workoutDescription
      })
      .select()
      .single();

    if (error) throw error;
    return data?.id || null; // Return the ID explicitly for DetailedWorkoutLog
  } catch (error) {
    console.error("Error logging workout completion:", error);
    return null;
  }
};

// Track user's exercise progress over time
export const getExerciseProgressHistory = async (
  userId: string,
  exerciseId: string,
  limit: number = 10
) => {
  try {
    // Use RPC function wrapper to get exercise progress history safely
    const { data, error } = await getExerciseProgressHistoryRPC({ 
      user_id_param: userId,
      exercise_id_param: exerciseId,
      limit_param: limit
    });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching exercise progress:", error);
    return [];
  }
};

// Log individual exercise completion within a workout
export const logExerciseCompletion = async (
  workoutLogId: string,
  exerciseId: string,
  setsCompleted: number,
  repsCompleted?: number,
  weightUsed?: number,
  notes?: string
) => {
  try {
    // Validate parameters before calling the RPC function
    if (!workoutLogId || !exerciseId) {
      throw new Error("Missing required parameters: workout log ID or exercise ID");
    }
    
    console.log("Logging exercise with params:", {
      workoutLogId,
      exerciseId,
      setsCompleted,
      repsCompleted: repsCompleted || null,
      weightUsed: weightUsed || null,
      notes: notes || null
    });
    
    // First try with newer parameter format
    try {      const { data: newData, error: newError } = await supabase.rpc(
        'log_exercise_completion',
        {
          workout_log_id_param: workoutLogId,
          exercise_id_param: exerciseId,
          sets_completed_param: setsCompleted,
          reps_completed_param: repsCompleted || null,
          weight_used_param: weightUsed || null,
          notes_param: notes || null
        }
      );
      
      if (!newError) {
        console.log("Successfully logged exercise via newer RPC format");
        return newData;
      }
    } catch (newErr) {
      console.log("Newer RPC format failed, trying older format", newErr);
    }
    
    // Fall back to older parameter format
    try {
      const { data, error } = await supabase.rpc(
        'log_exercise_completion',
        {
          workout_log_id_param: workoutLogId,
          exercise_id_param: exerciseId,
          sets_completed_param: setsCompleted,
          reps_completed_param: repsCompleted !== undefined ? repsCompleted : null,
          weight_used_param: weightUsed !== undefined ? weightUsed : null,
          notes_param: notes || null
        }
      );

      if (error) {
        console.error("RPC returned error:", error);
        throw new Error(error.message || "Error logging exercise completion");
      }
      
      console.log("Successfully logged exercise via older RPC format");
      return data;
    } catch (rpcErr) {
      console.error("RPC function error:", rpcErr);
      throw new Error("Failed to log exercise via RPC. Falling back to direct insert.");
    }
    
    // If both RPC attempts fail, try direct insert as a last resort
    const { data: directData, error: directError } = await supabase
      .from('exercise_logs')
      .insert({
        workout_log_id: workoutLogId,
        exercise_id: exerciseId,
        sets_completed: setsCompleted,
        reps_completed: repsCompleted,
        weight_used: weightUsed,
        notes: notes,
        completed_at: new Date().toISOString()
      })
      .select('id')
      .single();
      
    if (directError) {
      console.error("Direct insert error:", directError);
      throw new Error(directError.message);
    }
    
    console.log("Successfully logged exercise via direct insert");
    return directData.id;
  } catch (error) {
    console.error("Error logging exercise completion:", error);
    throw error; // Rethrow the error so the calling function can handle it
  }
};

// Get workout completion statistics for a user
export const getUserWorkoutStatistics = async (userId: string) => {
  try {
    // Get total workout count
    const { count: totalWorkouts, error: countError } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (countError) throw countError;
    
    // Get workouts completed in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count: recentWorkouts, error: recentError } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('completed_at', thirtyDaysAgo.toISOString());
      
    if (recentError) throw recentError;
    
    // Get total duration of all workouts
    const { data: durationData, error: durationError } = await supabase
      .from('workout_logs')
      .select('duration, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
      
    if (durationError) throw durationError;
    
    const totalDuration = durationData?.reduce((sum, log) => sum + (log.duration || 0), 0) || 0;
    const avgDuration = totalWorkouts ? Math.round(totalDuration / totalWorkouts) : 0;
    
    // Get latest workout date
    const lastWorkoutDate = durationData && durationData.length > 0 ? durationData[0].completed_at : null;
    
    // Calculate workout streak
    let currentStreak = 0;
    if (durationData && durationData.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const workoutDates = durationData
        .map(log => {
          const date = new Date(log.completed_at);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
        .sort((a, b) => b - a);
      
      // Remove duplicate dates (more than one workout in a day)
      const uniqueDates = [...new Set(workoutDates)];
        // Calculate current streak
      let streakDates = uniqueDates.length > 0 ? [uniqueDates[0]] : [];
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i-1] as number);
        prevDate.setDate(prevDate.getDate() - 1);
        
        if (prevDate.getTime() === uniqueDates[i]) {
          streakDates.push(uniqueDates[i] as number);
        } else {
          break;
        }
      }
      
      currentStreak = streakDates.length;
    }
    
    return {
      total_workouts: totalWorkouts || 0,
      recent_workouts: recentWorkouts || 0,
      total_duration: totalDuration,
      avg_duration: avgDuration,
      last_workout_date: lastWorkoutDate,
      current_streak: currentStreak
    };
  } catch (error) {
    console.error("Error fetching workout statistics:", error);
    return {
      totalWorkouts: 0,
      recentWorkouts: 0,
      totalDuration: 0,
      averageDuration: 0
    };
  }
};

/**
 * Logs a workout completion with all exercise details in one call
 */
export const logWorkoutWithExercises = async ({
  userId,
  workoutId,
  workoutTitle,
  duration,
  caloriesBurned,
  notes,
  rating,
  exercises
}: {
  userId: string;
  workoutId: string;
  workoutTitle: string;
  duration: number;
  caloriesBurned: number | null;
  notes: string | null;
  rating: number;
  exercises: Array<{
    exercise_id: string;
    sets_completed: number;
    reps_completed: number;
    weight_used: number | null;
    notes: string | null;
  }>;
}): Promise<string | null> => {
  try {
    // Generate workout log ID
    const workoutLogId = uuidv4();
    
    // Create workout log
    const { error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        id: workoutLogId,
        user_id: userId,
        workout_id: workoutId,
        completed_at: new Date().toISOString(),
        duration,
        calories_burned: caloriesBurned,
        notes,
        rating,
        workout_type: 'completed',
        workout_name: workoutTitle,
        is_custom: false
      });

    if (workoutError) throw workoutError;

    // Insert exercise logs
    const { error: exercisesError } = await supabase
      .from('exercise_logs')
      .insert(
        exercises.map(ex => ({
          workout_log_id: workoutLogId,
          ...ex,
          completed_at: new Date().toISOString()
        }))
      );

    if (exercisesError) throw exercisesError;

    return workoutLogId;
  } catch (error) {
    console.error("Error logging workout with exercises:", error);
    return null;
  }
};
