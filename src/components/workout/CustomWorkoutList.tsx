import React from "react";
import { Dumbbell, Trash, Play, Calendar, CalendarCheck, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserWorkout } from "./types";
import CreateWorkoutForm from "./CreateWorkoutForm";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
  userWorkouts = [], // Provide default empty array
  selectedWorkout = null, // Provide default null
  onSelectWorkout = () => {}, // Provide default no-op function
  onDeleteWorkout = () => {}, // Provide default no-op function
  onWorkoutCreated = () => {} // Provide default no-op function
}) => {
  const navigate = useNavigate();
  
  // Get day name from number
  const getDayName = (dayNumber: number | null) => {
    if (dayNumber === null) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber];
  };

  // Check if workout is scheduled for today
  const isWorkoutForToday = (dayOfWeek: number | null): boolean => {
    if (dayOfWeek === null) return true; // "Any day" workouts can be done today
    const today = new Date().getDay();
    // Convert Sunday from 0 to 7 to match our day_of_week format
    const adjustedToday = today === 0 ? 7 : today;
    return dayOfWeek === adjustedToday - 1; // -1 because our days are 0-indexed
  };

  // Start the selected workout
  const handleStartWorkout = (workoutId: string) => {
    if (userId) {
      // Navigate to a workout session page with the workout ID
      navigate(`/workout-session/${workoutId}`);
    }
  };

  // Get the selected workout object
  const selectedWorkoutObj = selectedWorkout 
    ? userWorkouts.find(w => w.id === selectedWorkout) 
    : null;

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
          {userWorkouts.map((workout) => {
            const isForToday = isWorkoutForToday(workout.day_of_week);
            return (
              <Card
                key={workout.id}
                className={`overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                  selectedWorkout === workout.id
                    ? 'border-fitness-primary border-2'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => onSelectWorkout(workout.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{workout.name}</h4>
                        {isForToday && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            Today
                          </Badge>
                        )}
                      </div>
                      {workout.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {workout.description}
                        </p>
                      )}
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        {workout.day_of_week !== null ? (
                          <CalendarCheck className="h-3 w-3 mr-1" />
                        ) : (
                          <CalendarDays className="h-3 w-3 mr-1" />
                        )}
                        {getDayName(workout.day_of_week)}
                      </div>
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
                </CardContent>
                {selectedWorkout === workout.id && (
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    <Button 
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartWorkout(workout.id);
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Workout
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Selected Workout Preview */}
      {selectedWorkoutObj && (
        <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{selectedWorkoutObj.name}</h3>
            <Button 
              onClick={() => handleStartWorkout(selectedWorkoutObj.id)}
              className="bg-fitness-primary hover:bg-fitness-primary-dark"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Workout
            </Button>
          </div>
          {selectedWorkoutObj.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedWorkoutObj.description}
            </p>
          )}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2" />
            Scheduled for: {getDayName(selectedWorkoutObj.day_of_week)}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomWorkoutList;
