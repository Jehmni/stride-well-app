import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Award, RefreshCw, Clock } from "lucide-react";
import { WorkoutExerciseDetail } from "./types";
import ExerciseTracker from "./ExerciseTracker";
import { supabase } from "@/integrations/supabase/client";
import { 
  syncWorkoutProgressRPC, 
  logWorkoutWithExercisesRPC 
} from "@/integrations/supabase/functions";
import { toast } from "@/components/ui/use-toast";
import { isValidUUID } from "@/lib/utils";
import { ExerciseLogData } from "@/types/rpc";

interface WorkoutProgressProps {
  exercises: WorkoutExerciseDetail[];
  workoutId: string;
  userId: string | undefined;
  onWorkoutCompleted: () => void;
}

const WorkoutProgress: React.FC<WorkoutProgressProps> = ({ 
  exercises, 
  workoutId,
  userId,
  onWorkoutCompleted
}) => {
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'unsynced' | 'error'>('unsynced');

  useEffect(() => {
    if (!exercises.length) return;
    
    // Load previously completed exercises from localStorage for immediate display
    const savedCompleted = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
    const completedIds = exercises
      .filter(ex => savedCompleted[ex.id])
      .map(ex => ex.id);
    
    setCompletedExercises(completedIds);
    
    // Calculate progress
    const newProgress = exercises.length 
      ? Math.round((completedIds.length / exercises.length) * 100) 
      : 0;
    
    setProgress(newProgress);
    setIsWorkoutComplete(newProgress === 100);
    
    // If user is logged in, try to sync with remote progress
    if (userId) {
      syncWithRemoteProgress(completedIds);
    }
  }, [exercises, workoutId, userId]);
  
  // Sync local progress with remote progress in Supabase
  const syncWithRemoteProgress = async (localCompletedIds: string[]) => {
    if (!userId) return;
    
    try {
      setIsSyncing(true);
      setSyncStatus('unsynced');
      
      // Try to get remote progress data from the workout_progress table
      const { data, error } = await supabase
        .from('workout_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('workout_id', workoutId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" - not an error for us
        console.error("Error fetching remote progress:", error);
        setSyncStatus('error');
        return;
      }
      
      if (data) {
        // Remote data exists - check if it's newer than our local data
        const remoteCompletedExercises = data.completed_exercises || [];
        const lastUpdated = new Date(data.last_updated);
        
        // Get local data timestamp if available
        const localTimestampStr = localStorage.getItem(`lastUpdated-${workoutId}`);
        const localTimestamp = localTimestampStr ? new Date(localTimestampStr) : new Date(0);
        
        if (lastUpdated > localTimestamp) {
          // Remote data is newer, use it
          console.log("Remote data is newer, updating local state");
          
          // Update local state
          setCompletedExercises(remoteCompletedExercises);
          
          // Calculate progress with remote data
          const newProgress = exercises.length 
            ? Math.round((remoteCompletedExercises.length / exercises.length) * 100) 
            : 0;
          
          setProgress(newProgress);
          setIsWorkoutComplete(newProgress === 100);
          
          // Update localStorage
          const newSavedCompleted = {};
          remoteCompletedExercises.forEach(id => {
            newSavedCompleted[id] = true;
          });
          
          localStorage.setItem(`completedExercises-${workoutId}`, JSON.stringify(newSavedCompleted));
          localStorage.setItem(`lastUpdated-${workoutId}`, lastUpdated.toISOString());
        } else if (localCompletedIds.length > remoteCompletedExercises.length) {
          // Local data has more completed exercises, sync to remote
          console.log("Local data has more completed exercises, syncing to remote");
          await syncToRemote(localCompletedIds);
        }
      } else if (localCompletedIds.length > 0) {
        // No remote data exists but we have local data - sync to remote
        console.log("No remote data exists but we have local data, syncing to remote");
        await syncToRemote(localCompletedIds);
      }
      
      // Update last synced time
      setLastSynced(new Date());
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error in syncWithRemoteProgress:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Save local progress to remote database
  const syncToRemote = async (ids: string[]) => {
    if (!userId) return;
    
    try {
      setIsSyncing(true);
      setSyncStatus('unsynced');
      
      // Save the current timestamp
      const now = new Date();
      localStorage.setItem(`lastUpdated-${workoutId}`, now.toISOString());
      
      // Use our RPC function to sync workout progress
      try {
        const response = await syncWorkoutProgressRPC({
          user_id_param: userId,
          workout_id_param: workoutId,
          completed_exercises_param: ids
        });
        
        if ('error' in response && response.error) {
          throw response.error;
        }
        
        console.log("Progress synced to remote via RPC");
      } catch (rpcError) {
        console.warn("RPC sync failed, falling back to direct insert:", rpcError);
        
        // Fall back to direct upsert if RPC fails
        const { error } = await supabase
          .from('workout_progress')
          .upsert({
            user_id: userId,
            workout_id: workoutId,
            completed_exercises: ids,
            last_updated: now.toISOString()
          }, {
            onConflict: 'user_id,workout_id'
          });
          
        if (error) throw error;
        
        console.log("Progress synced to remote via direct upsert");
      }
      
      // Update last synced time and status
      setLastSynced(now);
      setSyncStatus('synced');
    } catch (error) {
      console.error("Error in syncToRemote:", error);
      setSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };
  
  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      const updated = [...completedExercises, exerciseId];
      setCompletedExercises(updated);
      
      // Save to localStorage for immediate UI update
      const savedCompleted = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
      savedCompleted[exerciseId] = true;
      localStorage.setItem(`completedExercises-${workoutId}`, JSON.stringify(savedCompleted));
      
      // Save timestamp for sync conflict resolution
      localStorage.setItem(`lastUpdated-${workoutId}`, new Date().toISOString());
      
      // Calculate new progress
      const newProgress = exercises.length 
        ? Math.round((updated.length / exercises.length) * 100) 
        : 0;
      
      setProgress(newProgress);
      setSyncStatus('unsynced');
      
      // Sync to remote if user is logged in
      if (userId) {
        syncToRemote(updated);
      }
      
      // Check if workout is complete
      if (newProgress === 100) {
        setIsWorkoutComplete(true);
        completeWorkout();
      }
    }
  };
  
  const completeWorkout = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to save workout progress",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      console.log("Starting workout completion process for workout:", workoutId);
      
      // Calculate some basic stats based on completed exercises
      const totalDuration = Math.floor(
        exercises.reduce((total, ex) => {
          // Estimate time as sets * (rep time + rest time)
          const repTime = ex.duration || 30; // Default 30s if no duration specified
          return total + (ex.sets * (repTime + ex.rest_time));
        }, 0) / 60
      ); // Convert to minutes
      
      // Estimate calories burned (very rough formula based on duration and intensity)
      const caloriesBurned = Math.floor(totalDuration * 8 + Math.random() * 50);
      
      // Initialize workout variables
      let actualWorkoutId = workoutId;
      let isAIGeneratedWorkout = false;
      let aiWorkoutPlanId: string | null = null;
      
      // Check if this is from an AI-generated workout plan by looking at exercises
      if (exercises.length > 0 && exercises[0].workout_id && isValidUUID(exercises[0].workout_id)) {
        console.log("Found workout_id from exercises:", exercises[0].workout_id);
        actualWorkoutId = exercises[0].workout_id;
        
        // Check if this is an AI workout plan
        const { data: workoutPlan } = await supabase
          .from('workout_plans')
          .select('id, ai_generated')
          .eq('id', actualWorkoutId)
          .single();
          
        if (workoutPlan && workoutPlan.ai_generated) {
          console.log("Detected AI workout plan:", workoutPlan.id);
          isAIGeneratedWorkout = true;
          aiWorkoutPlanId = workoutPlan.id;
        }
      }
      
      // For temporary IDs like 'today-workout', create a real workout entry
      if (actualWorkoutId === 'today-workout' || !isValidUUID(actualWorkoutId)) {
        console.log("Creating new workout for temporary ID:", actualWorkoutId);
        
        // Create a new workout
        const { data: workoutData, error: workoutError } = await supabase
          .from('workouts')
          .insert({
            user_id: userId,
            name: "Daily Workout",
            description: "Completed daily workout",
            day_of_week: new Date().getDay() === 0 ? 7 : new Date().getDay() // Convert Sunday from 0 to 7
          })
          .select('id')
          .single();
          
        if (workoutError) {
          console.error("Error creating workout record:", workoutError);
          throw workoutError;
        }
        
        console.log("Created new workout with ID:", workoutData.id);
        actualWorkoutId = workoutData.id;
        
        // Add exercises to the new workout
        for (let i = 0; i < exercises.length; i++) {
          const ex = exercises[i];
          
          // Skip exercises with invalid exercise_id (e.g. "default-*" temporary IDs)
          if (ex.exercise_id && !ex.exercise_id.startsWith('default-')) {
            const { error: exerciseError } = await supabase
              .from('workout_exercises')
              .insert({
                workout_id: actualWorkoutId,
                exercise_id: ex.exercise_id,
                sets: ex.sets,
                reps: typeof ex.reps === 'string' ? 10 : ex.reps, // Convert string reps to number
                duration: ex.duration,
                rest_time: ex.rest_time,
                order_position: i,
                notes: ex.notes
              });
              
            if (exerciseError) {
              console.error("Error inserting workout exercise:", exerciseError);
              // Continue even if one fails
            }
          }
        }
      }
      
      // Prepare exercise data for the optimized RPC call
      const exerciseData: ExerciseLogData[] = exercises
        .filter(ex => ex.exercise_id && !ex.exercise_id.startsWith('default-')) // Filter out temporary IDs
        .map(ex => ({
          exercise_id: ex.exercise_id,
          sets_completed: ex.sets,
          reps_completed: typeof ex.reps === 'string' ? null : ex.reps,
          notes: ex.notes || undefined
        }));
      
      console.log("Logging workout with all exercises in one transaction");
      
      let logResult: any = null;
      
      try {
        // Use our optimized RPC function to log the workout and exercises in one transaction
        const result = await logWorkoutWithExercisesRPC({
          workout_id_param: actualWorkoutId,
          user_id_param: userId,
          duration_param: totalDuration,
          calories_param: caloriesBurned,
          exercise_data_param: exerciseData,
          is_ai_workout_param: isAIGeneratedWorkout,
          ai_workout_plan_id_param: aiWorkoutPlanId || undefined
        });
        
        logResult = result;
        console.log("Workout log created with ID:", typeof logResult === 'object' ? JSON.stringify(logResult) : logResult);
      } catch (rpcError) {
        console.error("Error with RPC function, falling back to direct inserts:", rpcError);
        
        // Fall back to direct insert approach
        const { data: logData, error: logError } = await supabase
          .from('workout_logs')
          .insert({
            user_id: userId,
            workout_id: actualWorkoutId,
            completed_at: new Date().toISOString(),
            duration: totalDuration,
            calories_burned: caloriesBurned,
            workout_name: exercises[0]?.exercise?.name 
              ? `${exercises[0]?.exercise?.name} Workout` 
              : 'Completed Workout'
          })
          .select('id');
          
        if (logError) {
          console.error("Error creating workout log:", logError);
          throw logError;
        }
        
        if (logData && logData.length > 0) {
          logResult = logData[0].id;
          console.log("Workout log created via direct insert:", logResult);
          
          // Fallback to logging exercises individually
          for (const ex of exerciseData) {
            try {
              const { error: exerciseLogError } = await supabase
                .from('exercise_logs')
                .insert({
                  workout_log_id: logResult,
                  exercise_id: ex.exercise_id,
                  sets_completed: ex.sets_completed,
                  reps_completed: typeof ex.reps_completed === 'string' ? null : ex.reps_completed,
                  completed_at: new Date().toISOString()
                });
                
              if (exerciseLogError) {
                console.error(`Error logging exercise ${ex.exercise_id}:`, exerciseLogError);
              }
            } catch (err) {
              console.error(`Error in exercise logging for ${ex.exercise_id}:`, err);
            }
          }
        }
      }
      
      toast({
        title: "Success",
        description: "Workout completed! Great job!",
      });
      
      onWorkoutCompleted();
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast({
        title: "Error",
        description: "Failed to save workout completion. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetWorkoutProgress = () => {
    try {
      console.log("Resetting workout progress for workout ID:", workoutId);
      
      // Clear completed exercises from localStorage
      localStorage.removeItem(`completedExercises-${workoutId}`);
      
      // Reset state
      setCompletedExercises([]);
      setProgress(0);
      setIsWorkoutComplete(false);
      setLastSynced(null);
      
      // Log the reset for debugging
      console.log("Workout progress reset successfully");
      
      // Notify parent that we're starting a new session
      onWorkoutCompleted();
    } catch (error) {
      console.error("Error resetting workout progress:", error);
    }
  };

  const formatLastSyncedTime = () => {
    if (!lastSynced) return "Not synced yet";
    
    // If synced within last minute, show "Just now"
    const diffMs = Date.now() - lastSynced.getTime();
    if (diffMs < 60000) {
      return "Just now";
    }
    
    // Otherwise show how long ago
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    
    return lastSynced.toLocaleTimeString();
  };

  if (isWorkoutComplete) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center">
        <div className="flex justify-center mb-4">
          <Award className="h-16 w-16 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-green-700 dark:text-green-400 mb-2">
          Workout Complete!
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Congratulations on completing today's workout! Your progress has been saved.
        </p>
        <Button 
          variant="outline"
          onClick={resetWorkoutProgress}
        >
          Start New Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {userId && (
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Last synced: {formatLastSyncedTime()}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2"
            onClick={() => syncWithRemoteProgress(completedExercises)}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-lg font-medium flex items-center">
          <CheckCircle className="mr-2 h-5 w-5 text-gray-400" />
          Exercises to Complete
        </h3>
        
        {exercises.length > 0 ? (
          <div className="space-y-2">
            {exercises.map((exercise) => (
              <ExerciseTracker 
                key={exercise.id}
                exercise={exercise}
                onComplete={handleExerciseComplete}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No exercises added to this workout yet.</p>
        )}
      </div>
    </div>
  );
};

export default WorkoutProgress;
