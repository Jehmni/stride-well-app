/**
 * Comprehensive TypeScript Types for the Stride-Well App
 * Centralized type definitions to ensure type safety across the application
 */

import { Database } from '@/integrations/supabase/types';
import { FITNESS_CONFIG, UI_CONFIG } from '@/lib/constants';

// Base Types
export type UUID = string;
export type ISODateString = string;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Database Types (re-exported for convenience)
export type DbUserProfile = Database['public']['Tables']['user_profiles']['Row'];
export type DbWorkoutPlan = Database['public']['Tables']['workout_plans']['Row'];
export type DbExercise = Database['public']['Tables']['exercises']['Row'];
export type DbWorkoutLog = Database['public']['Tables']['workout_logs']['Row'];
export type DbExerciseLog = Database['public']['Tables']['exercise_logs']['Row'];

// User Types
export interface UserProfile extends Omit<DbUserProfile, 'avatar_url'> {
  full_name?: string;
  avatar_url?: string;
}

export interface OnboardingData {
  personal_info: {
    first_name: string;
    last_name: string;
    age: number;
    sex: 'male' | 'female' | 'other';
    height: number;
    weight: number;
  };
  fitness_goals: {
    primary_goal: typeof FITNESS_CONFIG.FITNESS_GOALS[number];
    activity_level: typeof FITNESS_CONFIG.ACTIVITY_LEVELS[number];
    workout_frequency: number;
    available_equipment: string[];
    target_areas: typeof FITNESS_CONFIG.BODY_PARTS[number][];
  };
}

// Workout Types
export interface WorkoutExercise {
  id: UUID;
  exercise_id: UUID;
  exercise_name: string;
  exercise_description?: string;
  exercise_category: typeof FITNESS_CONFIG.EXERCISE_CATEGORIES[number];
  target_muscle_group: typeof FITNESS_CONFIG.BODY_PARTS[number];
  sets: number;
  reps: number;
  weight?: number;
  duration?: number; // in seconds for time-based exercises
  rest_time: number; // in seconds
  instructions?: string;
  video_url?: string;
  image_url?: string;
  difficulty_level: typeof FITNESS_CONFIG.DIFFICULTY_LEVELS[number];
  equipment_needed?: string[];
  is_completed?: boolean;
  notes?: string;
}

export interface WorkoutDay {
  id: UUID;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  day_name: string;
  exercises: WorkoutExercise[];
  estimated_duration: number; // in minutes
  difficulty_level: typeof FITNESS_CONFIG.DIFFICULTY_LEVELS[number];
  focus_areas: typeof FITNESS_CONFIG.BODY_PARTS[number][];
  is_rest_day: boolean;
}

export interface WorkoutPlan {
  id: UUID;
  user_id?: UUID;
  title: string;
  description: string;
  fitness_goal: typeof FITNESS_CONFIG.FITNESS_GOALS[number];
  difficulty_level: typeof FITNESS_CONFIG.DIFFICULTY_LEVELS[number];
  duration_weeks: number;
  days_per_week: number;
  workout_days: WorkoutDay[];
  estimated_duration_per_session: number; // in minutes
  equipment_needed: string[];
  ai_generated: boolean;
  created_at: ISODateString;
  updated_at: ISODateString;
  is_active: boolean;
  total_exercises: number;
  target_muscle_groups: typeof FITNESS_CONFIG.BODY_PARTS[number][];
}

export interface WorkoutSession {
  id: UUID;
  workout_plan_id: UUID;
  user_id: UUID;
  workout_day_id: UUID;
  started_at: ISODateString;
  completed_at?: ISODateString;
  duration_minutes?: number;
  calories_burned?: number;
  rating?: number; // 1-5
  notes?: string;
  exercises_completed: ExerciseLogEntry[];
  is_completed: boolean;
}

export interface ExerciseLogEntry {
  id: UUID;
  exercise_id: UUID;
  workout_session_id: UUID;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number;
  duration_seconds?: number;
  calories_burned?: number;
  notes?: string;
  performance_rating?: number; // 1-5
  rest_time_seconds?: number;
  completed_at: ISODateString;
}

// AI Types
export interface AIWorkoutRequest {
  user_profile: UserProfile;
  fitness_goal: typeof FITNESS_CONFIG.FITNESS_GOALS[number];
  workout_preferences: {
    duration_minutes: number;
    equipment_available: string[];
    body_parts_focus: typeof FITNESS_CONFIG.BODY_PARTS[number][];
    difficulty_preference: typeof FITNESS_CONFIG.DIFFICULTY_LEVELS[number];
    workout_type: 'strength' | 'cardio' | 'mixed' | 'flexibility';
  };
  constraints?: {
    injuries?: string[];
    time_constraints?: string;
    space_limitations?: string;
  };
}

export interface AIWorkoutResponse {
  workout_plan: WorkoutPlan;
  explanation: string;
  confidence_score: number; // 0-1
  alternative_suggestions?: string[];
  estimated_calories: number;
  difficulty_justification: string;
}

