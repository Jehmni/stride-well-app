// Update Dashboard.tsx to use correct props for StatsCard
// We'll focus on just fixing the type issues without changing functionality

import React, { useState, useEffect } from 'react';
import { Calendar, Dumbbell, Target, Clock } from 'lucide-react';
import { StatsCard } from "@/components/dashboard/StatsCard";
import { TodayWorkout } from "@/components/workout/TodayWorkout";
import { NutritionCard } from "@/components/dashboard/NutritionCard";
import { WorkoutCard } from "@/components/dashboard/WorkoutCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface WorkoutStats {
  total_workouts: number;
  recent_workouts: number;
  total_duration: number;
  avg_duration: number;
  last_workout_date: string | null;
  current_streak: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WorkoutStats>({
    total_workouts: 0,
    recent_workouts: 0,
    total_duration: 0,
    avg_duration: 0,
    last_workout_date: null,
    current_streak: 0
  });
  const [todayWorkout, setTodayWorkout] = useState<{
    title: string;
    description: string;
    duration: number;
    exercises: string[];
    date: string;
    image: string;
  } | null>(null);
  const [userProfile, setUserProfile] = useState<{ fitness_goal: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Update this function to ensure it returns the correct format
  const fetchWorkoutStats = async (userId: string) => {
    try {
      // Simulate fetching workout stats from the database
      // Replace this with your actual Supabase query
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading

      // Dummy data for demonstration
      const totalWorkouts = 50;
      const recentWorkouts = 5;
      const totalDuration = 2500;
      const averageDuration = totalWorkouts > 0 ? Math.floor(totalDuration / totalWorkouts) : 0;
      const lastWorkoutDate = new Date().toLocaleDateString();
      const currentStreak = 7;

      // Update the stats data structure to match expected format
      // Make sure we're using the property names expected by the state
      setStats({
        total_workouts: totalWorkouts,
        recent_workouts: recentWorkouts,
        total_duration: totalDuration,
        avg_duration: averageDuration,
        last_workout_date: lastWorkoutDate,
        current_streak: currentStreak
      });
    } catch (error) {
      console.error("Error fetching workout stats:", error);
    }
  };

  const fetchTodayWorkout = async () => {
    // Simulate fetching today's workout from the database
    // Replace this with your actual Supabase query
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading

    // Dummy data for demonstration
    setTodayWorkout({
      title: "Full Body Blast",
      description: "A high-intensity workout targeting all major muscle groups.",
      duration: 45,
      exercises: ["Squats", "Push-ups", "Plank", "Lunges", "Burpees"],
      date: new Date().toLocaleDateString(),
      image: "/images/full-body.jpg"
    });
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('fitness_goal')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchWorkoutStats(user.id),
        fetchTodayWorkout(),
        fetchUserProfile(user.id)
      ]).then(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:text-3xl sm:truncate">
            Dashboard
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Share
          </button>
          <button
            type="button"
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Fix the props to match what StatsCard expects */}
        <StatsCard 
          title="Workouts Completed" 
          value={stats.total_workouts} 
          icon={<Dumbbell className="h-5 w-5" />}
          trend={stats.recent_workouts > 0 ? "up" : "neutral"}
          trendValue={`${stats.recent_workouts} this week`}
          loading={loading}
        />
        
        <StatsCard 
          title="Fitness Goal" 
          value={userProfile?.fitness_goal ? 50 : 0}
          icon={<Target className="h-5 w-5" />}
          trend="neutral"
          trendValue={userProfile?.fitness_goal || "Not set"}
          loading={loading}
        />
        
        <StatsCard 
          title="Total Minutes" 
          value={stats.total_duration} 
          icon={<Clock className="h-5 w-5" />}
          trend="neutral"
          trendValue={`${stats.avg_duration} avg/workout`}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Fix TodayWorkout props */}
        {user && todayWorkout ? (
          <div className="md:col-span-2">
            <TodayWorkout 
              todayWorkout={todayWorkout} 
              userId={user.id} 
            />
          </div>
        ) : (
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Today's Workout
              </h3>
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
              </div>
            </div>
          </div>
        )}

        {/* Fix NutritionCard props */}
        <div>
          {userProfile && (
            <NutritionCard
              calories={{ current: 1800, target: 2200 }}
              protein={{ current: 120, target: 150 }}
              carbs={{ current: 180, target: 220 }}
              fat={{ current: 60, target: 70 }}
              target={userProfile.fitness_goal}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h3 className="text-xl font-semibold mb-4">Upcoming Workouts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {loading ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <LoadingSpinner />
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <LoadingSpinner />
                </div>
              </>
            ) : (
              <>
                <WorkoutCard
                  title="Leg Day"
                  description="Focus on quadriceps and hamstrings"
                  duration={60}
                  exercises={["Squats", "Lunges", "Leg Press"]}
                  date="Tomorrow"
                  image="/images/leg-day.jpg"
                />
                <WorkoutCard
                  title="Upper Body"
                  description="Chest, shoulders and back workout"
                  duration={45}
                  exercises={["Bench Press", "Shoulder Press", "Pull-ups"]}
                  date="Thursday"
                  image="/images/upper-body.jpg"
                />
              </>
            )}
          </div>
        </div>
        
        <div className="md:col-span-1">
          <h3 className="text-xl font-semibold mb-4">Activity Feed</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <p className="text-gray-600 dark:text-gray-400">
              No recent activity. Start working out to see your progress here!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
