import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Dumbbell, Loader2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types for workout data
interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  weekly_structure: WorkoutDay[];
  exercises: WorkoutExercise[];
}

const WorkoutPlan: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<{
    title: string;
    description: string;
    duration: number;
    exercises: number;
    date: string;
    image: string;
  } | null>(null);
  
  // Fetch workout plan based on user's fitness goal
  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Get workout plan for the user's fitness goal
        const { data, error } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('fitness_goal', profile.fitness_goal)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setWorkoutPlan(data);
          
          // Set today's workout based on day of week
          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const todayWorkoutData = data.weekly_structure[today];
          
          setTodayWorkout({
            title: todayWorkoutData.focus,
            description: `Focus on ${todayWorkoutData.focus.toLowerCase()} exercises for optimal results`,
            duration: todayWorkoutData.duration,
            exercises: Math.floor(Math.random() * 3) + 4, // Random number between 4-6
            date: "Today",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          });
        }
      } catch (error: any) {
        console.error("Error fetching workout plan:", error);
        toast.error("Failed to load your workout plan");
        
        // Fallback to a default plan if fetch fails
        setWorkoutPlan({
          id: "default",
          title: "General Fitness Program",
          description: "Well-rounded approach to improve overall fitness and health",
          fitness_goal: "general-fitness",
          weekly_structure: [
            { day: "Monday", focus: "Full Body Strength", duration: 45 },
            { day: "Tuesday", focus: "Cardio & Mobility", duration: 40 },
            { day: "Wednesday", focus: "Core & Balance", duration: 30 },
            { day: "Thursday", focus: "Rest or Light Activity", duration: 20 },
            { day: "Friday", focus: "Full Body Circuit", duration: 45 },
            { day: "Saturday", focus: "Cardio & Flexibility", duration: 40 },
            { day: "Sunday", focus: "Rest Day", duration: 0 }
          ],
          exercises: [
            { name: "Dumbbell Squat", sets: 3, reps: "12-15", muscle: "Legs" },
            { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
            { name: "Dumbbell Row", sets: 3, reps: "12 each arm", muscle: "Back" },
            { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" },
            { name: "Walking Lunges", sets: 2, reps: "10 each leg", muscle: "Legs" },
            { name: "Jumping Jacks", sets: 3, reps: "45 seconds", muscle: "Cardio" }
          ]
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutPlan();
  }, [profile]);
  
  // Function to mark a workout as completed
  const completeWorkout = async () => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('completed_workouts')
        .insert({
          user_id: profile.id,
          workout_title: todayWorkout?.title,
          duration: todayWorkout?.duration,
          completed_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast.success("Workout marked as completed!");
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2">Loading your workout plan...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!workoutPlan) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workout plan found for your fitness goal.
          </p>
          <Button onClick={() => navigate("/profile")}>
            Update Your Fitness Goal
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workout Plans">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{workoutPlan.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {workoutPlan.description}
        </p>
        
        <div className="bg-fitness-primary bg-opacity-10 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Weekly Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {workoutPlan.weekly_structure.map((day, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  new Date().getDay() === (index + 1) % 7 ? 
                  'border-fitness-primary bg-fitness-primary bg-opacity-5' : 
                  'border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="font-medium">{day.day}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{day.focus}</p>
                {day.duration > 0 ? (
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{day.duration} mins</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">Rest Day</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Dumbbell className="mr-2 h-5 w-5" />
            Key Exercises
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Exercise</th>
                  <th className="py-3 px-4 text-left">Sets</th>
                  <th className="py-3 px-4 text-left">Reps</th>
                  <th className="py-3 px-4 text-left">Target Muscle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {workoutPlan.exercises.map((exercise, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">{exercise.name}</td>
                    <td className="py-3 px-4">{exercise.sets}</td>
                    <td className="py-3 px-4">{exercise.reps}</td>
                    <td className="py-3 px-4">{exercise.muscle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {todayWorkout && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Today's Workout
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkoutCard
              title={todayWorkout.title}
              description={todayWorkout.description}
              duration={todayWorkout.duration}
              exercises={todayWorkout.exercises}
              date={todayWorkout.date}
              image={todayWorkout.image}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="text-lg font-medium mb-4">Ready to start?</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete this workout to track your progress and stay on track with your fitness goals.
              </p>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={completeWorkout}
                >
                  Mark as Completed <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/progress")}
                >
                  View Your Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutPlan;
