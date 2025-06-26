/**
 * Application Constants
 * Centralized constants to avoid magic numbers and strings throughout the app
 */

// App Configuration
export const APP_CONFIG = {
  NAME: 'CorePilot',
  VERSION: '1.0.0',
  DEMO_MODE_URL: 'https://demo.supabase.co',
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// Service Worker
export const SW_CONFIG = {
  CACHE_NAME: 'corepilot-v1',
  DASHBOARD_CACHE: 'dashboard-cache-v1',
  SYNC_TAG: 'sync-workouts',
  MAX_SYNC_ATTEMPTS: 3,
  SYNC_RETRY_DELAY: 5000, // 5 seconds
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  OFFLINE_WORKOUTS: 'offline_workouts',
  SYNC_CONFLICTS: 'sync_conflicts',
  USER_PREFERENCES: 'user_preferences',
  ONBOARDING_STATUS: 'onboarding_completed',
  DEMO_DATA: 'demo_data',
  DASHBOARD_ERROR: 'dashboard_load_error',
} as const;

// API Endpoints and Limits
export const API_CONFIG = {
  MAX_RETRIES: 3,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  BATCH_SIZE: 50,
  RATE_LIMIT_DELAY: 1000, // 1 second
} as const;

// UI Constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH: '16rem',
  SIDEBAR_WIDTH_MOBILE: '18rem',
  SIDEBAR_WIDTH_ICON: '3rem',
  ANIMATION_DURATION: 200,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 4000,
} as const;

// Workout Constants
export const WORKOUT_CONFIG = {
  DEFAULT_WORKOUT_DURATION: 45, // minutes
  MAX_EXERCISES_PER_WORKOUT: 20,
  MIN_REST_TIME: 30, // seconds
  MAX_REST_TIME: 300, // seconds
  DEFAULT_SETS: 3,
  DEFAULT_REPS: 12,
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 1000, // kg
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  PHONE: /^[+]?[(]?[\d\s\-\(\)]{10,}$/,
} as const;

// Date/Time Constants
export const TIME_CONFIG = {
  MILLISECONDS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
  WEEKS_PER_MONTH: 4,
  MONTHS_PER_YEAR: 12,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection failed. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_DATA: 'The provided data is invalid. Please check your input.',
  SERVER_ERROR: 'A server error occurred. Please try again later.',
  WORKOUT_SAVE_FAILED: 'Failed to save workout. It has been saved offline and will sync when connection is restored.',
  AI_GENERATION_FAILED: 'AI workout generation failed. Using alternative method.',
  VALIDATION: {
    REQUIRED_FIELD: (field: string) => `${field} is required.`,
    INVALID_EMAIL: 'Please enter a valid email address.',
    PASSWORD_TOO_SHORT: `Password must be at least ${APP_CONFIG.MIN_PASSWORD_LENGTH} characters long.`,
    INVALID_UUID: 'Invalid ID format.',
  },
  API: {
    WORKOUT_GENERATION_FAILED: 'Failed to generate workout plan. Please try again.',
    DATABASE_ERROR: 'Database operation failed. Please try again.',
    SYNC_FAILED: 'Failed to sync data. Will retry automatically.',
  },
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  WORKOUT_SAVED: 'Workout saved successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EMAIL_VERIFIED: 'Email verified successfully!',
  SYNC_COMPLETED: 'Data synchronized successfully!',
  WORKOUT: {
    GENERATED_AI: 'AI workout plan generated successfully!',
    GENERATED_RULE_BASED: 'Personalized workout plan generated successfully!',
    EXERCISE_COMPLETED: 'Exercise completed successfully!',
    SET_COMPLETED: 'Set completed!',
  },
} as const;

// Fitness Constants
export const FITNESS_CONFIG = {
  ACTIVITY_LEVELS: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'] as const,
  FITNESS_GOALS: ['lose_weight', 'gain_muscle', 'improve_endurance', 'maintain_fitness', 'general_health'] as const,
  EXERCISE_CATEGORIES: ['strength', 'cardio', 'flexibility', 'balance', 'sports'] as const,
  DIFFICULTY_LEVELS: ['beginner', 'intermediate', 'advanced'] as const,
  BODY_PARTS: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'glutes', 'cardio'] as const,
} as const;

// Route Paths
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  WORKOUTS: '/workouts',
  AI_WORKOUTS: '/ai-workouts',
  AI_WORKOUT_GENERATION: '/ai-workouts/generate',
  CREATE_AI_WORKOUT: '/create-ai-workout',
  WORKOUT_SESSION: '/workout-session',
  MEAL_PLAN: '/meal-plan',
  PROGRESS: '/progress',
  PROFILE: '/profile',
  REMINDERS: '/reminders',
  FRIENDS: '/friends',
  CHALLENGES: '/challenges',
  ONBOARDING: '/onboarding',
  NOT_FOUND: '/404',
} as const;

// Theme Constants
export const THEME_CONFIG = {
  DEFAULT_THEME: 'light',
  THEMES: ['light', 'dark', 'system'] as const,
  PRIMARY_COLORS: {
    fitness: {
      primary: 'hsl(220, 70%, 50%)',
      secondary: 'hsl(260, 70%, 50%)',
    }
  },
} as const;

// Environment Check
export const ENV_CONFIG = {
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  isDemo: !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === APP_CONFIG.DEMO_MODE_URL,
} as const;
