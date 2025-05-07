
import React from "react";
import { Dumbbell } from "lucide-react";
import { ExerciseCount } from "./types";

interface KeyExercisesProps {
  exerciseData: ExerciseCount[];
  onExerciseSelect: (exerciseId: string) => void;
}

const KeyExercises: React.FC<KeyExercisesProps> = ({ exerciseData, onExerciseSelect }) => {
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
                  <button 
                    onClick={() => onExerciseSelect(exercise.exercise_id)} 
                    className="text-primary hover:underline text-sm"
                  >
                    Show Progress
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeyExercises;
