import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { logWorkoutWithExercisesRPC } from '@/integrations/supabase/functions';
import { LogWorkoutWithExercisesParams, ExerciseLogData } from '@/types/rpc';

// Storage key for offline workouts
const OFFLINE_WORKOUTS_KEY = 'offline_workouts';
const SYNC_CONFLICTS_KEY = 'sync_conflicts';

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
  timestamp: string;
  syncAttempts: number;
  syncError?: string;
}

// Interface for sync conflicts
interface SyncConflict {
  id: string;
  localWorkout: OfflineWorkout;
  serverWorkout: any;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
}

/**
 * Add a workout to the offline queue
 */
const addToOfflineQueue = (workout: OfflineWorkout): void => {
  try {
    // Get current queue
    const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    const queue: OfflineWorkout[] = queueString ? JSON.parse(queueString) : [];
    
    // Add to queue with timestamp
    const updatedWorkout = {
      ...workout,
      timestamp: workout.timestamp || new Date().toISOString(),
      syncAttempts: workout.syncAttempts || 0
    };
    
    queue.push(updatedWorkout);
    
    // Save updated queue
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding workout to offline queue:', error);
  }
};

/**
 * Remove a workout from the offline queue
 */
const removeFromOfflineQueue = (workoutId: string): void => {
  try {
    // Get current queue
    const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    if (!queueString) return;
    
    const queue: OfflineWorkout[] = JSON.parse(queueString);
    
    // Remove from queue
    const updatedQueue = queue.filter(workout => workout.id !== workoutId);
    
    // Save updated queue
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(updatedQueue));
  } catch (error) {
    console.error('Error removing workout from offline queue:', error);
  }
};

/**
 * Add a sync conflict to storage
 */
const addSyncConflict = (conflict: SyncConflict): void => {
  try {
    // Get current conflicts
    const conflictsString = localStorage.getItem(SYNC_CONFLICTS_KEY);
    const conflicts: SyncConflict[] = conflictsString ? JSON.parse(conflictsString) : [];
    
    // Add conflict
    conflicts.push(conflict);
    
    // Save updated conflicts
    localStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(conflicts));
  } catch (error) {
    console.error('Error adding sync conflict:', error);
  }
};

/**
 * Sync all pending workouts from the offline queue
 */
