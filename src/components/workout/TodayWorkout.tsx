
import React from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import { TodayWorkoutProps } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TodayWorkoutComponentProps {
  todayWorkout: TodayWorkoutProps;
  userId: string | undefined;
}

const TodayWorkout: React.FC<TodayWorkoutComponentProps> = ({ todayWorkout, userId }) => {
  const navigate = useNavigate();

  const completeWorkout = async () => {
    if (!userId) return;
    
    try {
      // Insert into workout_logs table
      const { data, error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: userId,
          workout_id: 'today-workout',
          duration: todayWorkout.duration,
          calories_burned: Math.floor(Math.random() * 200) + 200 // Random calories between 200-400
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Workout marked as completed!");
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion");
    }
  };

  return (
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
  );
};

export default TodayWorkout;