// Meal Plan Types
export interface MealPlan {
  id: UUID;
  user_id: UUID;
  title: string;
  description?: string;
  target_calories: number;
  start_date: ISODateString;
  end_date: ISODateString;
  meals: DailyMealPlan[];
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface DailyMealPlan {
  id: UUID;
  date: ISODateString;
  meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snacks: Meal[];
  };
  total_calories: number;
  macros: MacroNutrients;
}

export interface Meal {
  id: UUID;
  name: string;
  description?: string;
  calories: number;
  macros: MacroNutrients;
  ingredients: Ingredient[];
  preparation_time_minutes: number;
  cooking_instructions?: string;
  image_url?: string;
  recipe_url?: string;
  serving_size: string;
}

export interface Ingredient {
  id: UUID;
  name: string;
  quantity: number;
  unit: string;
  calories_per_unit: number;
  macros_per_unit: MacroNutrients;
}

export interface MacroNutrients {
  protein: number; // in grams
  carbohydrates: number; // in grams
  fat: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
}

// Progress Types
export interface ProgressData {
  id: UUID;
  user_id: UUID;
  date: ISODateString;
  weight?: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  measurements: BodyMeasurements;
  photos?: ProgressPhoto[];
  notes?: string;
  mood_rating?: number; // 1-5
  energy_level?: number; // 1-5
}

export interface BodyMeasurements {
  chest?: number;
  waist?: number;
  hips?: number;
  bicep_left?: number;
  bicep_right?: number;
  thigh_left?: number;
  thigh_right?: number;
  neck?: number;
}

export interface ProgressPhoto {
  id: UUID;
  url: string;
  angle: 'front' | 'side' | 'back';
  uploaded_at: ISODateString;
}

// Notification Types
export interface NotificationPreferences {
  workout_reminders: boolean;
  meal_reminders: boolean;
  progress_updates: boolean;
  social_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours: {
    start: string; // HH:mm format
    end: string; // HH:mm format
  };
}

export interface ScheduledNotification {
  id: UUID;
  user_id: UUID;
  title: string;
  message: string;
  type: 'workout' | 'meal' | 'progress' | 'general';
  scheduled_for: ISODateString;
  is_sent: boolean;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // every X days/weeks/months
  days_of_week?: number[]; // 0-6 for weekly patterns
  end_date?: ISODateString;
}

// UI Component Types
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: any;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  [key: string]: any;
}

// Form Types
export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'file';
  value: T;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  validation?: ValidationRule[];
  options?: SelectOption[]; // for select/radio types
  min?: number;
  max?: number;
  step?: number;
}

export interface ValidationRule {
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: any) => boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  group?: string;
}

// API Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: ApiError;
  success: boolean;
  message?: string;
  metadata?: {
    pagination?: PaginationState;
    total_count?: number;
    execution_time?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: ISODateString;
  path?: string;
}

// Offline/Sync Types
export interface OfflineAction {
  id: UUID;
  type: 'create' | 'update' | 'delete';
  entity: 'workout' | 'exercise_log' | 'progress' | 'meal_plan';
  data: any;
  timestamp: ISODateString;
  synced: boolean;
  sync_attempts: number;
  last_sync_attempt?: ISODateString;
  sync_error?: string;
}

export interface SyncConflict {
  id: UUID;
  entity_type: string;
  entity_id: UUID;
  local_data: any;
  server_data: any;
  conflict_fields: string[];
  resolution?: 'local' | 'server' | 'merged';
  resolved_at?: ISODateString;
  resolved_by?: UUID;
}

// Service Worker Types
export interface ServiceWorkerMessage {
  type: 'SYNC_WORKOUTS' | 'CACHE_UPDATED' | 'OFFLINE_STATUS' | 'NOTIFICATION';
  payload?: any;
  timestamp: ISODateString;
}

// Social Features Types
export interface Friend {
  id: UUID;
  user_id: UUID;
  friend_user_id: UUID;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: ISODateString;
  friend_profile: UserProfile;
}

export interface Challenge {
  id: UUID;
  title: string;
  description: string;
  type: 'workout_count' | 'calories_burned' | 'duration' | 'custom';
  target_value: number;
  unit: string;
  start_date: ISODateString;
  end_date: ISODateString;
  participants: ChallengeParticipant[];
  created_by: UUID;
  is_public: boolean;
  prize_description?: string;
}

export interface ChallengeParticipant {
  id: UUID;
  challenge_id: UUID;
  user_id: UUID;
  current_progress: number;
  joined_at: ISODateString;
  completed_at?: ISODateString;
  rank?: number;
  user_profile: UserProfile;
}

// Theme Types
export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    muted: string;
    accent: string;
    destructive: string;
    border: string;
    input: string;
    ring: string;
  };
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type NonEmptyArray<T> = [T, ...T[]];

export type ValueOf<T> = T[keyof T];

export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

// Export commonly used type unions
export type FitnessGoal = typeof FITNESS_CONFIG.FITNESS_GOALS[number];
export type ActivityLevel = typeof FITNESS_CONFIG.ACTIVITY_LEVELS[number];
export type ExerciseCategory = typeof FITNESS_CONFIG.EXERCISE_CATEGORIES[number];
export type DifficultyLevel = typeof FITNESS_CONFIG.DIFFICULTY_LEVELS[number];
export type BodyPart = typeof FITNESS_CONFIG.BODY_PARTS[number];
