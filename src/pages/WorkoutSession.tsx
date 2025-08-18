import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { WorkoutExerciseDetail } from "@/components/workout/types";
import WorkoutProgress from "@/components/workout/WorkoutProgress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Dumbbell, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const WorkoutSession: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [isLoading, setIsLoading] = useState(true);
  const [workout, setWorkout] = useState<any>(null);
  const [exercises, setExercises] = useState<WorkoutExerciseDetail[]>([]);

  useEffect(() => {
    if (workoutId && user?.id) {
      fetchWorkoutDetails();
    }
  }, [workoutId, user?.id]);

  const fetchWorkoutDetails = async () => {
    try {
      setIsLoading(true);
      
      // Fetch workout details
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      if (workoutError) throw workoutError;
      if (!workoutData) throw new Error("Workout not found");
      
      setWorkout(workoutData);
      
      // Fetch workout exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workoutId)
        .order('order_position', { ascending: true });
      
      if (exercisesError) throw exercisesError;
      
      // If no exercises found, fetch some default exercises based on the workout name
      if (!exercisesData || exercisesData.length === 0) {
        const { data: defaultExercises, error: defaultError } = await supabase
          .from('exercises')
          .select('*')
          .limit(5);
          
        if (defaultError) throw defaultError;
        
        if (defaultExercises && defaultExercises.length > 0) {
          // Create temporary workout exercises
          const tempExercises = defaultExercises.map((ex, index) => ({
            id: `temp-${ex.id}`,
            workout_id: workoutId as string,
            exercise_id: ex.id,
            sets: 3,
            reps: 10,
            duration: null,
            rest_time: 60,
            order_in_workout: index,
            notes: null,
            exercise: ex
          }));
          
          setExercises(tempExercises);
        }
      } else {
        // Map the data to ensure proper type compatibility
        const mappedExercises = exercisesData.map((exercise: any) => ({
          ...exercise,
          order_in_workout: exercise.order_position || exercise.order_in_workout || 0,
          duration: exercise.duration,
          rest_time: exercise.rest_time
        }));
        setExercises(mappedExercises);
      }
    } catch (error) {
      console.error("Error fetching workout details:", error);
      toast.error("Failed to load workout details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkoutCompleted = () => {
    toast.success("Workout completed! Your progress has been saved.");
    navigate("/progress");
  };

  // Format day name
  const getDayName = (dayNumber: number | null) => {
    if (dayNumber === null) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber];
  };

  return (
    <DashboardLayout title="Workout Session">
      <div className="max-w-4xl mx-auto pb-24"> {/* Add bottom padding for sticky button */}
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workouts
            </Button>
            
            {!isLoading && workout && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Active Session</span>
              </div>
            )}
          </div>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {workout?.name || "Custom Workout"}
                  </h1>
                  {workout?.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {workout.description}
                    </p>
                  )}
                </div>
              </div>
              
              {workout?.day_of_week !== undefined && (
                <div className="flex items-center text-sm text-gray-500 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Scheduled for: <span className="font-medium">{getDayName(workout.day_of_week)}</span></span>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Content Section */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Loading workout...</h3>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we prepare your workout session</p>
            </div>
          </div>
        ) : exercises.length > 0 ? (
          <WorkoutProgress 
            exercises={exercises}
            workoutId={workoutId as string}
            userId={user?.id}
            onWorkoutCompleted={handleWorkoutCompleted}
          />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                <Dumbbell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Exercises Found</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
                This workout doesn't have any exercises yet. Add some exercises to get started with your training session.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="default"
                  onClick={() => navigate("/workout-plan")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Workout Plan
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkoutSession; 