
import React from "react";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { WorkoutExerciseDetail } from "./types";

interface WorkoutExerciseListProps {
  workoutExercises: WorkoutExerciseDetail[];
  onRemoveExercise: (exerciseId: string) => void;
}

const WorkoutExerciseList: React.FC<WorkoutExerciseListProps> = ({ workoutExercises, onRemoveExercise }) => {
  return (
    <>
      {workoutExercises.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="py-3 px-4 text-left">Exercise</th>
                <th className="py-3 px-4 text-left">Sets</th>
                <th className="py-3 px-4 text-left">Reps</th>
                <th className="py-3 px-4 text-left">Rest</th>
                <th className="py-3 px-4 text-left">Notes</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {workoutExercises.map((ex) => (
                <tr key={ex.id}>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{ex.exercise.name}</div>
                      <div className="text-xs text-gray-500">{ex.exercise.muscle_group}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{ex.sets}</td>
                  <td className="py-3 px-4">{ex.reps || '-'}</td>
                  <td className="py-3 px-4">{ex.rest_time}s</td>
                  <td className="py-3 px-4">{ex.notes || '-'}</td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => onRemoveExercise(ex.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500">No exercises added to this workout yet.</p>
        </div>
      )}
    </>
  );
};

export default WorkoutExerciseList;
