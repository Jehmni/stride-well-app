
import { Exercise } from "@/models/models";

export interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  weekly_structure: WorkoutDay[];
  exercises: WorkoutExercise[];
}

export interface UserWorkout {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutExerciseDetail {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  rest_time: number;
  order_position: number;
  notes: string | null;
  exercise: Exercise;
}

export interface TodayWorkoutProps {
  title: string;
  description: string;
  duration: number;
  exercises: number;
  date: string;
  image: string;
}

export interface NewExerciseFormData {
  exerciseId: string;
  sets: number;
  reps: number;
  duration: number | null;
  restTime: number;
  notes: string | null;
}

export interface NewWorkoutFormData {
  name: string;
  description: string;
  dayOfWeek: string;
}

