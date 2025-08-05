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
  ai_generated?: boolean;
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
  workout_id?: string;
  exercise_id: string;
  sets: number;
  reps: number | string | null;
  duration: number | null; // Maps to duration_seconds in DB
  rest_time: number; // Maps to rest_seconds in DB
  order_in_workout: number;
  notes: string | null;
  weight_kg?: number | null;
  comments?: string | null;
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

// Types for RPC function returns
export interface ExerciseCount {
  exercise_id: string;
  count: number;
  name: string;
  muscle_group: string;
}

export interface TopExercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  count: number;
}

export interface ExerciseProgressEntry {
  id: string;
  workout_log_id: string;
  completed_at: string;
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  notes: string | null;
}

export interface WorkoutStatistics {
  total_workouts: number;
  recent_workouts: number;
  total_duration: number;
  avg_duration: number;
  last_workout_date: string | null;
  current_streak: number;
}

export interface ChartDataPoint {
  date: string;
  weight: number;
  reps: number;
  sets: number;
  timestamp: string;
}