const syncAllWorkouts = async (): Promise<number> => {
  try {
    // Get current queue
    const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    if (!queueString) return 0;
    
    const queue: OfflineWorkout[] = JSON.parse(queueString);
    const pendingWorkouts = queue.filter(workout => !workout.synced);
    
    if (pendingWorkouts.length === 0) return 0;
    
    let syncedCount = 0;
    const updatedQueue = [...queue];
    
    // Try to sync each pending workout
    for (const workout of pendingWorkouts) {
      try {
        const index = updatedQueue.findIndex(w => w.id === workout.id);
        
        // Skip if already synced or too many attempts (to prevent infinite loops)
        if (workout.synced || workout.syncAttempts > 5) continue;
        
        // Check for potential conflicts first
        let conflict = false;
        let serverWorkout = null;
        
        if (workout.workout_plan_id && workout.timestamp) {
          // Check if there's a server record for this workout in the same timeframe
          const startTime = new Date(workout.timestamp);
          startTime.setHours(startTime.getHours() - 1); // 1 hour before
          
          const endTime = new Date(workout.timestamp);
          endTime.setHours(endTime.getHours() + 1); // 1 hour after
          
          const { data: existingLogs } = await supabase
            .from('workout_logs')
            .select('*')
            .eq('user_id', workout.user_id)
            .eq('workout_id', workout.workout_plan_id)
            .gte('completed_at', startTime.toISOString())
            .lte('completed_at', endTime.toISOString())
            .limit(1);
            
          if (existingLogs && existingLogs.length > 0) {
            conflict = true;
            serverWorkout = existingLogs[0];
            
            // Add to conflicts for resolution
            addSyncConflict({
              id: uuidv4(),
              localWorkout: workout,
              serverWorkout,
              resolved: false
            });
            
            // Update workout in queue to mark conflict
            if (index !== -1) {
              updatedQueue[index] = {
                ...workout,
                syncAttempts: (workout.syncAttempts || 0) + 1,
                syncError: 'Conflict detected with server record'
              };
            }
            
            continue; // Skip this workout for now
          }
        }
        
        // No conflict, try to sync
        if (workout.user_id) {
          const params: LogWorkoutWithExercisesParams = {
            workout_id_param: workout.workout_plan_id,
            user_id_param: workout.user_id,
            duration_param: workout.duration || 0,
            calories_param: workout.calories_burned || 0,
            exercise_data_param: workout.exercises as ExerciseLogData[],
            is_ai_workout_param: true,
            ai_workout_plan_id_param: workout.workout_plan_id
          };
          
          const result = await logWorkoutWithExercisesRPC(params);
          
          if (result) {
            // Mark as synced in the queue
            if (index !== -1) {
              updatedQueue[index] = { ...workout, synced: true };
            }
            
            syncedCount++;
          } else {
            // Update sync attempts
            if (index !== -1) {
              updatedQueue[index] = {
                ...workout,
                syncAttempts: (workout.syncAttempts || 0) + 1,
                syncError: 'Failed to sync with server'
              };
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing workout ${workout.id}:`, error);
        
        // Update sync attempts
        const index = updatedQueue.findIndex(w => w.id === workout.id);
        if (index !== -1) {
          updatedQueue[index] = {
            ...workout,
            syncAttempts: (workout.syncAttempts || 0) + 1,
            syncError: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      }
    }
    
    // Save updated queue
    localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(updatedQueue));
    
    return syncedCount;
  } catch (error) {
    console.error('Error syncing all workouts:', error);
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
  pendingWorkouts: number;
  conflicts: SyncConflict[];
  logWorkout: (workout: WorkoutLog) => Promise<string | null>;
  syncWorkouts: () => Promise<number>;
  getOfflineWorkouts: () => OfflineWorkout[];
  resolveConflict: (id: string, resolution: 'local' | 'server' | 'merged') => Promise<boolean>;
  hasFailedSyncs: boolean;
}

/**
 * Hook for tracking workouts with offline support
 */
export const useWorkoutTracking = (): WorkoutTrackingHook => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingWorkouts, setPendingWorkouts] = useState(0);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [hasFailedSyncs, setHasFailedSyncs] = useState(false);

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
  
  // Check for pending workouts and conflicts on mount and when online status changes
  useEffect(() => {
    // Load pending workouts
    const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
    const queue: OfflineWorkout[] = queueString ? JSON.parse(queueString) : [];
    const pending = queue.filter(workout => !workout.synced).length;
    setPendingWorkouts(pending);
    
    // Check for failed syncs
    const hasFailures = queue.some(workout => !workout.synced && (workout.syncAttempts || 0) > 0);
    setHasFailedSyncs(hasFailures);
    
    // Load conflicts
    const conflictsString = localStorage.getItem(SYNC_CONFLICTS_KEY);
    const loadedConflicts: SyncConflict[] = conflictsString ? JSON.parse(conflictsString) : [];
    const unresolvedConflicts = loadedConflicts.filter(conflict => !conflict.resolved);
    setConflicts(unresolvedConflicts);
    
    // Auto-sync when coming back online
    if (isOnline && pending > 0) {
      syncWorkouts().then(count => {
        if (count > 0) {
          // Update counts after sync
          const newQueueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
          const newQueue: OfflineWorkout[] = newQueueString ? JSON.parse(newQueueString) : [];
          const newPending = newQueue.filter(workout => !workout.synced).length;
          setPendingWorkouts(newPending);
          
          // Check for new failures
          const newHasFailures = newQueue.some(workout => !workout.synced && (workout.syncAttempts || 0) > 0);
          setHasFailedSyncs(newHasFailures);
        }
      });
    }
  }, [isOnline]);

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
              synced: true,
              timestamp: new Date().toISOString(),
              syncAttempts: 0
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
            synced: false,
            timestamp: new Date().toISOString(),
            syncAttempts: 0
          });
          
          toast.info('Saved workout locally due to error. Will sync when possible.');
          setPendingWorkouts(prev => prev + 1);
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
          synced: false,
          timestamp: new Date().toISOString(),
          syncAttempts: 0
        });
        
        toast.success('Workout saved locally. Will sync when online.');
        setPendingWorkouts(prev => prev + 1);
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
      
      // Update pending count
      const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
      const queue: OfflineWorkout[] = queueString ? JSON.parse(queueString) : [];
      const pending = queue.filter(workout => !workout.synced).length;
      setPendingWorkouts(pending);
      
      // Check for new conflicts
      const conflictsString = localStorage.getItem(SYNC_CONFLICTS_KEY);
      const loadedConflicts: SyncConflict[] = conflictsString ? JSON.parse(conflictsString) : [];
      const unresolvedConflicts = loadedConflicts.filter(conflict => !conflict.resolved);
      setConflicts(unresolvedConflicts);
      
      // Check for failed syncs
      const hasFailures = queue.some(workout => !workout.synced && (workout.syncAttempts || 0) > 0);
      setHasFailedSyncs(hasFailures);
      
      return syncedCount;
    } catch (error) {
      console.error('Error syncing workouts:', error);
      toast.error('Failed to sync workouts');
      return 0;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get all offline workouts (for display in UI)
   */
  const getOfflineWorkouts = (): OfflineWorkout[] => {
    try {
      const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
      return queueString ? JSON.parse(queueString) : [];
    } catch (error) {
      console.error('Error getting offline workouts:', error);
      return [];
    }
  };
  
  /**
   * Resolve a sync conflict
   */
  const resolveConflict = async (
    id: string, 
    resolution: 'local' | 'server' | 'merged'
  ): Promise<boolean> => {
    try {
      // Get conflicts
      const conflictsString = localStorage.getItem(SYNC_CONFLICTS_KEY);
      const allConflicts: SyncConflict[] = conflictsString ? JSON.parse(conflictsString) : [];
      
      // Find conflict
      const conflictIndex = allConflicts.findIndex(c => c.id === id);
      if (conflictIndex === -1) return false;
      
      const conflict = allConflicts[conflictIndex];
      
      // Mark as resolved
      allConflicts[conflictIndex] = {
        ...conflict,
        resolved: true,
        resolution
      };
      
      // Save updated conflicts
      localStorage.setItem(SYNC_CONFLICTS_KEY, JSON.stringify(allConflicts));
      
      // Handle resolution
      if (resolution === 'local') {
        // Use local copy - try to save again
        const { user_id, workout_plan_id, duration, calories_burned, notes, exercises, title } = conflict.localWorkout;
        
        if (user_id) {
          const params: LogWorkoutWithExercisesParams = {
            workout_id_param: workout_plan_id,
            user_id_param: user_id,
            duration_param: duration || 0,
            calories_param: calories_burned || 0,
            exercise_data_param: exercises as ExerciseLogData[],
            is_ai_workout_param: true,
            ai_workout_plan_id_param: workout_plan_id
          };
          
          await logWorkoutWithExercisesRPC(params);
          
          // Remove from offline queue or mark as synced
          const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
          if (queueString) {
            const queue: OfflineWorkout[] = JSON.parse(queueString);
            const index = queue.findIndex(w => w.id === conflict.localWorkout.id);
            
            if (index !== -1) {
              queue[index].synced = true;
              localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(queue));
            }
          }
        }
      } else if (resolution === 'merged') {
        // Merge the two records - take newest timestamp but local exercises
        const serverId = conflict.serverWorkout.id;
        const { exercises } = conflict.localWorkout;
        
        // Update server record with merged data
        await supabase
          .from('workout_logs')
          .update({
            notes: `${conflict.serverWorkout.notes || ''} (Merged with local data)`
          })
          .eq('id', serverId);
          
        // Add exercise logs from local workout
        for (const exercise of exercises) {
          await supabase
            .from('exercise_logs')
            .insert({
              workout_log_id: serverId,
              exercise_id: exercise.exercise_id,
              sets_completed: exercise.sets_completed,
              reps_completed: exercise.reps_completed,
              weight_used: exercise.weight_used,
              notes: exercise.notes,
              completed_at: new Date().toISOString()
            });
        }
        
        // Remove from offline queue
        const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
        if (queueString) {
          const queue: OfflineWorkout[] = JSON.parse(queueString);
          const filtered = queue.filter(w => w.id !== conflict.localWorkout.id);
          localStorage.setItem(OFFLINE_WORKOUTS_KEY, JSON.stringify(filtered));
        }
      }
      // If resolution is 'server', we just keep the server version and discard local
      
      // Update UI state
      const unresolvedConflicts = allConflicts.filter(conflict => !conflict.resolved);
      setConflicts(unresolvedConflicts);
      
      // Update pending count
      const queueString = localStorage.getItem(OFFLINE_WORKOUTS_KEY);
      const queue: OfflineWorkout[] = queueString ? JSON.parse(queueString) : [];
      const pending = queue.filter(workout => !workout.synced).length;
      setPendingWorkouts(pending);
      
      return true;
    } catch (error) {
      console.error('Error resolving conflict:', error);
      return false;
    }
  };

  return {
    isLoading,
    isOnline,
    isSubmitting,
    pendingWorkouts,
    conflicts,
    logWorkout,
    syncWorkouts,
    getOfflineWorkouts,
    resolveConflict,
    hasFailedSyncs
  };
}; 