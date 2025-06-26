import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLoadingState, useAsyncOperation } from '@/hooks/common';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { logWorkoutWithExercisesRPC } from '@/integrations/supabase/functions';
import { LogWorkoutWithExercisesParams, ExerciseLogData } from '@/types/rpc';
import { 
  STORAGE_KEYS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  API_CONFIG 
} from '@/lib/constants';
import { 
  handleApiError, 
  formatDate, 
  debounce
} from '@/lib/utils-extended';
import { ApiResponse } from '@/types';

// Use centralized storage keys
const OFFLINE_WORKOUTS_KEY = STORAGE_KEYS.OFFLINE_WORKOUTS;
const SYNC_CONFLICTS_KEY = STORAGE_KEYS.SYNC_CONFLICTS;

// Safe JSON operations with error handling
const safeJsonParse = <T>(jsonString: string | null, fallback: T): T => {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
};

const safeJsonStringify = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Error stringifying JSON:', error);
    return null;
  }
};

// Enhanced localStorage operations with error handling
const getFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return safeJsonParse(stored, fallback);
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return fallback;
  }
};

const setToStorage = (key: string, data: any): boolean => {
  try {
    const jsonString = safeJsonStringify(data);
    if (jsonString === null) return false;
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
    return false;
  }
};

// Enhanced interface definitions with better typing
interface OfflineWorkoutExercise {
  exercise_id: string;
  sets_completed: number;
  reps_completed: number;
  weight_used: number | null;
  notes?: string;
}

interface OfflineWorkout {
  id: string;
  workout_plan_id: string;
  user_id?: string;
  duration: number;
  calories_burned: number;
  notes?: string;
  rating?: number;
  exercises: OfflineWorkoutExercise[];
  title: string;
  description: string;
  synced: boolean;
  timestamp: string;
  syncAttempts: number;
  syncError?: string;
  lastSyncAttempt?: string;
}

interface SyncConflict {
  id: string;
  localWorkout: OfflineWorkout;
  serverWorkout: any;
  resolved: boolean;
  resolution?: 'local' | 'server' | 'merged';
  timestamp: string;
}

interface WorkoutSyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflicts: SyncConflict[];
  errors: string[];
}

/**
 * Add a workout to the offline queue with enhanced error handling
 */
const addToOfflineQueue = (workout: OfflineWorkout): ApiResponse<boolean> => {
  try {
    // Get current queue
    const queue = getFromStorage<OfflineWorkout[]>(OFFLINE_WORKOUTS_KEY, []);
    
    // Add to queue with timestamp and reset sync attempts
    const updatedWorkout: OfflineWorkout = {
      ...workout,
      timestamp: workout.timestamp || new Date().toISOString(),
      syncAttempts: 0,
      syncError: undefined,
      lastSyncAttempt: undefined
    };
    
    queue.push(updatedWorkout);
    
    // Save updated queue
    const success = setToStorage(OFFLINE_WORKOUTS_KEY, queue);
    
    if (success) {
      return {
        success: true,
        data: true,
        message: 'Workout added to offline queue successfully'
      };
    } else {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: ERROR_MESSAGES.WORKOUT_SAVE_FAILED,
          timestamp: new Date().toISOString()
        },
        data: false
      };
    }
  } catch (error) {
    console.error('Error adding workout to offline queue:', error);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: handleApiError(error) || ERROR_MESSAGES.SERVER_ERROR,
        details: error,
        timestamp: new Date().toISOString()
      },
      data: false
    };
  }
};

/**
 * Remove a workout from the offline queue with enhanced error handling
 */
const removeFromOfflineQueue = (workoutId: string): ApiResponse<boolean> => {
  try {
    if (!workoutId) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD('Workout ID'),
          timestamp: new Date().toISOString()
        },
        data: false
      };
    }

    // Get current queue
    const queue = getFromStorage<OfflineWorkout[]>(OFFLINE_WORKOUTS_KEY, []);
    
    // Remove from queue
    const updatedQueue = queue.filter(workout => workout.id !== workoutId);
    
    // Check if anything was actually removed
    const wasRemoved = queue.length !== updatedQueue.length;
    
    // Save updated queue
    const success = setToStorage(OFFLINE_WORKOUTS_KEY, updatedQueue);
    
    if (success) {
      return {
        success: true,
        data: wasRemoved,
        message: wasRemoved ? 'Workout removed from offline queue' : 'Workout not found in queue'
      };
    } else {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to update offline queue',
          timestamp: new Date().toISOString()
        },
        data: false
      };
    }
  } catch (error) {
    console.error('Error removing workout from offline queue:', error);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: handleApiError(error) || ERROR_MESSAGES.SERVER_ERROR,
        details: error,
        timestamp: new Date().toISOString()
      },
      data: false
    };
  }
};

