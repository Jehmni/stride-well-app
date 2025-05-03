
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutPlanHeader from "@/components/workout/WorkoutPlanHeader";
import WeeklyStructure from "@/components/workout/WeeklyStructure";
import KeyExercises from "@/components/workout/KeyExercises";
import TodayWorkout from "@/components/workout/TodayWorkout";
import CustomWorkoutList from "@/components/workout/CustomWorkoutList";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TodayWorkoutProps, WorkoutDay, WorkoutExercise, UserWorkout, WorkoutPlan as WorkoutPlanType } from "@/components/workout/types";
import { Activity, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { generatePersonalizedWorkoutPlan, fetchUserWorkouts } from "@/services/workoutService";
import { toast } from "sonner";

const WorkoutPlan: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkoutProps>({
    title: "Loading workout...",
    description: "Please wait",
    duration: 0,
    exercises: 0,
    date: "Today",
    image: ""
  });
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [weeklyStructure, setWeeklyStructure] = useState<WorkoutDay[]>([
    { day: "Monday", focus: "Upper Body", duration: 45 },
    { day: "Tuesday", focus: "Lower Body", duration: 45 },
    { day: "Wednesday", focus: "Cardio", duration: 30 },
    { day: "Thursday", focus: "Core", duration: 30 },
    { day: "Friday", focus: "Full Body", duration: 45 },
    { day: "Saturday", focus: "Active Recovery", duration: 30 },
    { day: "Sunday", focus: "Rest", duration: 0 }
  ]);
  const [keyExercises, setKeyExercises] = useState<WorkoutExercise[]>([
    { name: "Squats", sets: 3, reps: "10-12", muscle: "Legs" },
    { name: "Bench Press", sets: 3, reps: "8-10", muscle: "Chest" },
    { name: "Deadlifts", sets: 3, reps: "6-8", muscle: "Back" },
    { name: "Shoulder Press", sets: 3, reps: "8-10", muscle: "Shoulders" },
    { name: "Pull-ups", sets: 3, reps: "Max", muscle: "Back" }
  ]);
  useEffect(() => {
    if (profile) {
      // Load personalized workout plan using the AI-driven service
      const loadWorkoutPlan = async () => {
        try {
          // Fetch personalized workout plan from the service
          const workoutPlan = await generatePersonalizedWorkoutPlan(profile);
          
          if (workoutPlan) {
            // Update weekly structure state
            setWeeklyStructure(workoutPlan.weekly_structure);
            
            // Update key exercises state
            setKeyExercises(workoutPlan.exercises);
            
            // Get today's day of the week (0-6, starting with Sunday)
            const today = new Date().getDay();
            // Adjust to match our weekly structure (starting with Monday)
            const todayIndex = today === 0 ? 6 : today - 1;
            
            const todaysWorkout = workoutPlan.weekly_structure[todayIndex];
            
            // Get an image based on workout focus
            const workoutImage = getWorkoutImage(todaysWorkout.focus);
            
            // Define today's workout based on the personalized plan
            setTodayWorkout({
              title: `${todaysWorkout.focus} Workout`,
              description: `${workoutPlan.description} - Focused on ${todaysWorkout.focus.toLowerCase()}`,
              duration: todaysWorkout.duration,
              exercises: Math.min(8, workoutPlan.exercises.length),
              date: "Today",
              image: workoutImage
            });
          } else {
            // Fallback workout if plan generation fails
      };

      setTodayWorkout(
        workoutByGoal[profile.fitness_goal as keyof typeof workoutByGoal] || workoutByGoal["general-fitness"]
      );
    }
    
    // Fetch user's custom workouts
    if (user?.id) {
      fetchUserWorkouts(user.id);
    }
  }, [profile, user?.id]);

  const fetchUserWorkouts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error("Error fetching workouts:", error);
        return;
      }
      
      setUserWorkouts(data || []);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    }
  };

  const handleSelectWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
      
      if (error) throw error;
      
      // Update state after successful deletion
      setUserWorkouts(userWorkouts.filter(workout => workout.id !== workoutId));
      if (selectedWorkout === workoutId) {
        setSelectedWorkout(null);
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
    }
  };

  const handleWorkoutCreated = (workout: UserWorkout) => {
    setUserWorkouts([...userWorkouts, workout]);
  };

  return (
    <DashboardLayout title="Workout Plan">
      {/* Quick link to progress tracking */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">
          Follow your personalized workout plan designed to help you reach your fitness goals.
        </p>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => navigate("/progress")}
        >
          <Activity className="h-4 w-4 mr-2" />
          View Progress
        </Button>
      </div>

      <WorkoutPlanHeader
        fitnessGoal={profile?.fitness_goal || "general-fitness"}
      />
      
      <TodayWorkout 
        todayWorkout={todayWorkout}
        userId={user?.id}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <WeeklyStructure weeklyStructure={weeklyStructure} />
        <KeyExercises exercises={keyExercises} />
      </div>
      
      <CustomWorkoutList 
        userId={user?.id} 
        userWorkouts={userWorkouts}
        selectedWorkout={selectedWorkout}
        onSelectWorkout={handleSelectWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onWorkoutCreated={handleWorkoutCreated}
      />
    </DashboardLayout>
  );
};

export default WorkoutPlan;
