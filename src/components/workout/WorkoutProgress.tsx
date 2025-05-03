
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

  useEffect(() => {
    if (!exercises.length) return;
    
    // Load previously completed exercises from localStorage
    const savedCompleted = JSON.parse(localStorage.getItem('completedExercises') || '{}');
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
  }, [exercises]);
  
  const handleExerciseComplete = (exerciseId: string) => {
    if (!completedExercises.includes(exerciseId)) {
      const updated = [...completedExercises, exerciseId];
      setCompletedExercises(updated);
      
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
    if (!userId) return;
    
    try {
      // Insert into workout_logs table
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          duration: Math.floor(Math.random() * 20) + 30, // Random duration between 30-50 min
          calories_burned: Math.floor(Math.random() * 200) + 200 // Random calories between 200-400
        });
        
      if (error) throw error;
      
      toast.success("Workout completed! Great job!");
      onWorkoutCompleted();
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion");
    }
  };
  
  const resetWorkoutProgress = () => {
    // Clear completed exercises
    localStorage.removeItem('completedExercises');
    setCompletedExercises([]);
    setProgress(0);
    setIsWorkoutComplete(false);
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
