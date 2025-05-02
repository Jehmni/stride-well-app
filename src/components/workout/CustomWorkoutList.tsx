
import React from "react";
import { Dumbbell, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserWorkout } from "./types";
import CreateWorkoutForm from "./CreateWorkoutForm";

interface CustomWorkoutListProps {
  userId: string | undefined;
  userWorkouts: UserWorkout[];
  selectedWorkout: string | null;
  onSelectWorkout: (workoutId: string) => void;
  onDeleteWorkout: (workoutId: string) => void;
  onWorkoutCreated: (workout: UserWorkout) => void;
}

const CustomWorkoutList: React.FC<CustomWorkoutListProps> = ({ 
  userId, 
  userWorkouts, 
  selectedWorkout,
  onSelectWorkout,
  onDeleteWorkout,
  onWorkoutCreated
}) => {
  
  // Get day name from number
  const getDayName = (dayNumber: number | null) => {
    if (dayNumber === null) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber];
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold flex items-center">
          <Dumbbell className="mr-2 h-5 w-5" />
          Your Custom Workouts
        </h3>
        <CreateWorkoutForm userId={userId} onWorkoutCreated={onWorkoutCreated} />
      </div>
      
      {userWorkouts.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Dumbbell className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Custom Workouts Yet</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            Create your first custom workout to start tracking your fitness journey.
          </p>
          <Button 
            className="mt-4" 
            variant="outline"
            onClick={() => document.querySelector<HTMLButtonElement>('[data-new-workout-trigger]')?.click()}
          >
            Create Your First Workout
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userWorkouts.map((workout) => (
            <div
              key={workout.id}
              className={`p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${
                selectedWorkout === workout.id
                  ? 'border-fitness-primary bg-fitness-primary bg-opacity-5'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
              onClick={() => onSelectWorkout(workout.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{workout.name}</h4>
                  {workout.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {workout.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {getDayName(workout.day_of_week)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteWorkout(workout.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomWorkoutList;
