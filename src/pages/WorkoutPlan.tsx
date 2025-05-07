
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutPlanHeader from "@/components/workout/WorkoutPlanHeader";
import WeeklyStructure from "@/components/workout/WeeklyStructure";
import KeyExercises from "@/components/workout/KeyExercises";
import TodayWorkout from "@/components/workout/TodayWorkout";
import CustomWorkoutList from "@/components/workout/CustomWorkoutList";
import AIGeneratedNotice from "@/components/common/AIGeneratedNotice";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TodayWorkoutProps, WorkoutDay, WorkoutExercise, UserWorkout, WorkoutPlan as WorkoutPlanType } from "@/components/workout/types";
import { Activity, Calendar, RefreshCw } from "lucide-react";
import { generatePersonalizedWorkoutPlan, fetchUserWorkouts } from "@/services/workoutService";
import { regenerateWorkoutPlan } from "@/integrations/ai/workoutAIService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const WorkoutPlan: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isGeneratingAIPlan, setIsGeneratingAIPlan] = useState<boolean>(false);
  const [isAIGenerated, setIsAIGenerated] = useState<boolean>(false);
  const [regenerationProgress, setRegenerationProgress] = useState<number>(0);
  const [regenerationStatus, setRegenerationStatus] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [todayWorkout, setTodayWorkout] = useState<TodayWorkoutProps>({
    title: "Loading workout...",
    description: "Please wait",
    duration: 0,
    exercises: 0,
    date: "Today",
    image: ""
  });
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [weeklyStructure, setWeeklyStructure] = useState<WorkoutDay[]>([
    { day: "Monday", focus: "Upper Body", duration: 45 },
    { day: "Tuesday", focus: "Lower Body", duration: 45 },
    { day: "Wednesday", focus: "Cardio", duration: 30 },
    { day: "Thursday", focus: "Core", duration: 30 },
    { day: "Friday", focus: "Full Body", duration: 45 },
    { day: "Saturday", focus: "Active Recovery", duration: 30 },
    { day: "Sunday", focus: "Rest", duration: 0 }
  ]);
  const [keyExercises, setKeyExercises] = useState<WorkoutExercise[]>([
    { name: "Squats", sets: 3, reps: "10-12", muscle: "Legs" },
    { name: "Bench Press", sets: 3, reps: "8-10", muscle: "Chest" },
    { name: "Deadlifts", sets: 3, reps: "6-8", muscle: "Back" },
    { name: "Shoulder Press", sets: 3, reps: "8-10", muscle: "Shoulders" },
    { name: "Pull-ups", sets: 3, reps: "Max", muscle: "Back" }
  ]);  useEffect(() => {
    if (profile) {
      // Load personalized workout plan using the AI-driven service
      const loadWorkoutPlan = async () => {
        try {
          setIsGeneratingAIPlan(true);
          console.log("Generating personalized workout plan for user profile:", profile.id);
          
          // Fetch personalized workout plan from the service
          const workoutPlan = await generatePersonalizedWorkoutPlan(profile);
          
          // Always set isGeneratingAIPlan to false once we have a response
          setIsGeneratingAIPlan(false);
          
          if (workoutPlan) {
            console.log("Received workout plan:", workoutPlan);
            
            // Check if the plan was AI-generated
            setIsAIGenerated(workoutPlan.ai_generated === true);
            
            // Update weekly structure state
            if (Array.isArray(workoutPlan.weekly_structure) && workoutPlan.weekly_structure.length > 0) {
              setWeeklyStructure(workoutPlan.weekly_structure);
            } else {
              console.warn("Invalid weekly_structure format received:", workoutPlan.weekly_structure);
            }
            
            // Update key exercises state
            if (Array.isArray(workoutPlan.exercises) && workoutPlan.exercises.length > 0) {
              setKeyExercises(workoutPlan.exercises);
            } else {
              console.warn("Invalid exercises format received:", workoutPlan.exercises);
            }
            
            // Get today's day of the week (0-6, starting with Sunday)
            const today = new Date().getDay();
            // Adjust to match our weekly structure (starting with Monday)
            const todayIndex = today === 0 ? 6 : today - 1;
            
            if (workoutPlan.weekly_structure && workoutPlan.weekly_structure[todayIndex]) {
              const todaysWorkout = workoutPlan.weekly_structure[todayIndex];
              // Get an image based on workout focus
              const workoutImage = getWorkoutImage(todaysWorkout.focus);
              
              // Define today's workout based on the personalized plan
              setTodayWorkout({
                title: `${todaysWorkout.focus} Workout`,
                description: `${workoutPlan.description || 'Personalized workout plan'} - Focused on ${todaysWorkout.focus.toLowerCase()}`,
                duration: todaysWorkout.duration || 30,
                exercises: Array.isArray(workoutPlan.exercises) ? Math.min(8, workoutPlan.exercises.length) : 0,
                date: "Today",
                image: workoutImage
              });
            } else {
              console.warn("Could not find today's workout in weekly structure");
              // Fallback workout if today's workout is missing
              setTodayWorkout(
                workoutByGoal[profile.fitness_goal as keyof typeof workoutByGoal] || workoutByGoal["general-fitness"]
              );
            }
          } else {
            console.warn("Failed to generate workout plan, falling back to default");
            // Fallback workout if plan generation fails
            setIsAIGenerated(false);
            setTodayWorkout(
              workoutByGoal[profile.fitness_goal as keyof typeof workoutByGoal] || workoutByGoal["general-fitness"]
            );          }
        } catch (error) {
          console.error("Error loading workout plan:", error);
          setIsGeneratingAIPlan(false);
          toast.error("Error loading your workout plan. Using default workout instead.");
          // Set fallback workout in case of error
          setTodayWorkout(
            workoutByGoal[profile.fitness_goal as keyof typeof workoutByGoal] || workoutByGoal["general-fitness"]
          );
        }
      };

      loadWorkoutPlan();
      
      // Fetch user's custom workouts
      if (user?.id) {
        fetchUserWorkouts(user.id).then(workouts => {
          setUserWorkouts(workouts);
        }).catch(error => {
          console.error("Error fetching workouts:", error);
        });
      }
    }
  }, [profile, user?.id]);

  // Define workout image helper function
  const getWorkoutImage = (focus: string): string => {
    const focusLower = focus.toLowerCase();
    if (focusLower.includes('upper') || focusLower.includes('chest') || focusLower.includes('arms')) {
      return "/assets/images/upper-body.jpg";
    } else if (focusLower.includes('lower') || focusLower.includes('leg')) {
      return "/assets/images/lower-body.jpg";
    } else if (focusLower.includes('core') || focusLower.includes('ab')) {
      return "/assets/images/core-workout.jpg";
    } else if (focusLower.includes('cardio')) {
      return "/assets/images/cardio.jpg";
    } else if (focusLower.includes('full')) {
      return "/assets/images/full-body.jpg";
    } else if (focusLower.includes('recovery') || focusLower.includes('rest')) {
      return "/assets/images/recovery.jpg";
    }
    return "/assets/images/workout-generic.jpg";
  };

  // Define workout by goal mapping
  const workoutByGoal = {
    "weight-loss": {
      title: "High-Intensity Fat Burning",
      description: "A high-intensity workout designed to maximize calorie burn",
      duration: 45,
      exercises: 8,
      date: "Today",
      image: "/assets/images/weight-loss.jpg"
    },
    "muscle-gain": {
      title: "Strength & Hypertrophy",
      description: "Focus on progressive overload to build muscle mass",
      duration: 60,
      exercises: 6,
      date: "Today",
      image: "/assets/images/muscle-gain.jpg"
    },
    "general-fitness": {
      title: "Full Body Conditioning",
      description: "Balanced workout to improve overall fitness and health",
      duration: 40,
      exercises: 7,
      date: "Today",
      image: "/assets/images/general-fitness.jpg"
    },
    "endurance": {
      title: "Endurance Training",
      description: "Boost your stamina and cardiovascular health",
      duration: 50,
      exercises: 5,
      date: "Today",
      image: "/assets/images/endurance.jpg"
    }
  };

  const handleSelectWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
      
      if (error) throw error;
      
      // Update state after successful deletion
      setUserWorkouts(userWorkouts.filter(workout => workout.id !== workoutId));
      if (selectedWorkout === workoutId) {
        setSelectedWorkout(null);
      }
    } catch (error) {
      console.error("Error deleting workout:", error);
    }
  };

  const handleWorkoutCreated = (workout: UserWorkout) => {
    setUserWorkouts([...userWorkouts, workout]);
  };
  return (
    <DashboardLayout title="Workout Plan">
      {/* AI Workout Generation Notice */}
      {isGeneratingAIPlan && (
        <AIGeneratedNotice 
          title="Creating your AI workout plan" 
          isGenerating={true} 
        />
      )}      {/* Regeneration Progress UI */}
      {isRegenerating && (
        <AIGeneratedNotice
          title="Regenerating Your Workout Plan"
          isGenerating={true}
          progress={regenerationProgress}
          statusMessage={regenerationStatus}
          type="workout"
        />
      )}
      
      {/* AI Generated Notice with Regenerate Button */}
      {!isGeneratingAIPlan && !isRegenerating && isAIGenerated && (
        <div className="flex items-center justify-between">
          <AIGeneratedNotice title="AI-Powered Workout Plan" />
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
            onClick={async () => {
              if (profile && user?.id) {
                // Prevent multiple regeneration attempts
                if (isRegenerating) return;
                
                setIsRegenerating(true);
                toast.info("Regenerating your AI workout plan...");
                
                try {
                  const success = await regenerateWorkoutPlan(
                    user.id,
                    (message, progress) => {
                      setRegenerationStatus(message);
                      setRegenerationProgress(progress);
                    }
                  );
                  
                  if (success) {
                    toast.success("Workout plan regenerated successfully!");
                    // Reload the page to show the new plan
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
                    toast.error("Failed to regenerate workout plan. Please try again.");
                    setIsRegenerating(false);
                  }
                } catch (error) {
                  console.error("Error regenerating workout plan:", error);
                  toast.error("An error occurred while regenerating your workout plan");
                  setIsRegenerating(false);
                }
              }
            }}
            disabled={isRegenerating}
          >
            <RefreshCw className={`h-3 w-3 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate Plan'}
          </Button>
        </div>
      )}
      
      {/* Quick link to progress tracking */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">
          Follow your personalized workout plan designed to help you reach your fitness goals.
        </p>
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={() => navigate("/progress")}
        >
          <Activity className="h-4 w-4 mr-2" />
          View Progress
        </Button>
      </div>

      <WorkoutPlanHeader
        fitnessGoal={profile?.fitness_goal || "general-fitness"}
      />
      
      <TodayWorkout 
        todayWorkout={todayWorkout}
        userId={user?.id}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <WeeklyStructure weeklyStructure={weeklyStructure} />
        <KeyExercises exercises={keyExercises} />
      </div>
      
      <CustomWorkoutList 
        userId={user?.id} 
        userWorkouts={userWorkouts}
        selectedWorkout={selectedWorkout}
        onSelectWorkout={handleSelectWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onWorkoutCreated={handleWorkoutCreated}
      />
    </DashboardLayout>
  );
};

export default WorkoutPlan;
