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
            order_position: index,
            notes: null,
            exercise: ex
          }));
          
          setExercises(tempExercises);
        }
      } else {
        setExercises(exercisesData);
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
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workouts
        </Button>
        
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48 mb-4" />
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold flex items-center">
              <Dumbbell className="mr-2 h-6 w-6" />
              {workout?.name || "Custom Workout"}
            </h1>
            {workout?.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 mb-2">
                {workout.description}
              </p>
            )}
            {workout?.day_of_week !== undefined && (
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Calendar className="h-4 w-4 mr-2" />
                Scheduled for: {getDayName(workout.day_of_week)}
              </div>
            )}
          </>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading workout...</span>
        </div>
      ) : exercises.length > 0 ? (
        <WorkoutProgress 
          exercises={exercises}
          workoutId={workoutId as string}
          userId={user?.id}
          onWorkoutCompleted={handleWorkoutCompleted}
        />
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Dumbbell className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No Exercises Found</h3>
          <p className="mt-2 text-gray-500 max-w-sm mx-auto">
            This workout doesn't have any exercises yet. Add some exercises to get started.
          </p>
          <Button 
            className="mt-4" 
            variant="default"
            onClick={() => navigate("/workout-plan")}
          >
            Return to Workout Plan
          </Button>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutSession; 