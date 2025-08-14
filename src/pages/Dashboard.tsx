import React, { useState, useEffect } from "react";
import { Activity, ChevronRight, Dumbbell, Utensils, Weight, Target, TrendingUp, Heart, Calendar, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import NutritionCard from "@/components/dashboard/NutritionCard";
import AIWorkoutCard from "@/components/dashboard/AIWorkoutCard";
import StatsCard from "@/components/dashboard/StatsCard";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import RemindersWidget from "@/components/dashboard/RemindersWidget";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";
import { generatePersonalizedWorkoutPlan } from "@/services/workoutService";
import { useWorkoutStats } from "@/hooks/useWorkoutStats";
import { useWorkoutSchedule } from "@/hooks/useWorkoutSchedule";
import { useNutrition } from "@/hooks/useNutrition";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return 'from-blue-500 to-blue-600';
    if (bmi < 25) return 'from-green-500 to-green-600';
    if (bmi < 30) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getBMIBadgeVariant = (bmi: number): "default" | "secondary" | "destructive" => {
    if (bmi < 18.5) return "secondary";
    if (bmi < 25) return "default";
    if (bmi < 30) return "secondary";
    return "destructive";
  };

  return (
    <DashboardLayout title="Dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full self-start">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome back, {firstName}! 👋
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg">
                Here's an overview of your fitness journey today.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 dark:text-blue-400">
            <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Ready to crush your fitness goals?</span>
          </div>
        </motion.div>

        {/* Health Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {workoutStats.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <Dumbbell className="h-6 w-6 sm:h-8 sm:w-8 text-blue-200" />
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                  Total
                </Badge>
              </div>
              <h3 className="text-xs sm:text-sm font-medium text-blue-100 mb-1 sm:mb-2">Workouts Completed</h3>
              <div className="text-2xl sm:text-3xl font-bold mb-1">
                {workoutStats.totalCount || 0}
              </div>
              <p className="text-blue-200 text-xs sm:text-sm">Keep up the great work!</p>
            </motion.div>
          )}

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <Weight className="h-6 w-6 sm:h-8 sm:w-8 text-green-200" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-xs">
                Current
              </Badge>
            </div>
            <h3 className="text-xs sm:text-sm font-medium text-green-100 mb-1 sm:mb-2">Current Weight</h3>
            <div className="text-2xl sm:text-3xl font-bold mb-1">
              {profile?.weight || "--"} kg
            </div>
            <p className="text-green-200 text-xs sm:text-sm">Track your progress</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-br ${userBMI ? getBMIColor(userBMI) : 'from-gray-500 to-gray-600'} text-white p-6 rounded-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-white/80" />
              <Badge 
                variant={userBMI ? getBMIBadgeVariant(userBMI) : "secondary"} 
                className="bg-white/20 text-white border-white/30"
              >
                BMI
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-2">Body Mass Index</h3>
            <div className="text-3xl font-bold mb-1">
              {userBMI ? userBMI.toFixed(1) : "--"}
            </div>
            {userBMI && (
              <p className="text-white/80 text-sm capitalize">
                {getBMICategory(userBMI)}
              </p>
            )}
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="h-8 w-8 text-purple-200" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Goal
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-purple-100 mb-2">Fitness Goal</h3>
            <div className="text-xl font-bold mb-1 capitalize">
              {profile?.fitness_goal ? profile.fitness_goal.replace('-', ' ') : 'General Fitness'}
            </div>
            <p className="text-purple-200 text-sm">Stay focused!</p>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left Column - Workout & AI */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 space-y-4 sm:space-y-6"
          >
            {/* Personalized Workout */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    Today's Workout
                  </h3>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 self-start text-xs">
                    AI Generated
                  </Badge>
                </div>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 sm:h-20 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <img
                        src={selectedWorkout.image}
                        alt="Workout"
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">
                          {selectedWorkout.title}
                        </h4>
                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-2">
                          {selectedWorkout.description}
                        </p>
                        <Button
                          onClick={() => navigate('/workouts')}
                          className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white h-8 sm:h-auto text-sm sm:text-base px-3 sm:px-4 touch-manipulation"
                        >
                          Start Workout
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Workout Statistics */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Workout Statistics
                </h3>
                <WorkoutStatistics />
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Nutrition & Reminders */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Nutrition Card */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-green-600" />
                  Nutrition
                </h3>
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
              </div>
            </motion.div>

            {/* Reminders Widget */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  Upcoming Reminders
                </h3>
                <RemindersWidget />
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/ai-workouts/generate')}
                  variant="outline"
                  className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Zap className="mr-2 h-4 w-4 text-blue-600" />
                  Generate AI Workout
                </Button>
                <Button
                  onClick={() => navigate('/progress')}
                  variant="outline"
                  className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <TrendingUp className="mr-2 h-4 w-4 text-green-600" />
                  View Progress
                </Button>
                <Button
                  onClick={() => navigate('/profile')}
                  variant="outline"
                  className="w-full justify-start bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Target className="mr-2 h-4 w-4 text-purple-600" />
                  Update Profile
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Dashboard;
