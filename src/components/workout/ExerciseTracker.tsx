
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { WorkoutExerciseDetail } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ExerciseTrackerProps {
  exercise: WorkoutExerciseDetail;
  onComplete: (exerciseId: string) => void;
}

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({ exercise, onComplete }) => {
  const [setProgress, setSetProgress] = useState<boolean[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Initialize set progress tracking array
  useEffect(() => {
    setSetProgress(Array(exercise.sets).fill(false));
    
    // Check if this exercise is already marked as completed in local storage
    const completedExercises = JSON.parse(localStorage.getItem('completedExercises') || '{}');
    if (completedExercises[exercise.id]) {
      setIsCompleted(true);
      setSetProgress(Array(exercise.sets).fill(true));
    }
  }, [exercise.id, exercise.sets]);

  const handleSetComplete = (setIndex: number) => {
    const newSetProgress = [...setProgress];
    newSetProgress[setIndex] = !newSetProgress[setIndex];
    setSetProgress(newSetProgress);
    
    // Check if all sets are completed
    const allCompleted = newSetProgress.every(set => set);
    if (allCompleted && !isCompleted) {
      handleExerciseComplete();
    } else if (!allCompleted && isCompleted) {
      setIsCompleted(false);
    }
  };

  const handleExerciseComplete = async () => {
    try {
      setIsCompleted(true);
      
      // Store completion status in localStorage for persistent state
      const completedExercises = JSON.parse(localStorage.getItem('completedExercises') || '{}');
      completedExercises[exercise.id] = true;
      localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
      
      // Notify parent component
      onComplete(exercise.id);
      
      toast.success(`Completed ${exercise.exercise.name}!`);
    } catch (error) {
      console.error("Error marking exercise as complete:", error);
      toast.error("Failed to mark exercise as complete");
    }
  };

  if (isCompleted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-4 w-4 mr-2 rounded-full bg-green-500"></div>
            <span className="text-green-700 dark:text-green-400 font-medium">
              {exercise.exercise.name} - Completed all {exercise.sets} sets
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setIsCompleted(false);
              setSetProgress(Array(exercise.sets).fill(false));
              
              // Remove from local storage
              const completedExercises = JSON.parse(localStorage.getItem('completedExercises') || '{}');
              delete completedExercises[exercise.id];
              localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-2">
      <div className="mb-2">
        <span className="font-medium">{exercise.exercise.name}</span>
        <div className="text-sm text-gray-500">
          {exercise.sets} sets x {exercise.reps || "—"} reps
          {exercise.rest_time ? ` • ${exercise.rest_time}s rest` : ''}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {setProgress.map((completed, index) => (
          <div
            key={index}
            className="flex items-center space-x-2"
          >
            <Checkbox
              id={`set-${exercise.id}-${index}`}
              checked={completed}
              onCheckedChange={() => handleSetComplete(index)}
            />
            <label
              htmlFor={`set-${exercise.id}-${index}`}
              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Set {index + 1}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseTracker;
