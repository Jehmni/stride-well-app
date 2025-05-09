/**
 * This file provides mock workout data for use when AI generation is not available
 * It simulates what would be returned by the AI API
 */
import { WorkoutDay } from "@/components/workout/types";

export interface MockWorkoutResponse {
  title: string;
  description: string;
  weekly_structure: WorkoutDay[];
  exercises: Array<{
    exercise_id: string;
    sets: number;
    reps: string;
    rest_time: number;
  }>;
}

/**
 * Generate mock workout data based on fitness goal
 * @param fitnessGoal The user's fitness goal
 * @returns Mock AI workout data
 */
export const getMockWorkoutData = (fitnessGoal: string): MockWorkoutResponse => {
  // Base structure for all workout plans
  const baseWorkout: MockWorkoutResponse = {
    title: `AI ${fitnessGoal.charAt(0).toUpperCase() + fitnessGoal.slice(1).replace('-', ' ')} Plan`,
    description: `A personalized workout plan designed to help you achieve your ${fitnessGoal.replace('-', ' ')} goals.`,
    weekly_structure: [],
    exercises: []
  };
  
  // Add goal-specific workout structure
  switch (fitnessGoal) {
    case 'weight-loss':
      baseWorkout.weekly_structure = [
        { day: "Monday", focus: "HIIT & Upper Body", duration: 45 },
        { day: "Tuesday", focus: "Lower Body & Core", duration: 45 },
        { day: "Wednesday", focus: "Cardio", duration: 30 },
        { day: "Thursday", focus: "Full Body Circuit", duration: 45 },
        { day: "Friday", focus: "HIIT & Core", duration: 30 },
        { day: "Saturday", focus: "Light Cardio", duration: 30 },
        { day: "Sunday", focus: "Rest & Recovery", duration: 0 }
      ];
      break;
      
    case 'muscle-gain':
      baseWorkout.weekly_structure = [
        { day: "Monday", focus: "Chest & Triceps", duration: 60 },
        { day: "Tuesday", focus: "Back & Biceps", duration: 60 },
        { day: "Wednesday", focus: "Rest & Recovery", duration: 0 },
        { day: "Thursday", focus: "Legs & Core", duration: 60 },
        { day: "Friday", focus: "Shoulders & Arms", duration: 45 },
        { day: "Saturday", focus: "Full Body", duration: 45 },
        { day: "Sunday", focus: "Rest & Recovery", duration: 0 }
      ];
      break;
      
    case 'general-fitness':
      baseWorkout.weekly_structure = [
        { day: "Monday", focus: "Upper Body", duration: 45 },
        { day: "Tuesday", focus: "Lower Body", duration: 45 },
        { day: "Wednesday", focus: "Cardio", duration: 30 },
        { day: "Thursday", focus: "Core", duration: 30 },
        { day: "Friday", focus: "Full Body", duration: 45 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
      break;
      
    default:
      baseWorkout.weekly_structure = [
        { day: "Monday", focus: "Full Body", duration: 45 },
        { day: "Tuesday", focus: "Cardio", duration: 30 },
        { day: "Wednesday", focus: "Core & Flexibility", duration: 30 },
        { day: "Thursday", focus: "Full Body", duration: 45 },
        { day: "Friday", focus: "HIIT", duration: 30 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
  }
  
  // Add some default exercises - these IDs would need to match real exercises in your database
  // In a real implementation, you'd query the database to get valid exercise IDs
  baseWorkout.exercises = [
    { exercise_id: "1", sets: 3, reps: "10-12", rest_time: 60 },
    { exercise_id: "2", sets: 4, reps: "8-10", rest_time: 90 },
    { exercise_id: "3", sets: 3, reps: "12-15", rest_time: 60 },
    { exercise_id: "4", sets: 3, reps: "10", rest_time: 60 },
    { exercise_id: "5", sets: 4, reps: "8", rest_time: 90 },
    { exercise_id: "6", sets: 3, reps: "12", rest_time: 60 },
    { exercise_id: "7", sets: 3, reps: "15", rest_time: 45 },
    { exercise_id: "8", sets: 4, reps: "10", rest_time: 60 }
  ];
  
  return baseWorkout;
};
