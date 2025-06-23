import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WorkoutStats {
  totalCount: number;
  weeklyCount: number;
  previousWeekCount: number;
  weeklyPercentChange: number;
  isPositive: boolean;
  totalCalories: number;
  weeklyCalories: number;
  dailyCalories: number;
  isLoading: boolean;
  error: string | null;
}

export const useWorkoutStats = (userId: string | undefined): WorkoutStats => {
  const [stats, setStats] = useState<WorkoutStats>({
    totalCount: 0,
    weeklyCount: 0,
    previousWeekCount: 0,
    weeklyPercentChange: 0,
    isPositive: false,
    totalCalories: 0,
    weeklyCalories: 0,
    dailyCalories: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchWorkoutStats = async () => {
      if (!userId) {
        setStats(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get the current date and calculate the start of this week and last week
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Current week (Sunday to Saturday)
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        
        // Previous week
        const previousWeekStart = new Date(currentWeekStart);
        previousWeekStart.setDate(previousWeekStart.getDate() - 7);
        
        const previousWeekEnd = new Date(currentWeekStart);
        previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);

        // Format dates for Supabase query
        const todayStr = today.toISOString();
        const currentWeekStartStr = currentWeekStart.toISOString();
        const previousWeekStartStr = previousWeekStart.toISOString();
        const previousWeekEndStr = previousWeekEnd.toISOString();        // Total completed workouts (using end_time as completion indicator)
        const { count: totalCount, error: totalError } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('end_time', 'is', null);

        if (totalError) throw totalError;

        // Workouts completed this week
        const { count: weeklyCount, error: weeklyError } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('end_time', 'is', null)
          .gte('date', currentWeekStartStr);

        if (weeklyError) throw weeklyError;

        // Workouts completed last week
        const { count: previousWeekCount, error: prevWeekError } = await supabase
          .from('workout_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('end_time', 'is', null)
          .gte('date', previousWeekStartStr)
          .lte('date', previousWeekEndStr);

        if (prevWeekError) throw prevWeekError;

        // Calculate percentage change
        const weeklyPercentChange = previousWeekCount > 0 
          ? Math.round(((weeklyCount - previousWeekCount) / previousWeekCount) * 100) 
          : (weeklyCount > 0 ? 100 : 0);
        
        const isPositive = weeklyCount >= previousWeekCount;

        // Get total calories burned
        const { data: caloriesData, error: caloriesError } = await supabase
          .from('workout_logs')
          .select('calories_burned')
          .eq('user_id', userId);

        if (caloriesError) throw caloriesError;

        const totalCalories = caloriesData.reduce((sum, log) => 
          sum + (log.calories_burned || 0), 0);

        // Calories burned this week
        const { data: weeklyCaloriesData, error: weeklyCaloriesError } = await supabase
          .from('workout_logs')
          .select('calories_burned')
          .eq('user_id', userId)
          .gte('completed_at', currentWeekStartStr);

        if (weeklyCaloriesError) throw weeklyCaloriesError;

        const weeklyCalories = weeklyCaloriesData.reduce((sum, log) => 
          sum + (log.calories_burned || 0), 0);

        // Calories burned today
        const { data: dailyCaloriesData, error: dailyCaloriesError } = await supabase
          .from('workout_logs')
          .select('calories_burned')
          .eq('user_id', userId)
          .gte('completed_at', todayStr);

        if (dailyCaloriesError) throw dailyCaloriesError;

        const dailyCalories = dailyCaloriesData.reduce((sum, log) => 
          sum + (log.calories_burned || 0), 0);

        // Update state with all fetched data
        setStats({
          totalCount: totalCount || 0,
          weeklyCount: weeklyCount || 0,
          previousWeekCount: previousWeekCount || 0,
          weeklyPercentChange,
          isPositive,
          totalCalories,
          weeklyCalories,
          dailyCalories,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching workout stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load workout statistics'
        }));
      }
    };

    fetchWorkoutStats();
  }, [userId]);

  return stats;
}; 