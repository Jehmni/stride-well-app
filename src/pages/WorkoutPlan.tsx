
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Exercise } from "@/models/models";
import WorkoutPlanHeader from "@/components/workout/WorkoutPlanHeader";
import WeeklyStructure from "@/components/workout/WeeklyStructure";
import KeyExercises from "@/components/workout/KeyExercises";
import TodayWorkout from "@/components/workout/TodayWorkout";
import CustomWorkoutList from "@/components/workout/CustomWorkoutList";
import WorkoutDetails from "@/components/workout/WorkoutDetails";
import { 
  WorkoutPlan as WorkoutPlanType,
  UserWorkout,
  WorkoutExerciseDetail,
  TodayWorkoutProps
} from "@/components/workout/types";
import {
  fetchWorkoutExercises,
  removeExerciseFromWorkout,
  deleteWorkout,
  insertWorkoutPlan
} from "@/components/workout/workoutUtils";

const WorkoutPlan: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlanType | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkoutProps | null>(null);
  
  // Custom workouts state
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDetail[]>([]);

  // Fetch workout plan based on user's fitness goal
  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Fetch workout plan from the workout_plans table
        const { data: workoutPlansData, error: workoutPlansError } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('fitness_goal', profile.fitness_goal || 'general-fitness')
          .limit(1);
        
        if (workoutPlansError) throw workoutPlansError;
        
        let plan: WorkoutPlanType;
        
        if (workoutPlansData && workoutPlansData.length > 0) {
          plan = workoutPlansData[0] as unknown as WorkoutPlanType;
        } else {
          // Use a default workout plan if none found in the database
          plan = {
            id: "default",
            title: "General Fitness Program",
            description: "Well-rounded approach to improve overall fitness and health",
            fitness_goal: profile.fitness_goal || "general-fitness",
            weekly_structure: [
              { day: "Monday", focus: "Full Body Strength", duration: 45 },
              { day: "Tuesday", focus: "Cardio & Mobility", duration: 40 },
              { day: "Wednesday", focus: "Core & Balance", duration: 30 },
              { day: "Thursday", focus: "Rest or Light Activity", duration: 20 },
              { day: "Friday", focus: "Full Body Circuit", duration: 45 },
              { day: "Saturday", focus: "Cardio & Flexibility", duration: 40 },
              { day: "Sunday", focus: "Rest Day", duration: 0 }
            ],
            exercises: [
              { name: "Dumbbell Squat", sets: 3, reps: "12-15", muscle: "Legs" },
              { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
              { name: "Dumbbell Row", sets: 3, reps: "12 each arm", muscle: "Back" },
              { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" },
              { name: "Walking Lunges", sets: 2, reps: "10 each leg", muscle: "Legs" },
              { name: "Jumping Jacks", sets: 3, reps: "45 seconds", muscle: "Cardio" }
            ]
          };
          
          // Optionally save this default plan to the database
          try {
            await insertWorkoutPlan([plan]);
          } catch (insertError) {
            console.error("Error saving default workout plan:", insertError);
          }
        }
        
        setWorkoutPlan(plan);
        
        // Set today's workout based on day of week
        const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        const todayWorkoutData = plan.weekly_structure[today];
        
        setTodayWorkout({
          title: todayWorkoutData.focus,
          description: `Focus on ${todayWorkoutData.focus.toLowerCase()} exercises for optimal results`,
          duration: todayWorkoutData.duration,
          exercises: Math.floor(Math.random() * 3) + 4, // Random number between 4-6
          date: "Today",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        });
      
        // Fetch user's custom workouts
        try {
          const { data: userWorkoutData, error: userWorkoutError } = await supabase
            .from('workouts')
            .select('*')
            .eq('user_id', user?.id);
            
          if (userWorkoutError) throw userWorkoutError;
          
          setUserWorkouts(userWorkoutData || []);
        } catch (error: any) {
          console.error("Error fetching user workouts:", error);
          toast.error("Failed to load your custom workouts");
        }
        
        // Fetch exercises
        try {
          const { data: exercisesData, error: exercisesError } = await supabase
            .from('exercises')
            .select('*');
            
          if (exercisesError) throw exercisesError;
          
          setExercises(exercisesData || []);
        } catch (error: any) {
          console.error("Error fetching exercises:", error);
        }
      } catch (error: any) {
        console.error("Error fetching workout plan:", error);
        toast.error("Failed to load your workout plan");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutPlan();
  }, [profile, user?.id]);
  
  // Handle selecting a workout and fetching its exercises
  const handleSelectWorkout = async (workoutId: string) => {
    setSelectedWorkout(workoutId);
    const exercises = await fetchWorkoutExercises(workoutId);
    setWorkoutExercises(exercises);
  };

  // Handle workout deletion
  const handleDeleteWorkout = async (workoutId: string) => {
    const success = await deleteWorkout(workoutId);
    if (success) {
      setUserWorkouts(userWorkouts.filter(workout => workout.id !== workoutId));
      if (selectedWorkout === workoutId) {
        setSelectedWorkout(null);
        setWorkoutExercises([]);
      }
    }
  };

  // Handle removing an exercise
  const handleRemoveExercise = async (exerciseId: string) => {
    const success = await removeExerciseFromWorkout(exerciseId);
    if (success) {
      setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId));
    }
  };

  // Handle adding a new workout
  const handleWorkoutCreated = (workout: UserWorkout) => {
    setUserWorkouts([workout, ...userWorkouts]);
  };

  // Handle adding a new exercise
  const handleExerciseAdded = (exercise: WorkoutExerciseDetail) => {
    setWorkoutExercises([...workoutExercises, exercise]);
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2">Loading your workout plan...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!workoutPlan) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workout plan found for your fitness goal.
          </p>
          <Button onClick={() => navigate("/profile")}>
            Update Your Fitness Goal
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workout Plans">
      <WorkoutPlanHeader workoutPlan={workoutPlan} />
      <WeeklyStructure weeklyStructure={workoutPlan.weekly_structure} />
      <KeyExercises exercises={workoutPlan.exercises} />

      {todayWorkout && (
        <TodayWorkout todayWorkout={todayWorkout} userId={user?.id} />
      )}
      
      <CustomWorkoutList 
        userId={user?.id}
        userWorkouts={userWorkouts}
        selectedWorkout={selectedWorkout}
        onSelectWorkout={handleSelectWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onWorkoutCreated={handleWorkoutCreated}
      />
      
      <WorkoutDetails
        selectedWorkout={selectedWorkout}
        userWorkouts={userWorkouts}
        workoutExercises={workoutExercises}
        exercises={exercises}
        onExerciseAdded={handleExerciseAdded}
        onRemoveExercise={handleRemoveExercise}
      />
    </DashboardLayout>
  );
};

export default WorkoutPlan;
