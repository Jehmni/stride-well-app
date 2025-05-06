import React, { useState, useEffect } from "react";
import { Activity, ChevronRight, Dumbbell, Utensils, Weight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import NutritionCard from "@/components/dashboard/NutritionCard";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI } from "@/utils/healthCalculations";
import { generatePersonalizedWorkoutPlan } from "@/services/workoutService";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [selectedWorkout, setSelectedWorkout] = useState({
    title: "Personalized Workout",
    description: "Customized routine based on your fitness profile",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Get user's first name for welcome message
  const firstName = profile?.first_name || "there";
  
  // Calculate BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  
  // Fetch personalized workout on component mount
  useEffect(() => {
    const loadPersonalizedWorkout = async () => {
      if (!profile) return;
      
      try {
        // Fetch personalized workout plan from AI service
        const workoutPlan = await generatePersonalizedWorkoutPlan(profile);
        
        if (workoutPlan) {
          // Select an appropriate image based on the fitness goal
          let workoutImage = "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80";
          
          // Map fitness goals to appropriate images
          if (profile.fitness_goal === "weight-loss") {
            workoutImage = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80";
          } else if (profile.fitness_goal === "muscle-gain") {
            workoutImage = "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1469&q=80";
          } else if (profile.fitness_goal === "endurance") {
            workoutImage = "https://images.unsplash.com/photo-1596357395217-80de13130e92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1742&q=80";
          }
          
          // Update selected workout with data from the personalized plan
          setSelectedWorkout({
            title: workoutPlan.title,
            description: workoutPlan.description,
            image: workoutImage
          });
        }
      } catch (error) {
        console.error("Error loading personalized workout:", error);
        // Fallback to default workout if there's an error
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPersonalizedWorkout();
  }, [profile]);

  return (
    <DashboardLayout title="Dashboard">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Welcome back, {firstName}!</h2>
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
          value={`${profile?.weight || 70} kg`}
          icon={<Weight className="h-6 w-6 text-fitness-primary" />}
          change={{ value: 2.5, isPositive: true }}
        />
        <StatsCard
          title="BMI"
          value={userBMI ? userBMI.toFixed(1) : "N/A"}
          icon={<Activity className="h-6 w-6 text-fitness-primary" />}
          description={userBMI ? getBMICategory(userBMI) : "Not calculated"}
        />
        <StatsCard
          title="Active Calories"
          value="1,248"
          icon={<Activity className="h-6 w-6 text-fitness-primary" />}
          description="Daily Burn"
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
          onClick={() => navigate('/workouts')}
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
          onClick={() => navigate('/meal-plan')}
        />
      </div>      {/* Workout Progress Statistics */}
      <div className="mb-8">
        <WorkoutStatistics onViewAllProgress={() => navigate('/progress')} />
      </div>

      {/* Upcoming Workouts */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Upcoming Workouts</h2>
        <button 
          className="text-fitness-primary flex items-center text-sm font-medium"
          onClick={() => navigate('/workouts')}
        >
          View All
          <ChevronRight size={16} className="ml-1" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <WorkoutCard
          title="Core Strength"
          description="Focus on abs and lower back for a stronger core"
          duration={30}
          exercises={6}
          date="Tomorrow"
          image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          onClick={() => navigate('/workouts')}
        />
        <WorkoutCard
          title="Mobility & Flexibility"
          description="Improve range of motion and prevent injuries"
          duration={35}
          exercises={8}
          date="Wed, Apr 11"
          image="https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          onClick={() => navigate('/workouts')}
        />
        <WorkoutCard
          title="Active Recovery"
          description="Light activity to promote recovery and reduce soreness"
          duration={25}
          exercises={5}
          date="Thu, Apr 12"
          image="https://images.unsplash.com/photo-1603287681836-b174ce5074c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1471&q=80"
          onClick={() => navigate('/workouts')}
        />
      </div>
    </DashboardLayout>
  );
};

// Helper function to determine BMI category
const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal Weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

export default Dashboard;
