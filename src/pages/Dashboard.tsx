
import React from "react";
import { Activity, Dumbbell, Utensils, Weight } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import NutritionCard from "@/components/dashboard/NutritionCard";
import StatsCard from "@/components/dashboard/StatsCard";

const Dashboard: React.FC = () => {
  // Mock user data - would normally come from API/store
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const goalToWorkout = {
    "weight-loss": {
      title: "Fat Burning HIIT",
      description: "High-intensity interval training focused on maximum calorie burn",
      image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
    },
    "muscle-gain": {
      title: "Strength Building",
      description: "Heavy compound movements for maximum muscle growth",
      image: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
    },
    "general-fitness": {
      title: "Full Body Workout",
      description: "Balanced routine for overall fitness and conditioning",
      image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80"
    },
    "endurance": {
      title: "Endurance Builder",
      description: "Cardio and stamina focused workout to improve endurance",
      image: "https://images.unsplash.com/photo-1596357395217-80de13130e92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80"
    }
  };

  const defaultWorkout = {
    title: "Personalized Workout",
    description: "Customized routine based on your fitness profile",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  };

  // Use the workout that matches the user's goal, or the default
  const selectedWorkout = userProfile.fitnessGoal 
    ? goalToWorkout[userProfile.fitnessGoal as keyof typeof goalToWorkout] 
    : defaultWorkout;

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome back!</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Here's an overview of your fitness journey today.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Workouts Completed"
          value="12"
          icon={<Dumbbell className="h-6 w-6 text-fitness-primary" />}
          change={{ value: 20, isPositive: true }}
        />
        <StatsCard
          title="Current Weight"
          value={`${userProfile.weight || 70} kg`}
          icon={<Weight className="h-6 w-6 text-fitness-primary" />}
          change={{ value: 2.5, isPositive: true }}
        />
        <StatsCard
          title="Active Calories"
          value="1,248"
          icon={<Activity className="h-6 w-6 text-fitness-primary" />}
          description="Daily Burn"
        />
        <StatsCard
          title="Protein Intake"
          value="124g"
          icon={<Utensils className="h-6 w-6 text-fitness-primary" />}
          description="Daily Target"
        />
      </div>

      {/* Today's Workout */}
      <h2 className="text-xl font-semibold mb-4">Today's Workout</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <WorkoutCard
          title={selectedWorkout.title}
          description={selectedWorkout.description}
          duration={45}
          exercises={8}
          date="Today"
          image={selectedWorkout.image}
        />

        <NutritionCard
          calories={1450}
          protein={92}
          carbs={145}
          fat={48}
          target={{
            calories: 2000,
            protein: 150,
            carbs: 200,
            fat: 60
          }}
        />
      </div>

      {/* Upcoming Workouts */}
      <h2 className="text-xl font-semibold mb-4">Upcoming Workouts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WorkoutCard
          title="Core Strength"
          description="Focus on abs and lower back for a stronger core"
          duration={30}
          exercises={6}
          date="Tomorrow"
          image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        />
        <WorkoutCard
          title="Mobility & Flexibility"
          description="Improve range of motion and prevent injuries"
          duration={35}
          exercises={8}
          date="Wed, Apr 11"
          image="https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
        />
        <WorkoutCard
          title="Active Recovery"
          description="Light activity to promote recovery and reduce soreness"
          duration={25}
          exercises={5}
          date="Thu, Apr 12"
          image="https://images.unsplash.com/photo-1603287681836-b174ce5074c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
        />
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
