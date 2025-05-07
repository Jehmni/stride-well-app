import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Generate a workout plan based on fitness goal and user attributes
 * @param fitnessGoal User's fitness goal
 * @param age User's age
 * @param sex User's sex
 * @param height User's height in cm
 * @param weight User's weight in kg
 * @returns Generated workout plan
 */
export const generateRuleBasedWorkoutPlan = async (
  fitnessGoal: string,
  age: number,
  sex: string,
  height: number,
  weight: number
): Promise<Omit<WorkoutPlan, "id"> | null> => {
  try {
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
  } catch (error) {
    console.error("Error generating rule-based workout plan:", error);
    return null;
  }
};

/**
 * Helper function to get appropriate difficulty based on user age
 */
export const getAppropriateDifficulty = (age: number): string[] => {
  if (age < 30) return ['beginner', 'intermediate'];
  if (age < 50) return ['beginner', 'intermediate'];
  return ['beginner'];
};

/**
 * Helper function to get exercise types based on fitness goal
 */
export const getExerciseTypes = (fitnessGoal: string): string[] => {
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

/**
 * Group exercises by muscle group
 */
export const groupExercisesByMuscleGroup = (exercises: any[]): Record<string, any[]> => {
  const groups: Record<string, any[]> = {};
  
  for (const exercise of exercises) {
    if (!groups[exercise.muscle_group]) {
      groups[exercise.muscle_group] = [];
    }
    groups[exercise.muscle_group].push(exercise);
  }
  
  return groups;
};

/**
 * Generate weekly structure based on fitness goal
 */
export const generateWeeklyStructure = (fitnessGoal: string): WorkoutDay[] => {
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

/**
 * Select key exercises for the plan based on muscle groups
 */
export const selectKeyExercises = (
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

/**
 * Get priority muscle groups based on fitness goal
 */
export const getPriorityMuscleGroups = (fitnessGoal: string): string[] => {
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

/**
 * Get recommended sets based on fitness goal
 */
export const getSetsForGoal = (fitnessGoal: string): number => {
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

/**
 * Get recommended reps based on fitness goal
 */
export const getRepsForGoal = (fitnessGoal: string): string => {
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

/**
 * Get plan title based on fitness goal
 */
export const getPlanTitle = (fitnessGoal: string): string => {
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

/**
 * Get plan description based on fitness goal
 */
export const getPlanDescription = (fitnessGoal: string): string => {
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
