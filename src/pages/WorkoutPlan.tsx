
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
import { TodayWorkoutProps } from "@/components/workout/types";
import { Activity, Calendar } from "lucide-react";

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

  useEffect(() => {
    if (profile) {
      // Define today's workout based on fitness goal
      const workoutByGoal = {
        "weight-loss": {
          title: "Fat Burning HIIT",
          description: "High-intensity interval training focused on maximum calorie burn",
          duration: 40,
          exercises: 8,
          date: "Today",
          image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
        },
        "muscle-gain": {
          title: "Strength Building",
          description: "Heavy compound movements for maximum muscle growth",
          duration: 55,
          exercises: 6,
          date: "Today",
          image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
        },
        "general-fitness": {
          title: "Full Body Workout",
          description: "Balanced routine for overall fitness and conditioning",
          duration: 45,
          exercises: 10,
          date: "Today",
          image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
        },
        "endurance": {
          title: "Endurance Builder",
          description: "Cardio and stamina focused workout to improve endurance",
          duration: 60,
          exercises: 7,
          date: "Today",
          image: "https://images.unsplash.com/photo-1596357395217-80de13130e92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80"
        }
      };

      setTodayWorkout(
        workoutByGoal[profile.fitness_goal as keyof typeof workoutByGoal] || workoutByGoal["general-fitness"]
      );
    }
  }, [profile]);

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
        <WeeklyStructure />
        <KeyExercises />
      </div>
      
      <CustomWorkoutList userId={user?.id} />
    </DashboardLayout>
  );
};

export default WorkoutPlan;
