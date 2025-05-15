import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledWorkout {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number;
  exercises: number;
  dayLabel: string;
  estimatedDuration: number;
}

interface WorkoutSchedule {
  todayWorkout: ScheduledWorkout | null;
  upcomingWorkouts: ScheduledWorkout[];
  isLoading: boolean;
  error: string | null;
}

export const useWorkoutSchedule = (userId: string | undefined): WorkoutSchedule => {
  const [schedule, setSchedule] = useState<WorkoutSchedule>({
    todayWorkout: null,
    upcomingWorkouts: [],
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchWorkoutsSchedule = async () => {
      if (!userId) {
        setSchedule(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Get current day of week (0 = Sunday, 6 = Saturday)
        const today = new Date().getDay();
        
        // Fetch all workouts for the user
        const { data: workouts, error } = await supabase
          .from('workouts')
          .select(`
            id, 
            name, 
            description, 
            day_of_week,
            workout_exercises (
              id
            )
          `)
          .eq('user_id', userId);

        if (error) throw error;

        // Process the workouts to add day labels and count exercises
        const processedWorkouts = workouts.map(workout => {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          // Convert from 1-7 format to 0-6 format if needed
          const normalizedDayOfWeek = workout.day_of_week > 7 ? workout.day_of_week % 7 : workout.day_of_week % 7;
          const dayLabel = normalizedDayOfWeek === today 
            ? 'Today' 
            : normalizedDayOfWeek === (today + 1) % 7 
              ? 'Tomorrow' 
              : dayNames[normalizedDayOfWeek];
          
          // Calculate days until this workout
          let daysUntil = normalizedDayOfWeek - today;
          if (daysUntil <= 0) daysUntil += 7; // Wrap to next week if needed
          
          // Get exercise count
          const exerciseCount = workout.workout_exercises ? workout.workout_exercises.length : 0;
          
          // Estimate duration based on exercise count (approx 5 minutes per exercise)
          const estimatedDuration = exerciseCount * 5 || 30; // Default to 30 mins if no exercises

          return {
            ...workout,
            exercises: exerciseCount,
            dayLabel,
            daysUntil,
            estimatedDuration
          };
        });

        // Find today's workout (day_of_week matches today)
        const todayWorkout = processedWorkouts.find(w => 
          (w.day_of_week % 7) === today
        ) || null;

        // Sort upcoming workouts by days until (exclude today)
        const upcomingWorkouts = processedWorkouts
          .filter(w => (w.day_of_week % 7) !== today)
          .sort((a, b) => a.daysUntil - b.daysUntil)
          .slice(0, 3); // Limit to next 3 workouts

        setSchedule({
          todayWorkout,
          upcomingWorkouts,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Error fetching workout schedule:', error);
        setSchedule(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load workout schedule'
        }));
      }
    };

    fetchWorkoutsSchedule();
  }, [userId]);

  return schedule;
}; 