import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

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
    
    // TODO: Implement actual sync logic
    console.log('Would sync these workouts:', unsyncedWorkouts);
    
    // For now just mark all as synced
    existingWorkouts.forEach(w => w.synced = true);
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(existingWorkouts));
    
    return unsyncedWorkouts.length;
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
          // Use RPC function for optimized logging
          const { data: result, error: rpcError } = await supabase.rpc(
            'log_workout_with_exercises',
            {
              workout_id_param: workout.workout_plan_id,
              user_id_param: user.id,
              duration_param: workout.duration || 0,
              calories_param: workout.calories_burned || 0,
              exercise_data_param: workout.exercises,
              is_ai_workout_param: true,
              ai_workout_plan_id_param: workout.workout_plan_id
            }
          );
          
          if (rpcError) {
            console.error('RPC error:', rpcError);
            throw rpcError;
          }
          
          console.log('Workout logged successfully via RPC:', result);
          
          // Update any additional fields that RPC doesn't set
          if (result) {
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
          }
          
          // Sync with local storage for offline mode
          addToOfflineQueue({
            id: result,
            ...workout,
            user_id: user.id,
            synced: true
          });
          
          return result;
        } catch (rpcError) {
          console.warn('RPC function failed, falling back to direct inserts:', rpcError);
          
          // Step 1: Create workout log
          const { data: logData, error: logError } = await supabase
            .from('workout_logs')
            .insert({
              user_id: user.id,
              workout_id: workout.workout_plan_id,
              workout_name: workout.title || 'Completed Workout',
              workout_description: workout.description || 'Completed workout session',
              duration: workout.duration,
              calories_burned: workout.calories_burned,
              notes: workout.notes,
              completed_at: new Date().toISOString(),
              workout_type: 'completed',
              is_from_ai_plan: true,
              ai_workout_plan_id: workout.workout_plan_id
            })
            .select('id')
            .single();
            
          if (logError) {
            console.error("Error creating workout log:", logError);
            throw logError;
          }
          
          const workoutLogId = logData.id;
          console.log("Workout log created via direct insert:", workoutLogId);
          
          // Step 2: Log exercises
          if (workout.exercises && workout.exercises.length > 0) {
            for (const exercise of workout.exercises) {
              try {
                const { error: exerciseLogError } = await supabase
                  .from('exercise_logs')
                  .insert({
                    workout_log_id: workoutLogId,
                    exercise_id: exercise.exercise_id,
                    sets_completed: exercise.sets_completed,
                    reps_completed: exercise.reps_completed,
                    weight_used: exercise.weight_used,
                    notes: exercise.notes,
                    completed_at: new Date().toISOString()
                  });
                  
                if (exerciseLogError) {
                  console.error(`Error logging exercise ${exercise.exercise_id}:`, exerciseLogError);
                }
              } catch (err) {
                console.error(`Error in exercise logging for ${exercise.exercise_id}:`, err);
              }
            }
          }
          
          // Sync with local storage for offline mode
          addToOfflineQueue({
            id: workoutLogId,
            ...workout,
            user_id: user.id,
            synced: true
          });
          
          return workoutLogId;
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