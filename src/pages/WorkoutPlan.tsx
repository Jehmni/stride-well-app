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
import { TodayWorkoutProps, WorkoutDay, WorkoutExercise, UserWorkout } from "@/components/workout/types";
import { Activity, Calendar, RefreshCw, Bug, Brain } from "lucide-react";
import { generatePersonalizedWorkoutPlan, fetchUserWorkouts } from "@/services/workoutService";
import { regenerateWorkoutPlan } from "@/integrations/ai/workoutAIService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import AIWorkoutDebugger from "@/components/debug/AIWorkoutDebugger";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutPlan } from "@/models/models";

const WorkoutPlanPage: React.FC = () => {
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
  ]);

  useEffect(() => {
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
            );
          }
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

  const getWorkoutImage = (plan: WorkoutPlan | string | null) => {
    if (!plan) return "/placeholder.svg";
    
    // Handle string parameter (for backward compatibility)
    if (typeof plan === 'string') {
      // Default image for string input
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23444' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EWorkout Plan%3C/text%3E%3C/svg%3E";
    }
    
    // Use general fitness images based on the type of workout
    if (plan.title.toLowerCase().includes('strength')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23506' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EStrength Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('cardio')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23056' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3ECardio Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('stretch') || plan.title.toLowerCase().includes('flexibility')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23065' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EFlexibility Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('core')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23905' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3ECore Workout%3C/text%3E%3C/svg%3E";
    }
    
    // Default image
    return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23444' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EWorkout Plan%3C/text%3E%3C/svg%3E";
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
      {/* AI Workout Link Card */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            AI-Powered Workouts
          </CardTitle>
          <CardDescription>
            Generate and manage AI custom workouts for your specific needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="default" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/ai-workouts')}
          >
            <Brain className="w-4 h-4 mr-2" /> View AI Workouts
          </Button>
        </CardContent>
      </Card>
      
      {/* AI Workout Generation Notice */}
      {isGeneratingAIPlan && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Creating your AI workout plan</h3>
          <AIGeneratedNotice />
        </div>
      )}
      
      {/* Regeneration Progress UI */}
      {isRegenerating && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Regenerating Your Workout Plan</h3>
          <div className="mb-2">
            <p className="text-sm text-muted-foreground">{regenerationStatus}</p>
            <Progress value={regenerationProgress} className="h-1 mt-1" />
          </div>
          <AIGeneratedNotice />
        </div>
      )}
      
      {/* AI Generated Notice with Regenerate Button */}
      {!isGeneratingAIPlan && !isRegenerating && isAIGenerated && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-medium mb-2">AI-Powered Workout Plan</h3>
            <AIGeneratedNotice />
          </div>
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
      
      {/* Add AI Workout Debugger in development mode */}
      {import.meta.env.DEV && (
        <div className="mt-8 border-t pt-8">
          <div className="flex items-center mb-4">
            <Bug className="mr-2 h-5 w-5" />
            <h2 className="text-xl font-semibold">AI Workout Plan Debugger</h2>
          </div>
          <p className="text-gray-500 mb-4">This debugger helps diagnose issues with AI workout plan generation.</p>
          <AIWorkoutDebugger />
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutPlanPage;
