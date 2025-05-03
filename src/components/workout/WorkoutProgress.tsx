
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Award } from "lucide-react";
import { WorkoutExerciseDetail } from "./types";
import ExerciseTracker from "./ExerciseTracker";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!exercises.length) return;
    
    // Load previously completed exercises from localStorage
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
  }, [exercises, workoutId]);
  
  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      const updated = [...completedExercises, exerciseId];
      setCompletedExercises(updated);
      
      // Save to localStorage
      const savedCompleted = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
      savedCompleted[exerciseId] = true;
      localStorage.setItem(`completedExercises-${workoutId}`, JSON.stringify(savedCompleted));
      
      // Calculate new progress
      const newProgress = exercises.length 
        ? Math.round((updated.length / exercises.length) * 100) 
        : 0;
      
      setProgress(newProgress);
      
      // Check if workout is complete
      if (newProgress === 100) {
        setIsWorkoutComplete(true);
        completeWorkout();
      }
    }
  };
  
  const completeWorkout = async () => {
    if (!userId) {
      toast.error("You must be logged in to save workout progress");
      return;
    }
    
    try {
      setIsSaving(true);
      
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
      
      let actualWorkoutId = workoutId;
      
      // For "today-workout" or any non-UUID workoutId, create a real workout entry first
      if (workoutId === 'today-workout' || !isValidUUID(workoutId)) {
        console.log("Creating new workout record for temporary workout ID:", workoutId);
        
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
        
        // Now insert the exercises into workout_exercises table
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
                reps: ex.reps,
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
      
      // Insert into workout_logs table
      const { data: logData, error: logError } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          workout_id: actualWorkoutId,
          completed_at: new Date().toISOString(),
          duration: totalDuration,
          calories_burned: caloriesBurned
        });
        
      if (logError) {
        throw logError;
      }
      
      toast.success("Workout completed! Great job!");
      onWorkoutCompleted();
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const resetWorkoutProgress = () => {
    // Clear completed exercises
    localStorage.removeItem(`completedExercises-${workoutId}`);
    setCompletedExercises([]);
    setProgress(0);
    setIsWorkoutComplete(false);
  };

  // Helper function to validate UUID
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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
                isCompleted={completedExercises.includes(exercise.id)}
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
