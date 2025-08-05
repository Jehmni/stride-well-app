import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Award, RefreshCw, Clock, RotateCcw, ArrowUp } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { v4 as uuidv4 } from 'uuid';

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
  const [completedExercises, setCompletedExercises] = useState<Record<string, {
    id: string;
    sets_completed: number;
    reps_completed: number;
    weight_used?: number;
    notes?: string;
  }>>({});
  const [progress, setProgress] = useState<number>(0);
  const [isWorkoutComplete, setIsWorkoutComplete] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'unsynced' | 'error'>('unsynced');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [showScrollToTop, setShowScrollToTop] = useState<boolean>(false);

  useEffect(() => {
    if (!exercises.length) return;
    
    // Load previously completed exercises from localStorage for immediate display
    const savedCompleted = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
    const completedIds = exercises
      .filter(ex => savedCompleted[ex.id])
      .map(ex => ex.id);
    
    setCompletedExercises(completedIds.map(id => ({
      [id]: {
        id,
        sets_completed: 0,
        reps_completed: 0,
        weight_used: 0,
        notes: ""
      }
    })).reduce((acc, curr) => ({ ...acc, ...curr }), {}));
    
    // Calculate progress
    const newProgress = exercises.length 
      ? Math.round((Object.keys(completedExercises).length / exercises.length) * 100) 
      : 0;
    
    setProgress(newProgress);
    setIsWorkoutComplete(newProgress === 100);
    
    // If user is logged in, try to sync with remote progress
    if (userId) {
      syncWithRemoteProgress(Object.keys(completedExercises));
    }
  }, [exercises, workoutId, userId]);

  // Show celebration toast when all exercises are completed
  useEffect(() => {
    const completedCount = Object.keys(completedExercises).length;
    const totalCount = exercises.length;
    
    if (completedCount === totalCount && totalCount > 0) {
      // Small delay to ensure the UI has updated
      setTimeout(() => {
        toast({
          title: "🎉 All exercises completed!",
          description: "Great job! You can now complete your workout.",
          duration: 3000,
        });
      }, 500);
    }
  }, [completedExercises, exercises.length]);

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      // Show scroll-to-top button when user has scrolled down significantly
      setShowScrollToTop(scrollY > windowHeight * 0.3);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Helper function to validate UUID format
  const isValidUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  // Sync local progress with remote progress in Supabase
  const syncWithRemoteProgress = async (localCompletedIds: string[]) => {
    if (!userId) return;
    
    // Skip database sync for invalid workout IDs (like "today-workout")
    if (!isValidUUID(workoutId)) {
      console.log(`Skipping database sync for invalid workout ID: ${workoutId}`);
      setSyncStatus('synced');
      return;
    }
    
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
          setCompletedExercises(remoteCompletedExercises.map(id => ({
            [id]: {
              id,
              sets_completed: 0,
              reps_completed: 0,
              weight_used: 0,
              notes: ""
            }
          })).reduce((acc, curr) => ({ ...acc, ...curr }), {}));
          
          // Calculate progress with remote data
          const newProgress = exercises.length 
            ? Math.round((Object.keys(completedExercises).length / exercises.length) * 100) 
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
    
    // Skip database sync for invalid workout IDs (like "today-workout")
    if (!isValidUUID(workoutId)) {
      console.log(`Skipping remote sync for invalid workout ID: ${workoutId}`);
      setSyncStatus('synced');
      return;
    }
    
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
  
  const handleExerciseComplete = (exerciseId: string, data?: {
    sets_completed: number;
    reps_completed: number;
    weight_used?: number;
    notes?: string;
  }) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: {
        id: exerciseId,
        sets_completed: data?.sets_completed || 0,
        reps_completed: data?.reps_completed || 0,
        weight_used: data?.weight_used,
        notes: data?.notes
      }
    }));
  };
  
  const handleWorkoutComplete = async () => {
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
                duration_seconds: ex.duration,
                rest_seconds: ex.rest_time,
                order_in_workout: i,
                notes: ex.notes,
                weight_kg: ex.weight_kg || null
              } as any); // Temporary workaround for type mismatch
              
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
  
  const handleResetAll = () => {
    try {
      console.log("Resetting workout progress for workout ID:", workoutId);
      
      // Clear completed exercises from localStorage
      localStorage.removeItem(`completedExercises-${workoutId}`);
      
      // Reset state
      setCompletedExercises({});
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
          onClick={handleResetAll}
        >
          Start New Session
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24"> {/* Add bottom padding for sticky button */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className={`h-3 w-3 rounded-full ${
                Object.keys(completedExercises).length === exercises.length && exercises.length > 0
                  ? 'bg-green-500' 
                  : Object.keys(completedExercises).length > 0 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
              }`} />
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Workout Progress</h3>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {Object.keys(completedExercises).length} of {exercises.length} exercises completed
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${exercises.length > 0 ? (Object.keys(completedExercises).length / exercises.length) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exercises.length > 0 ? Math.round((Object.keys(completedExercises).length / exercises.length) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowResetConfirm(true)}
                    disabled={Object.keys(completedExercises).length === 0}
                    className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Progress
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset all exercise progress</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Exercises?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset progress for all exercises in this workout. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAll}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      

      
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
            onClick={() => syncWithRemoteProgress(Object.keys(completedExercises))}
            disabled={isSyncing}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <div className="h-2 w-2 bg-blue-500 rounded-full mr-3"></div>
            Workout Exercises
          </h3>
          {exercises.length > 0 && (
            <div className="text-sm text-gray-500">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} total
            </div>
          )}
        </div>
        
        {exercises.length > 0 ? (
          <div className="grid gap-4">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="relative">
                <div className="absolute -left-4 top-6 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                  {index + 1}
                </div>
                <ExerciseTracker 
                  exercise={exercise}
                  onComplete={handleExerciseComplete}
                  workoutId={workoutId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Exercises Available</h4>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              This workout doesn't have any exercises yet. Add some exercises to get started with your training.
            </p>
          </div>
        )}
      </div>
      
      {/* Sticky Complete Workout Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-50 p-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`h-3 w-3 rounded-full ${
                  Object.keys(completedExercises).length === exercises.length && exercises.length > 0
                    ? 'bg-green-500' 
                    : Object.keys(completedExercises).length > 0 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                }`} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Object.keys(completedExercises).length} of {exercises.length} exercises completed
                </span>
              </div>
              
              <div className="hidden sm:flex items-center space-x-2">
                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${exercises.length > 0 ? (Object.keys(completedExercises).length / exercises.length) * 100 : 0}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {exercises.length > 0 ? Math.round((Object.keys(completedExercises).length / exercises.length) * 100) : 0}%
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {showScrollToTop && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={scrollToTop}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <ArrowUp className="h-4 w-4" />
                        <span className="hidden sm:inline ml-2">Top</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Scroll to top</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowResetConfirm(true)}
                      disabled={Object.keys(completedExercises).length === 0}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="hidden sm:inline ml-2">Reset</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset all exercise progress</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button 
                onClick={handleWorkoutComplete}
                disabled={isSaving || Object.keys(completedExercises).length === 0}
                size="lg"
                className={`font-semibold transition-all duration-200 min-w-[160px] ${
                  Object.keys(completedExercises).length === exercises.length && exercises.length > 0
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl animate-pulse"
                    : Object.keys(completedExercises).length > 0
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Processing...
                  </>
                ) : Object.keys(completedExercises).length === exercises.length && exercises.length > 0 ? (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete Workout
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Complete {Object.keys(completedExercises).length > 0 ? 'Remaining' : 'All'} Exercises
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutProgress;
