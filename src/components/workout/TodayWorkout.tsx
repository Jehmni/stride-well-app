
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import { TodayWorkoutProps, WorkoutExerciseDetail } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import WorkoutProgress from "./WorkoutProgress";
import DetailedWorkoutLog from "./DetailedWorkoutLog";

interface TodayWorkoutComponentProps {
  todayWorkout: TodayWorkoutProps;
  userId: string | undefined;
}

const TodayWorkout: React.FC<TodayWorkoutComponentProps> = ({ todayWorkout, userId }) => {
  const navigate = useNavigate();
  const [showTracking, setShowTracking] = useState(false);
  const [todayExercises, setTodayExercises] = useState<WorkoutExerciseDetail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch exercises for today's workout when tracking is shown
  useEffect(() => {
    if (showTracking && userId) {
      fetchTodayExercises();
    }
  }, [showTracking, userId]);

  const fetchTodayExercises = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      
      // Get today's day of week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      
      // First try to get user's custom workout for today
      const { data: userWorkouts, error: userWorkoutError } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .eq('day_of_week', today === 0 ? 7 : today); // Convert Sunday from 0 to 7
        
      if (userWorkoutError) throw userWorkoutError;
      
      // Use the first workout found for today, or create a default based on todayWorkout
      const workoutId = userWorkouts && userWorkouts.length > 0 
        ? userWorkouts[0].id 
        : 'today-workout';
      
      if (userWorkouts && userWorkouts.length > 0) {
        // If user has workout for today, fetch its exercises
        const { data: exercises, error } = await supabase
          .from('workout_exercises')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('workout_id', workoutId)
          .order('order_position', { ascending: true });
          
        if (error) throw error;
        
        // Make sure all exercises have the equipment_required property
        const processedExercises = (exercises || []).map(ex => ({
          ...ex,
          exercise: {
            ...ex.exercise,
            equipment_required: ex.exercise?.equipment_required || null
          }
        })) as WorkoutExerciseDetail[];
        
        setTodayExercises(processedExercises);
      } else {
        // Fetch default exercises based on the user's fitness goal
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('fitness_goal')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        
        // Fetch exercises appropriate for this fitness goal
        const { data: exercises, error } = await supabase
          .from('exercises')
          .select('*')
          .limit(5); // Just get some sample exercises
          
        if (error) throw error;
        
        // Create sample workout exercises from these exercises with equipment_required property
        const defaultExercises: WorkoutExerciseDetail[] = exercises.map((ex, index) => ({
          id: `default-${ex.id}`,
          workout_id: 'today-workout',
          exercise_id: ex.id,
          sets: 3,
          reps: 12,
          duration: null,
          rest_time: 60,
          order_position: index,
          notes: null,
          exercise: {
            ...ex,
            equipment_required: ex.equipment_required || null
          }
        }));
        
        setTodayExercises(defaultExercises);
      }
    } catch (error: any) {
      console.error("Error fetching today's exercises:", error);
      toast.error("Failed to load today's workout exercises");
    } finally {
      setIsLoading(false);
    }
  };

  const completeWorkout = async () => {
    if (!userId) return;
    
    try {
      // Insert into workout_logs table
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          workout_id: 'today-workout',
          duration: todayWorkout.duration,
          calories_burned: Math.floor(Math.random() * 200) + 200 // Random calories between 200-400
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Workout marked as completed!");
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion");
    }
  };

  const handleStartWorkout = () => {
    setShowTracking(true);
  };

  const handleWorkoutCompleted = () => {
    // The workout was completed via the tracking system
    // Reset tracking state
    setTimeout(() => {
      setShowTracking(false);
      // Reload today's workout data
      fetchTodayExercises();
    }, 3000);
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <Calendar className="mr-2 h-5 w-5" />
        Today's Workout
      </h3>
      
      {!showTracking ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkoutCard
            title={todayWorkout.title}
            description={todayWorkout.description}
            duration={todayWorkout.duration}
            exercises={todayWorkout.exercises}
            date={todayWorkout.date}
            image={todayWorkout.image}
            onClick={handleStartWorkout}
          />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium mb-4">Ready to start?</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Complete this workout to track your progress and stay on track with your fitness goals.
            </p>          <div className="space-y-4">
              <Button 
                className="w-full"
                onClick={handleStartWorkout}
              >
                Start Workout <Play className="ml-2 h-4 w-4" />
              </Button>
              
              {userId && (
                <div className="flex w-full gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/progress")}
                  >
                    View Progress
                  </Button>                  <DetailedWorkoutLog 
                    workoutId="today-workout" 
                    workoutTitle={todayWorkout.title}
                    exercises={todayExercises}
                    onComplete={handleWorkoutCompleted}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">{todayWorkout.title}</h2>
            <p className="text-gray-500 dark:text-gray-400">
              {todayWorkout.description}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
              <span className="ml-2">Loading workout...</span>
            </div>
          ) : (
            <WorkoutProgress 
              exercises={todayExercises}
              workoutId="today-workout"
              userId={userId}
              onWorkoutCompleted={handleWorkoutCompleted}
            />
          )}

          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline"
              onClick={() => setShowTracking(false)}
            >
              Back to Overview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayWorkout;
