
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";
import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";

// Generate a personalized workout plan based on user data and fitness goal
export const generatePersonalizedWorkoutPlan = async (
  userProfile: UserProfile
): Promise<WorkoutPlan | null> => {
  try {
    // First, check if there's an existing workout plan for this goal in our database
    const { data: existingPlans, error: fetchError } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('fitness_goal', userProfile.fitness_goal)
      .limit(1);

    if (fetchError) throw fetchError;

    // If we found a matching plan, return it
    if (existingPlans && existingPlans.length > 0) {
      return {
        id: existingPlans[0].id,
        title: existingPlans[0].title,
        description: existingPlans[0].description,
        fitness_goal: existingPlans[0].fitness_goal,
        weekly_structure: existingPlans[0].weekly_structure as unknown as WorkoutDay[],
        exercises: existingPlans[0].exercises as unknown as WorkoutExercise[]
      };
    }

    // If no plan exists, generate one based on the user's profile
    const plan = await generateWorkoutPlanForGoal(
      userProfile.fitness_goal,
      userProfile.age,
      userProfile.sex,
      userProfile.height,
      userProfile.weight
    );

    // Store the generated plan in the database for future use
    if (plan) {
      const { data: insertedPlan, error: insertError } = await supabase
        .from('workout_plans')
        .insert({
          title: plan.title,
          description: plan.description,
          fitness_goal: plan.fitness_goal,
          weekly_structure: plan.weekly_structure as any,
          exercises: plan.exercises as any
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return {
        ...plan,
        id: insertedPlan.id
      };
    }

    return null;
  } catch (error) {
    console.error("Error generating personalized workout plan:", error);
    return null;
  }
};

// Generate a workout plan based on fitness goal and user attributes
const generateWorkoutPlanForGoal = async (
  fitnessGoal: string,
  age: number,
  sex: string,
  height: number,
  weight: number
): Promise<Omit<WorkoutPlan, "id"> | null> => {
  // Fetch appropriate exercises from the database based on fitness goal
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
  rating: number | null = null
) => {
  try {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        duration,
        calories_burned: caloriesBurned,
        notes,
        rating,
        completed_at: new Date().toISOString()
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
    // Use RPC function to log exercise completion
    const { data, error } = await supabase
      .rpc('log_exercise_completion', { 
        workout_log_id_param: workoutLogId, 
        exercise_id_param: exerciseId,
        sets_completed_param: setsCompleted,
        reps_completed_param: repsCompleted || null,
        weight_used_param: weightUsed || null,
        notes_param: notes || null
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error logging exercise completion:", error);
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
    // Use RPC function to get exercise progress history safely
    const { data, error } = await supabase
      .rpc('get_exercise_progress_history', { 
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
      let streakDates = [uniqueDates[0]];
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i-1]);
        prevDate.setDate(prevDate.getDate() - 1);
        
        if (prevDate.getTime() === uniqueDates[i]) {
          streakDates.push(uniqueDates[i]);
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
