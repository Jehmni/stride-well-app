
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from 'date-fns';
import { Dumbbell, Calendar, BarChart2, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

import TodayWorkout from "@/components/workout/TodayWorkout";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import NutritionCard from "@/components/dashboard/NutritionCard";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import StatsCard from "@/components/dashboard/StatsCard";

import { fetchUserWorkouts } from "@/services/workoutService";
import { getUserWorkoutStatistics } from "@/services/workoutService";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [stats, setStats] = useState({
    total_workouts: 0,
    recent_workouts: 0,
    total_duration: 0,
    avg_duration: 0,
    last_workout_date: null,
    current_streak: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch user's workouts
        const userWorkouts = await fetchUserWorkouts(user.id);
        setWorkouts(userWorkouts);
        
        // Fetch workout statistics
        const workoutStats = await getUserWorkoutStatistics(user.id);
        setStats(workoutStats);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Calculate user's BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  const bmiCategory = userBMI ? getBMICategory(userBMI) : null;

  // Format the last workout date
  const formattedLastWorkoutDate = stats.last_workout_date 
    ? format(new Date(stats.last_workout_date), 'PPP')
    : 'No workouts yet';

  // Calculate completion percentage for this month
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDate = new Date().getDate();
  const expectedWorkoutsThisMonth = Math.min(currentDate, daysInMonth);
  const completionPercentage = expectedWorkoutsThisMonth > 0 
    ? Math.min(Math.round((stats.recent_workouts / expectedWorkoutsThisMonth) * 100), 100) 
    : 0;

  const handleViewAllProgress = () => {
    navigate('/progress');
  };

  return (
    <DashboardLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="Workout Streak"
          value={stats.current_streak}
          unit="days"
          icon={<Calendar className="h-5 w-5" />}
          trend="up"
          trendValue="2"
          loading={isLoading}
        />
        
        <StatsCard
          title="Workouts This Month"
          value={stats.recent_workouts}
          icon={<Dumbbell className="h-5 w-5" />}
          subtitle={`${completionPercentage}% of goal`}
          progress={completionPercentage}
          loading={isLoading}
        />
        
        <StatsCard
          title="Avg. Workout Time"
          value={stats.avg_duration}
          unit="min"
          icon={<BarChart2 className="h-5 w-5" />}
          trend="up"
          trendValue="5"
          loading={isLoading}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Workout */}
          <TodayWorkout />
          
          {/* Workout Statistics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-medium">Workout Statistics</CardTitle>
                <CardDescription>Your fitness activity overview</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleViewAllProgress}>
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <WorkoutStatistics />
            </CardContent>
          </Card>
          
          {/* Nutrition Card */}
          <NutritionCard />
        </div>
        
        <div className="space-y-6">
          {/* User Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Profile Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || ''} alt={profile?.first_name || 'User'} />
                <AvatarFallback className="text-lg">
                  {profile?.first_name ? profile?.first_name[0] : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <h3 className="mt-4 text-xl font-semibold">
                {profile?.first_name 
                  ? `${profile.first_name} ${profile.last_name || ''}`
                  : 'Welcome!'
                }
              </h3>
              
              <Badge className="mt-2 font-normal">
                {profile?.fitness_goal === 'weight-loss' 
                  ? 'Weight Loss' 
                  : profile?.fitness_goal === 'muscle-gain' 
                    ? 'Muscle Gain' 
                    : profile?.fitness_goal === 'endurance' 
                      ? 'Endurance Training' 
                      : 'General Fitness'
                }
              </Badge>
              
              <Separator className="my-4" />
              
              <div className="w-full grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Weight</p>
                  <p className="text-lg font-medium">{profile?.weight || '--'} kg</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Height</p>
                  <p className="text-lg font-medium">{profile?.height || '--'} cm</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="w-full">
                <div className="flex justify-between mb-2">
                  <span className="text-sm">BMI</span>
                  <span className="text-sm font-medium">
                    {userBMI ? `${userBMI.toFixed(1)} - ${bmiCategory}` : '--'}
                  </span>
                </div>
                {userBMI && (
                  <Progress value={Math.min((userBMI / 40) * 100, 100)} className="h-2" />
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => navigate('/profile')}>
                Edit Profile
              </Button>
            </CardFooter>
          </Card>
          
          {/* Recent Workouts */}
          <WorkoutCard
            title="Last Workout"
            date={formattedLastWorkoutDate}
            loading={isLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
