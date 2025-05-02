
import React from "react";
import { Dumbbell } from "lucide-react";
import { WorkoutExercise } from "./types";

interface KeyExercisesProps {
  exercises: WorkoutExercise[];
}

const KeyExercises: React.FC<KeyExercisesProps> = ({ exercises }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Dumbbell className="mr-2 h-5 w-5" />
        Key Exercises
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="py-3 px-4 text-left">Exercise</th>
              <th className="py-3 px-4 text-left">Sets</th>
              <th className="py-3 px-4 text-left">Reps</th>
              <th className="py-3 px-4 text-left">Target Muscle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {exercises.map((exercise, index) => (
              <tr key={index}>
                <td className="py-3 px-4">{exercise.name}</td>
                <td className="py-3 px-4">{exercise.sets}</td>
                <td className="py-3 px-4">{exercise.reps}</td>
                <td className="py-3 px-4">{exercise.muscle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KeyExercises;
