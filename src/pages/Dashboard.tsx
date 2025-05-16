import React, { useState, useEffect } from "react";
import { Activity, ChevronRight, Dumbbell, Utensils, Weight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import NutritionCard from "@/components/dashboard/NutritionCard";
import AIWorkoutCard from "@/components/dashboard/AIWorkoutCard";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";
import { generatePersonalizedWorkoutPlan } from "@/services/workoutService";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";
import { useWorkoutSchedule } from "@/hooks/useWorkoutSchedule";
import { useNutrition } from "@/hooks/useNutrition";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
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
  
  // Get workout statistics
  const workoutStats = useWorkoutStats(user?.id);
  
  // Get workout schedule
  const workoutSchedule = useWorkoutSchedule(user?.id);
  
  // Get nutrition data
  const [nutritionData, logNutrition] = useNutrition(user?.id);
  
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
        {workoutStats.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard
            title="Workouts Completed"
            value={workoutStats.totalCount}
            icon={<Dumbbell className="h-6 w-6 text-fitness-primary" />}
            change={workoutStats.previousWeekCount > 0 ? {
              value: workoutStats.weeklyPercentChange,
              isPositive: workoutStats.isPositive
            } : undefined}
          />
        )}
        
        <StatsCard
          title="Current Weight"
          value={`${profile?.weight || 70} kg`}
          icon={<Weight className="h-6 w-6 text-fitness-primary" />}
          change={profile?.updated_at ? { value: 2.5, isPositive: true } : undefined}
        />
        
        <StatsCard
          title="BMI"
          value={userBMI ? userBMI.toFixed(1) : "N/A"}
          icon={<Activity className="h-6 w-6 text-fitness-primary" />}
          description={userBMI ? getBMICategory(userBMI) : "Not calculated"}
        />
        
        {workoutStats.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <StatsCard
            title="Active Calories"
            value={workoutStats.dailyCalories.toLocaleString()}
            icon={<Activity className="h-6 w-6 text-fitness-primary" />}
            description={`${workoutStats.weeklyCalories.toLocaleString()} this week`}
          />
        )}
      </div>

      {/* Today's Workout */}
      <h2 className="text-xl font-semibold mb-4">Today's Workout</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {workoutSchedule.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : workoutSchedule.todayWorkout ? (
          <WorkoutCard
            title={workoutSchedule.todayWorkout.name}
            description={workoutSchedule.todayWorkout.description || "Your scheduled workout for today"}
            duration={workoutSchedule.todayWorkout.estimatedDuration}
            exercises={workoutSchedule.todayWorkout.exercises}
            date="Today"
            image="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80"
            onClick={() => navigate('/workouts')}
          />
        ) : (
          <WorkoutCard
            title={selectedWorkout.title}
            description={selectedWorkout.description}
            duration={45}
            exercises={8}
            date="Today"
            image={selectedWorkout.image}
            onClick={() => navigate('/workouts')}
          />
        )}

        <NutritionCard
          calories={nutritionData.current.calories}
          protein={nutritionData.current.protein}
          carbs={nutritionData.current.carbs}
          fat={nutritionData.current.fat}
          target={{
            calories: nutritionData.target?.calories || 2000,
            protein: nutritionData.target?.protein || 150,
            carbs: nutritionData.target?.carbs || 200,
            fat: nutritionData.target?.fat || 60
          }}
          isLoading={nutritionData.isLoading}
          error={nutritionData.error}
          onClick={() => navigate('/meal-plan')}
        />

        {user && <AIWorkoutCard userId={user.id} />}
      </div>

      {/* Workout Progress Statistics */}
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
        {workoutSchedule.isLoading ? (
          <>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </>
        ) : workoutSchedule.upcomingWorkouts.length > 0 ? (
          workoutSchedule.upcomingWorkouts.map(workout => (
            <WorkoutCard
              key={workout.id}
              title={workout.name}
              description={workout.description || `Scheduled workout for ${workout.dayLabel}`}
              duration={workout.estimatedDuration}
              exercises={workout.exercises}
              date={workout.dayLabel}
              image="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
              onClick={() => navigate('/workouts')}
            />
          ))
        ) : (
          <>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