/**
 * Add a sync conflict to storage with enhanced error handling
 */
const addSyncConflict = (conflictData: Omit<SyncConflict, 'timestamp'>): ApiResponse<boolean> => {
  try {
    // Get current conflicts
    const conflicts = getFromStorage<SyncConflict[]>(SYNC_CONFLICTS_KEY, []);
    
    // Add conflict with timestamp
    const conflict: SyncConflict = {
      ...conflictData,
      timestamp: new Date().toISOString()
    };
    
    conflicts.push(conflict);
    
    // Save updated conflicts
    const success = setToStorage(SYNC_CONFLICTS_KEY, conflicts);
    
    if (success) {
      return {
        success: true,
        data: true,
        message: 'Sync conflict recorded successfully'
      };
    } else {
      return {
        success: false,
        error: {
          code: 'STORAGE_ERROR',
          message: 'Failed to save sync conflict',
          timestamp: new Date().toISOString()
        },
        data: false
      };
    }
  } catch (error) {
    console.error('Error adding sync conflict:', error);
    return {
      success: false,
      error: {
        code: 'UNEXPECTED_ERROR',
        message: handleApiError(error) || ERROR_MESSAGES.SERVER_ERROR,
        details: error,
        timestamp: new Date().toISOString()
      },
      data: false
    };
  }
};

/**
 * Sync all pending workouts from the offline queue with enhanced error handling
 */
const syncAllWorkouts = async (): Promise<WorkoutSyncResult> => {
  const result: WorkoutSyncResult = {
    success: false,
    syncedCount: 0,
    failedCount: 0,
    conflicts: [],
    errors: []
  };

  try {
    // Get current queue with safe parsing
    const queue = getFromStorage<OfflineWorkout[]>(OFFLINE_WORKOUTS_KEY, []);
    const pendingWorkouts = queue.filter(workout => !workout.synced);
    
    if (pendingWorkouts.length === 0) {
      result.success = true;
      return result;
    }

    const updatedQueue = [...queue];
    const maxSyncAttempts = API_CONFIG.MAX_RETRIES;
    
    // Process workouts in batches to avoid overwhelming the server
    const batchSize = API_CONFIG.BATCH_SIZE || 10;
    
    for (let i = 0; i < pendingWorkouts.length; i += batchSize) {
      const batch = pendingWorkouts.slice(i, i + batchSize);
      
      // Process batch with Promise.allSettled for better error handling
      const batchResults = await Promise.allSettled(
        batch.map(workout => syncSingleWorkout(workout, maxSyncAttempts))
      );
      
      // Process results
      batchResults.forEach((batchResult, batchIndex) => {
        const workout = batch[batchIndex];
        const queueIndex = updatedQueue.findIndex(w => w.id === workout.id);
        
        if (batchResult.status === 'fulfilled') {
          const syncResult = batchResult.value;
          
          if (syncResult.success) {
            result.syncedCount++;
            if (queueIndex !== -1) {
              updatedQueue[queueIndex] = { 
                ...workout, 
                synced: true,
                syncError: undefined,
                lastSyncAttempt: new Date().toISOString()
              };
            }
          } else if (syncResult.hasConflict && syncResult.conflict) {
            result.conflicts.push(syncResult.conflict);
            if (queueIndex !== -1) {
              updatedQueue[queueIndex] = {
                ...workout,
                syncAttempts: (workout.syncAttempts || 0) + 1,
                syncError: 'Conflict detected with server record',
                lastSyncAttempt: new Date().toISOString()
              };
            }
          } else {
            result.failedCount++;
            result.errors.push(syncResult.error || 'Unknown sync error');
            if (queueIndex !== -1) {
              updatedQueue[queueIndex] = {
                ...workout,
                syncAttempts: (workout.syncAttempts || 0) + 1,
                syncError: syncResult.error,
                lastSyncAttempt: new Date().toISOString()
              };
            }
          }
        } else {
          result.failedCount++;
          const errorMessage = batchResult.reason?.message || 'Sync operation failed';
          result.errors.push(errorMessage);
          
          if (queueIndex !== -1) {
            updatedQueue[queueIndex] = {
              ...workout,
              syncAttempts: (workout.syncAttempts || 0) + 1,
              syncError: errorMessage,
              lastSyncAttempt: new Date().toISOString()
            };
          }
        }
      });
      
      // Add delay between batches to prevent rate limiting
      if (i + batchSize < pendingWorkouts.length) {
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.RATE_LIMIT_DELAY || 1000));
      }
    }
    
    // Save updated queue
    const saveSuccess = setToStorage(OFFLINE_WORKOUTS_KEY, updatedQueue);
    if (!saveSuccess) {
      result.errors.push('Failed to update offline queue after sync');
    }
    
    result.success = result.syncedCount > 0 || result.failedCount === 0;
    return result;
    
  } catch (error) {
    console.error('Error in syncAllWorkouts:', error);
    result.errors.push(handleApiError(error) || ERROR_MESSAGES.SERVER_ERROR);
    return result;
  }
};

