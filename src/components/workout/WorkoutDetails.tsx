
import React from "react";
import { Exercise } from "@/models/models";
import { UserWorkout, WorkoutExerciseDetail } from "./types";
import WorkoutExerciseForm from "./WorkoutExerciseForm";
import WorkoutExerciseList from "./WorkoutExerciseList";

interface WorkoutDetailsProps {
  selectedWorkout: string | null;
  userWorkouts: UserWorkout[];
  workoutExercises: WorkoutExerciseDetail[];
  exercises: Exercise[];
  onExerciseAdded: (exercise: WorkoutExerciseDetail) => void;
  onRemoveExercise: (exerciseId: string) => void;
}

const WorkoutDetails: React.FC<WorkoutDetailsProps> = ({ 
  selectedWorkout, 
  userWorkouts,
  workoutExercises, 
  exercises,
  onExerciseAdded,
  onRemoveExercise
}) => {
  if (!selectedWorkout) return null;

  const currentWorkout = userWorkouts.find(w => w.id === selectedWorkout);
  if (!currentWorkout) return null;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4">
        {currentWorkout.name} - Exercises
      </h3>
      
      <WorkoutExerciseForm 
        selectedWorkout={selectedWorkout} 
        exercises={exercises}
        workoutExercises={workoutExercises}
        onExerciseAdded={onExerciseAdded}
      />
      
      <WorkoutExerciseList 
        workoutExercises={workoutExercises} 
        onRemoveExercise={onRemoveExercise} 
      />
    </div>
  );
};

export default WorkoutDetails;
