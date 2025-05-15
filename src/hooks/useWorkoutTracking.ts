import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { saveWorkoutOffline, syncAllWorkouts } from '@/services/offlineStorageService';

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
        // Step 1: Create workout log
        const { data: logData, error: logError } = await supabase
          .from('workout_logs')
          .insert({
            user_id: user.id,
            workout_id: workout.workout_plan_id,
            workout_name: workout.title,
            workout_description: workout.description,
            duration: workout.duration,
            calories_burned: workout.calories_burned,
            notes: workout.notes,
            rating: workout.rating,
            is_from_ai_plan: true,
            ai_workout_plan_id: workout.workout_plan_id,
            workout_type: 'completed',
            completed_at: new Date().toISOString()
          })
          .select('id')
          .single();
        
        if (logError) {
          console.error('Error logging workout:', logError);
          throw new Error('Failed to log workout');
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
              workout_plan_id: workout.workout_plan_id
            });
          
          if (exerciseError) {
            console.error('Error logging exercise:', exerciseError);
            // Continue with other exercises even if one fails
          }
        }
        
        toast.success('Workout logged successfully!');
        return workoutLogId;
      } else {
        // Offline: Save to local storage
        const offlineWorkoutId = saveWorkoutOffline({
          workoutPlanId: workout.workout_plan_id,
          userId: user.id,
          completedAt: new Date().toISOString(),
          duration: workout.duration,
          caloriesBurned: workout.calories_burned,
          exercises: workout.exercises,
          title: workout.title,
          description: workout.description
        });
        
        toast.success('Workout saved offline. It will sync when you reconnect.');
        return offlineWorkoutId;
      }
    } catch (error) {
      console.error('Error in logWorkout:', error);
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