/**
 * Sync a single workout with conflict detection
 */
interface SingleWorkoutSyncResult {
  success: boolean;
  hasConflict: boolean;
  conflict?: SyncConflict;
  error?: string;
}

const syncSingleWorkout = async (
  workout: OfflineWorkout, 
  maxSyncAttempts: number
): Promise<SingleWorkoutSyncResult> => {
  // Skip if already synced or too many attempts
  if (workout.synced || (workout.syncAttempts || 0) >= maxSyncAttempts) {
    return {
      success: false,
      hasConflict: false,
      error: 'Max sync attempts exceeded'
    };
  }

  try {
    // Check for potential conflicts first
    if (workout.workout_plan_id && workout.timestamp) {
      const conflictResult = await checkForSyncConflict(workout);
      if (conflictResult.hasConflict) {
        return conflictResult;
      }
    }

    // No conflict, attempt to sync
    if (!workout.user_id) {
      return {
        success: false,
        hasConflict: false,
        error: 'Missing user ID'
      };
    }

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
      return {
        success: true,
        hasConflict: false
      };
    } else {
      return {
        success: false,
        hasConflict: false,
        error: 'Failed to sync with server'
      };
    }

  } catch (error) {
    console.error(`Error syncing workout ${workout.id}:`, error);
    return {
      success: false,
      hasConflict: false,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
};

/**
 * Check for sync conflicts with server data
 */
const checkForSyncConflict = async (workout: OfflineWorkout): Promise<SingleWorkoutSyncResult> => {
  try {
    // Check if there's a server record for this workout in the same timeframe
    const workoutTime = new Date(workout.timestamp);
    const startTime = new Date(workoutTime.getTime() - 60 * 60 * 1000); // 1 hour before
    const endTime = new Date(workoutTime.getTime() + 60 * 60 * 1000); // 1 hour after

    const { data: existingLogs, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', workout.user_id)
      .eq('workout_id', workout.workout_plan_id)
      .gte('completed_at', startTime.toISOString())
      .lte('completed_at', endTime.toISOString())
      .limit(1);

    if (error) {
      throw error;
    }

    if (existingLogs && existingLogs.length > 0) {
      const serverWorkout = existingLogs[0];
      
      // Create conflict record
      const conflict: SyncConflict = {
        id: uuidv4(),
        localWorkout: workout,
        serverWorkout,
        resolved: false,
        timestamp: new Date().toISOString()
      };

      // Save conflict
      addSyncConflict({
        id: conflict.id,
        localWorkout: workout,
        serverWorkout,
        resolved: false
      });

      return {
        success: false,
        hasConflict: true,
        conflict
      };
    }

    return {
      success: true,
      hasConflict: false
    };

  } catch (error) {
    console.error('Error checking for sync conflict:', error);
    return {
      success: false,
      hasConflict: false,
      error: error instanceof Error ? error.message : 'Failed to check for conflicts'
    };
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
      const syncResult = await syncAllWorkouts();
      
      if (syncResult.syncedCount > 0) {
        toast.success(`Synced ${syncResult.syncedCount} offline workout${syncResult.syncedCount === 1 ? '' : 's'}`);
      } else if (syncResult.failedCount > 0) {
        toast.error(`Failed to sync ${syncResult.failedCount} workout${syncResult.failedCount === 1 ? '' : 's'}`);
      } else {
        toast.info('No offline workouts to sync');
      }
      
      // Show conflicts if any
      if (syncResult.conflicts.length > 0) {
        toast.warning(`${syncResult.conflicts.length} sync conflict${syncResult.conflicts.length === 1 ? '' : 's'} detected`);
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
      
      return syncResult.syncedCount;
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