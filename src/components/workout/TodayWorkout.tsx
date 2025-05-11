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
import { getWorkoutPlanExercises } from "@/services/workoutPlanMapper";

interface TodayWorkoutComponentProps {
  todayWorkout: TodayWorkoutProps;
  userId: string | undefined;
}

// Define type for AI plan exercise
interface AIPlanExercise {
  exercise_id?: string;
  name?: string;
  sets?: number;
  reps?: string;
  rest_time?: number;
  muscle?: string;
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
      
      // First check for active AI workout plan for the user
      const { data: aiWorkoutPlans, error: aiPlanError } = await supabase
        .from('workout_plans')
        .select('*')  // Select all fields to get exercises
        .eq('user_id', userId)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (aiPlanError) {
        console.error("Error fetching AI workout plans:", aiPlanError);
      }
      
      // If we have an AI workout plan, extract exercises from it
      if (aiWorkoutPlans && aiWorkoutPlans.length > 0) {
        console.log("Found AI workout plan:", aiWorkoutPlans[0].id);
        const aiPlan = aiWorkoutPlans[0];
        
        // Check if plan contains exercises
        if (aiPlan.exercises && Array.isArray(aiPlan.exercises)) {
          console.log(`Found ${aiPlan.exercises.length} exercises in AI plan`);
          
          // Transform exercises into the format required by WorkoutProgress
          const exerciseDetails: WorkoutExerciseDetail[] = [];
          
          // Get available exercises from the database to match with plan exercises
          const { data: dbExercises, error: exercisesError } = await supabase
            .from('exercises')
            .select('*');
            
          if (exercisesError) {
            console.error("Error fetching exercises:", exercisesError);
          }
          
          // Map AI plan exercises to exercise details
          if (dbExercises) {
            for (let i = 0; i < aiPlan.exercises.length; i++) {
              // Cast the JSON exercise to our type
              const planEx = aiPlan.exercises[i] as unknown as AIPlanExercise;
              
              // Find matching exercise in database
              const dbExercise = dbExercises.find(ex => 
                ex.id === planEx.exercise_id || 
                (planEx.name && ex.name.toLowerCase() === planEx.name.toLowerCase())
              );
              
              if (dbExercise) {
                exerciseDetails.push({
                  id: `ai-ex-${i}`,
                  exercise_id: dbExercise.id,
                  workout_id: aiPlan.id as string,
                  exercise: dbExercise,
                  sets: planEx.sets || 3,
                  reps: planEx.reps || "10-12",
                  duration: null,
                  rest_time: planEx.rest_time || 60,
                  notes: null,
                  order_position: i
                });
              } else {
                // If no match found, create a temporary exercise
                exerciseDetails.push({
                  id: `default-${i}`,
                  exercise_id: `default-${i}`,
                  workout_id: aiPlan.id as string,
                  exercise: {
                    id: `default-${i}`,
                    name: planEx.name || `Exercise ${i+1}`,
                    description: `${planEx.name || 'Exercise'} - ${planEx.sets || 3} sets of ${planEx.reps || '10-12'} reps`,
                    muscle_group: planEx.muscle || "Unknown",
                    difficulty: "Intermediate",
                    exercise_type: "strength",
                    equipment_required: "minimal",
                    created_at: new Date().toISOString()
                  },
                  sets: planEx.sets || 3,
                  reps: planEx.reps || "10-12",
                  duration: null,
                  rest_time: planEx.rest_time || 60,
                  notes: null,
                  order_position: i
                });
              }
            }
            
            if (exerciseDetails.length > 0) {
              setTodayExercises(exerciseDetails);
              return;
            }
          }
        }
      }
      
      // Get today's day of week (0-6, where 0 is Sunday)
      const today = new Date().getDay();
      
      // Try to get user's custom workout for today
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
        // Fetch default exercises based on the user's fitness goal and workout focus
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('fitness_goal')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        
        // Determine appropriate muscle groups based on workout focus
        let muscleGroups: string[] = [];
        const focusLower = todayWorkout.title.toLowerCase();
        
        if (focusLower.includes('upper body')) {
          // Specifically filter for upper body muscle groups
          muscleGroups = ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'];
          
          // Fetch exercises filtered by appropriate muscle groups for upper body workouts
          const { data: exercises, error } = await supabase
            .from('exercises')
            .select('*')
            .in('muscle_group', muscleGroups)
            .not('muscle_group', 'ilike', '%leg%')  // Ensure no leg exercises
            .not('muscle_group', 'ilike', '%lower%') // Ensure no lower body exercises
            .limit(5);
            
          if (error) throw error;
          
          // Create sample workout exercises from these exercises
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
          setIsLoading(false);
          return;
        } else if (focusLower.includes('chest') || focusLower.includes('arms')) {
          muscleGroups = ['chest', 'arms', 'shoulders', 'biceps', 'triceps'];
        } else if (focusLower.includes('lower body') || focusLower.includes('leg')) {
          muscleGroups = ['legs', 'glutes', 'hamstrings', 'quads'];
        } else if (focusLower.includes('core') || focusLower.includes('ab')) {
          muscleGroups = ['core', 'abs'];
        } else if (focusLower.includes('cardio')) {
          // For cardio, filter by exercise type instead of muscle group
          const { data: exercises, error } = await supabase
            .from('exercises')
            .select('*')
            .in('exercise_type', ['cardio', 'hiit', 'endurance'])
            .limit(5);
            
          if (error) throw error;
          return exercises;
        } else {
          // Full body or other workouts - mix of everything
          muscleGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
        }
        
        // Fetch exercises filtered by appropriate muscle groups
        const { data: exercises, error } = await supabase
          .from('exercises')
          .select('*')
          .in('muscle_group', muscleGroups)
          .limit(5);
          
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
    // The workout was completed via the tracking system or user clicked "Start New Session"
    // Reset tracking state and immediately fetch new exercise data
    setShowTracking(false);
    
    // Clear any local storage data for the workout
    localStorage.removeItem(`completedExercises-today-workout`);
    
    // Reload today's workout data
    fetchTodayExercises();
    
    // Show success message
    toast.success("Ready for a new workout session!");
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
