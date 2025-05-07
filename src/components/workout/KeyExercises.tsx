
import React from "react";
import { Dumbbell } from "lucide-react";
import { ExerciseCount, WorkoutExercise } from "./types";

interface KeyExercisesProps {
  exerciseData?: ExerciseCount[];
  exercises?: WorkoutExercise[];
  onExerciseSelect?: (exerciseId: string) => void;
}

const KeyExercises: React.FC<KeyExercisesProps> = ({ exerciseData, exercises, onExerciseSelect }) => {
  // If exerciseData is provided (from ExerciseDashboard), render exercise table
  if (exerciseData && exerciseData.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Dumbbell className="mr-2 h-5 w-5" />
            Most Used Exercises
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Exercise</th>
                <th className="px-4 py-2 text-left">Muscle Group</th>
                <th className="px-4 py-2 text-center">Times Performed</th>
                <th className="px-4 py-2 text-right">View Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exerciseData.map((exercise) => (
                <tr key={exercise.exercise_id} className="hover:bg-muted/50">
                  <td className="px-4 py-2 font-medium">{exercise.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{exercise.muscle_group}</td>
                  <td className="px-4 py-2 text-center">{exercise.count}</td>
                  <td className="px-4 py-2 text-right">
                    {onExerciseSelect && (
                      <button 
                        onClick={() => onExerciseSelect(exercise.exercise_id)} 
                        className="text-primary hover:underline text-sm"
                      >
                        Show Progress
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // If exercises is provided (from WorkoutPlan), render key exercises
  if (exercises && exercises.length > 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Dumbbell className="mr-2 h-5 w-5" />
          Key Exercises
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left">Exercise</th>
                <th className="px-4 py-2 text-left">Muscle Group</th>
                <th className="px-4 py-2 text-center">Sets</th>
                <th className="px-4 py-2 text-right">Reps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {exercises.map((exercise, index) => (
                <tr key={index} className="hover:bg-muted/30">
                  <td className="px-4 py-2 font-medium">{exercise.name}</td>
                  <td className="px-4 py-2 text-muted-foreground">{exercise.muscle}</td>
                  <td className="px-4 py-2 text-center">{exercise.sets}</td>
                  <td className="px-4 py-2 text-right">{exercise.reps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  // Fallback if no data is provided
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">No exercise data available</h3>
    </div>
  );
};

export default KeyExercises;
