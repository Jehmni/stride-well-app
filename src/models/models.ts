// Types for user data
export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  age: number;
  sex: string;
  height: number;
  weight: number;
  fitness_goal: string;
  created_at: string;
  updated_at: string;
  avatar_url?: string | null;
}

// Types for workout data
export interface AIPoweredWorkoutPlan {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  ai_generated: boolean;
  user_id: string | null;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string;
  difficulty: string;
  exercise_type: string;
  equipment_required: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  rest_time: number;
  order_in_workout: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  exercise?: Exercise;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  day_of_week: number | null;
  created_at: string;
  updated_at: string;
  exercises?: WorkoutExercise[];
}

// Type for relation errors from Supabase
export interface SelectQueryError<T = string> {
  error: true;
  [key: string]: any;
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
  duration?: number;
  calories_burned?: number;
  notes?: string;
  rating?: number;
  workout_name?: string;
  workout_description?: string;
  workout_type?: 'completed' | 'custom' | 'scheduled';
  is_custom?: boolean;
  workout?: Workout | null | SelectQueryError; // Updated to handle error case
}

// Types for meal data
export interface Meal {
  id: string;
  meal_plan_id: string;
  name: string;
  description?: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe?: string;
  created_at: string;
  updated_at: string;
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  day_of_week?: number;
  created_at: string;
  updated_at: string;
  meals?: Meal[];
}

// Types for progress tracking
export interface ProgressRecord {
  id: string;
  user_id: string;
  weight?: number;
  muscle_mass?: number;
  body_fat_percentage?: number;
  created_at: string;
  notes?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  target_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

// Types for social features
export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface ActivityFeed {
  id: string;
  user_id: string;
  activity_type: string;
  content: Record<string, any>;
  is_public: boolean;
  created_at: string;
  profile?: UserProfile;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  event_type: string;
  start_time: string;
  end_time: string;
  related_id?: string;
  recurrence?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Add Json type from Supabase to use in our application
export type Json = import('@/integrations/supabase/types').Json;

// Add WorkoutPlan interfaces to match database schema
export interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

export interface WorkoutPlanExercise {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
}

export interface WorkoutPlanInsert {
  title: string;
  description: string | null;
  fitness_goal: string;
  weekly_structure: Json;
  exercises: Json;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string | null;
  fitness_goal: string;
  weekly_structure: Json;
  exercises: Json;
  user_id: string;
  created_at: string;
  times_completed?: number;
  last_completed?: string;
}

// Adding the FitnessGoals enum
export enum FitnessGoals {
  WEIGHT_LOSS = "weight-loss",
  MUSCLE_GAIN = "muscle-gain",
  GENERAL_FITNESS = "general-fitness",
  ENDURANCE = "endurance"
}

// Add ExerciseLog interface
export interface ExerciseLog {
  id: string;
  workout_log_id: string;
  exercise_id: string;
  sets_completed: number;
  reps_completed: number | null;
  weight_used: number | null;
  notes: string | null;
  completed_at: string;
  exercise?: Exercise;
}

// Workout Template
export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_favorite: boolean;
  source_workout_id: string | null;
  source_workout_log_id: string | null;
  exercises: WorkoutTemplateExercise[];
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  use_count: number;
}

// Workout Template Exercise
export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  sets: number;
  reps: string | number;
  rest_time: number | null;
  weight: number | null;
  order_position: number;
  notes: string | null;
  exercise?: Exercise;
}

// Exercise Variation/Alternative
export interface ExerciseVariation {
  id: string;
  primary_exercise_id: string;
  alternative_exercise_id: string;
  variation_type: 'equipment' | 'difficulty' | 'similar' | 'target';
  description: string | null;
  primary_exercise?: Exercise;
  alternative_exercise?: Exercise;
}
