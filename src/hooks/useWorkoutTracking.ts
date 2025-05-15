import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { logWorkoutWithExercisesRPC } from '@/integrations/supabase/functions';
import { LogWorkoutWithExercisesParams, ExerciseLogData } from '@/types/rpc';

// Storage key for offline workouts
const OFFLINE_WORKOUTS_KEY = 'offline_workouts';

// Interface for workout data to be saved offline
interface OfflineWorkout {
  id: string;
  workout_plan_id: string;
  user_id?: string;
  duration: number;
  calories_burned: number;
  notes?: string;
  rating?: number;
  exercises: Array<{
    exercise_id: string;
    sets_completed: number;
    reps_completed: number;
    weight_used: number | null;
    notes?: string;
  }>;
  title: string;
  description: string;
  synced: boolean;
}

// Add offline workout to the queue
const addToOfflineQueue = (workout: OfflineWorkout) => {
  try {
    // Get existing offline workouts
    const existingWorkoutsJson = localStorage.getItem(OFFLINE_WORKOUTS_KEY) || '[]';
    const existingWorkouts = JSON.parse(existingWorkoutsJson) as OfflineWorkout[];
    
    // Add new workout
    existingWorkouts.push(workout);
    
    // Save back to local storage
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));
    console.log('Saved workout to offline queue:', workout);
  } catch (error) {
    console.error('Failed to save workout offline:', error);
  }
};

// Function to sync all workouts from local storage
const syncAllWorkouts = async (): Promise<number> => {
  try {
    // Get existing offline workouts
    const existingWorkoutsJson = localStorage.getItem(OFFLINE_WORKOUTS_KEY) || '[]';
    const existingWorkouts = JSON.parse(existingWorkoutsJson) as OfflineWorkout[];
    
    // Filter unsynced workouts
    const unsyncedWorkouts = existingWorkouts.filter(w => !w.synced);
    if (unsyncedWorkouts.length === 0) return 0;
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user found for syncing');
      return 0;
    }
    
    let syncedCount = 0;
    
    // Process each unsynced workout
    for (const workout of unsyncedWorkouts) {
      try {
        // Use the helper function to avoid type errors
        const params: LogWorkoutWithExercisesParams = {
          workout_id_param: workout.workout_plan_id,
          user_id_param: user.id,
          duration_param: workout.duration || 0,
          calories_param: workout.calories_burned || 0,
          exercise_data_param: workout.exercises as ExerciseLogData[],
          is_ai_workout_param: true,
          ai_workout_plan_id_param: workout.workout_plan_id
        };
        
        const result = await logWorkoutWithExercisesRPC(params);
        
        if (result) {
          console.log('Offline workout synced successfully:', result);
          
          // Update any additional fields
          const { error: updateError } = await supabase
            .from('workout_logs')
            .update({
              workout_name: workout.title || 'Offline Workout',
              workout_description: workout.description || 'Synced from offline storage',
              notes: workout.notes || null,
              workout_type: 'completed'
            })
            .eq('id', result);
            
          if (updateError) {
            console.warn('Warning: Could not update additional workout log fields:', updateError);
          }
        }
        
        // Mark as synced
        workout.synced = true;
        syncedCount++;
      } catch (error) {
        console.error(`Error syncing workout ${workout.id}:`, error);
      }
    }
    
    // Save updated state back to local storage
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));
    
    return syncedCount;
  } catch (error) {
    console.error('Error syncing workouts:', error);
    return 0;
  }
};

interface ExerciseLog {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number | null;
  notes?: string;
}

interface WorkoutLog {
  workout_plan_id: string;
  duration: number;
  calories_burned: number;
  notes?: string;
  rating?: number;
  exercises: ExerciseLog[];
  title: string;
  description: string;
}

interface WorkoutTrackingHook {
  isLoading: boolean;
  isOnline: boolean;
  isSubmitting: boolean;
  logWorkout: (workout: WorkoutLog) => Promise<string | null>;
  syncWorkouts: () => Promise<number>;
}

/**
 * Hook for tracking workouts with offline support
 */
export const useWorkoutTracking = (): WorkoutTrackingHook => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Log a completed workout, handling both online and offline scenarios
   */
  const logWorkout = async (workout: WorkoutLog): Promise<string | null> => {
    if (!user) {
      toast.error('You must be logged in to log a workout');
      return null;
    }

    setIsSubmitting(true);
    
    try {
      // If online, try to log directly to the server
      if (isOnline) {
        console.log('Logging workout online:', workout);
        
        try {
          // Use the helper function to avoid type errors
          const params: LogWorkoutWithExercisesParams = {
            workout_id_param: workout.workout_plan_id,
            user_id_param: user.id,
            duration_param: workout.duration || 0,
            calories_param: workout.calories_burned || 0,
            exercise_data_param: workout.exercises as ExerciseLogData[],
            is_ai_workout_param: true,
            ai_workout_plan_id_param: workout.workout_plan_id
          };
          
          const result = await logWorkoutWithExercisesRPC(params);
          
          if (result) {
            console.log('Workout logged successfully via RPC:', result);
            
            // Update any additional fields
            const { error: updateError } = await supabase
              .from('workout_logs')
              .update({
                workout_name: workout.title || 'Completed Workout',
                workout_description: workout.description || 'Completed workout session',
                notes: workout.notes || null,
                workout_type: 'completed'
              })
              .eq('id', result);
              
            if (updateError) {
              console.warn('Warning: Could not update additional workout log fields:', updateError);
            }
            
            // Sync with local storage for offline mode
            addToOfflineQueue({
              id: result,
              ...workout,
              user_id: user.id,
              synced: true
            });
            
            return result;
          }
          
          return null;
        } catch (error) {
          console.error('Error logging workout:', error);
          
          // Fall back to offline storage if online attempt fails
          const offlineId = 'offline-' + new Date().getTime();
          
          // Add to offline queue
          addToOfflineQueue({
            id: offlineId,
            ...workout,
            user_id: user?.id,
            synced: false
          });
          
          toast.info('Saved workout locally due to error. Will sync when possible.');
          return offlineId;
        }
      } else {
        // Offline mode - save to queue for later sync
        console.log('Logging workout offline (will sync later):', workout);
        const offlineId = 'offline-' + new Date().getTime();
        
        // Add to offline queue
        addToOfflineQueue({
          id: offlineId,
          ...workout,
          user_id: user?.id,
          synced: false
        });
        
        toast.success('Workout saved locally. Will sync when online.');
        return offlineId;
      }
    } catch (error) {
      console.error('Error logging workout:', error);
      toast.error('Failed to log workout. Please try again.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Manually trigger a sync of all offline workouts
   */
  const syncWorkouts = async (): Promise<number> => {
    if (!isOnline) {
      toast.error('You need to be online to sync workouts');
      return 0;
    }
    
    setIsLoading(true);
    try {
      const syncedCount = await syncAllWorkouts();
      
      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline workout${syncedCount === 1 ? '' : 's'}`);
      } else {
        toast.info('No offline workouts to sync');
      }
      
      return syncedCount;
    } catch (error) {
      console.error('Error syncing workouts:', error);
      toast.error('Failed to sync workouts');
      return 0;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isOnline,
    isSubmitting,
    logWorkout,
    syncWorkouts
  };
}; 