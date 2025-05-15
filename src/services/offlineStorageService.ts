import { supabase } from '@/integrations/supabase/client';

// Define types for offline data
export interface OfflineWorkout {
  id: string;
  workoutPlanId: string;
  userId: string;
  completedAt: string;
  duration: number;
  caloriesBurned: number;
  exercises: OfflineExercise[];
  title: string;
  description: string;
  synced: boolean;
  syncAttempts: number;
}

export interface OfflineExercise {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number | null;
  notes?: string;
}

// Offline storage keys
const STORAGE_KEYS = {
  WORKOUTS: 'offline_workouts',
  SYNC_QUEUE: 'sync_queue',
};

/**
 * Save a workout to offline storage
 */
export const saveWorkoutOffline = (workout: Omit<OfflineWorkout, 'synced' | 'syncAttempts' | 'id'>): string => {
  try {
    const offlineWorkouts = getOfflineWorkouts();
    const id = generateLocalId();
    
    const newWorkout: OfflineWorkout = {
      ...workout,
      id,
      synced: false,
      syncAttempts: 0,
    };
    
    offlineWorkouts.push(newWorkout);
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(offlineWorkouts));
    
    // Add to sync queue
    addToSyncQueue(id);
    
    return id;
  } catch (error) {
    console.error('Error saving workout offline:', error);
    throw error;
  }
};

/**
 * Get all offline workouts
 */
export const getOfflineWorkouts = (): OfflineWorkout[] => {
  try {
    const workouts = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return workouts ? JSON.parse(workouts) : [];
  } catch (error) {
    console.error('Error getting offline workouts:', error);
    return [];
  }
};

/**
 * Get a specific offline workout by ID
 */
export const getOfflineWorkout = (id: string): OfflineWorkout | null => {
  try {
    const workouts = getOfflineWorkouts();
    return workouts.find(workout => workout.id === id) || null;
  } catch (error) {
    console.error('Error getting offline workout:', error);
    return null;
  }
};

/**
 * Generate a local ID for offline items
 */
const generateLocalId = (): string => {
  return 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

/**
 * Add an item to the sync queue
 */
const addToSyncQueue = (id: string): void => {
  try {
    const queue = getSyncQueue();
    if (!queue.includes(id)) {
      queue.push(id);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
};

/**
 * Get the current sync queue
 */
const getSyncQueue = (): string[] => {
  try {
    const queue = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Error getting sync queue:', error);
    return [];
  }
};

/**
 * Remove an item from the sync queue
 */
const removeFromSyncQueue = (id: string): void => {
  try {
    const queue = getSyncQueue();
    const index = queue.indexOf(id);
    if (index !== -1) {
      queue.splice(index, 1);
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    }
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
};

/**
 * Mark a workout as synced
 */
export const markWorkoutSynced = (id: string): void => {
  try {
    const workouts = getOfflineWorkouts();
    const workoutIndex = workouts.findIndex(workout => workout.id === id);
    
    if (workoutIndex !== -1) {
      workouts[workoutIndex].synced = true;
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
      removeFromSyncQueue(id);
    }
  } catch (error) {
    console.error('Error marking workout as synced:', error);
  }
};

/**
 * Update sync attempt count for a workout
 */
const incrementSyncAttempt = (id: string): void => {
  try {
    const workouts = getOfflineWorkouts();
    const workoutIndex = workouts.findIndex(workout => workout.id === id);
    
    if (workoutIndex !== -1) {
      workouts[workoutIndex].syncAttempts += 1;
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    }
  } catch (error) {
    console.error('Error updating sync attempts:', error);
  }
};

/**
 * Sync a single workout to the server
 */
export const syncWorkout = async (id: string): Promise<boolean> => {
  try {
    const workout = getOfflineWorkout(id);
    if (!workout || workout.synced) return false;
    
    // Increment sync attempt
    incrementSyncAttempt(id);
    
    // Step 1: Create workout log
    const { data: logData, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: workout.userId,
        workout_id: workout.workoutPlanId,
        workout_name: workout.title,
        workout_description: workout.description,
        duration: workout.duration,
        calories_burned: workout.caloriesBurned,
        is_from_ai_plan: true,
        ai_workout_plan_id: workout.workoutPlanId,
        workout_type: 'completed',
        completed_at: workout.completedAt
      })
      .select('id')
      .single();
    
    if (logError) {
      console.error('Error syncing workout log:', logError);
      return false;
    }
    
    // Step 2: Log exercises
    const workoutLogId = logData.id;
    
    for (const exercise of workout.exercises) {
      const { error: exerciseError } = await supabase
        .from('exercise_logs')
        .insert({
          workout_log_id: workoutLogId,
          exercise_id: exercise.exercise_id,
          sets_completed: exercise.sets_completed,
          reps_completed: exercise.reps_completed,
          weight_used: exercise.weight_used,
          notes: exercise.notes,
          workout_plan_id: workout.workoutPlanId
        });
      
      if (exerciseError) {
        console.error('Error syncing exercise log:', exerciseError);
        // Continue with other exercises even if one fails
      }
    }
    
    // Mark as synced
    markWorkoutSynced(id);
    return true;
  } catch (error) {
    console.error('Error syncing workout:', error);
    return false;
  }
};

/**
 * Sync all unsynced workouts
 */
export const syncAllWorkouts = async (): Promise<number> => {
  try {
    // Only run this if online
    if (!navigator.onLine) return 0;
    
    const queue = getSyncQueue();
    if (queue.length === 0) return 0;
    
    let syncedCount = 0;
    
    for (const id of queue) {
      const success = await syncWorkout(id);
      if (success) syncedCount++;
    }
    
    return syncedCount;
  } catch (error) {
    console.error('Error syncing all workouts:', error);
    return 0;
  }
};

/**
 * Clean up old synced workouts (older than 30 days)
 */
export const cleanupOldWorkouts = (): number => {
  try {
    const workouts = getOfflineWorkouts();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filtered = workouts.filter(workout => {
      // Keep unsynced workouts
      if (!workout.synced) return true;
      
      // Remove old synced workouts
      const completedDate = new Date(workout.completedAt);
      return completedDate > thirtyDaysAgo;
    });
    
    const removedCount = workouts.length - filtered.length;
    
    if (removedCount > 0) {
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(filtered));
    }
    
    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old workouts:', error);
    return 0;
  }
}; 