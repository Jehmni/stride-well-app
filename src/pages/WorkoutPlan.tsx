import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutPlanHeader from "@/components/workout/WorkoutPlanHeader";
import WeeklyStructure from "@/components/workout/WeeklyStructure";
import KeyExercises from "@/components/workout/KeyExercises";
import TodayWorkout from "@/components/workout/TodayWorkout";
import CustomWorkoutList from "@/components/workout/CustomWorkoutList";
import WorkoutDetails from "@/components/workout/WorkoutDetails";
import CreateWorkoutForm from "@/components/workout/CreateWorkoutForm";
import AIGeneratedNotice from "@/components/common/AIGeneratedNotice";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { TodayWorkoutProps, WorkoutDay, WorkoutExercise, UserWorkout, WorkoutExerciseDetail } from "@/components/workout/types";
import { 
  Activity, 
  Calendar, 
  RefreshCw, 
  Brain, 
  Play, 
  Target, 
  Clock, 
  TrendingUp,
  Plus,
  Settings,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { generatePersonalizedWorkoutPlan, fetchUserWorkouts } from "@/services/workoutService";
import { regenerateWorkoutPlan } from "@/integrations/ai/workoutAIService";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess, showInfo, showAIWorkoutError, showAIWorkoutSuccess } from "@/utils/notifications";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutPlan } from "@/models/models";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const WorkoutPlanPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  // State Management - Organized by concern
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

  const [activeTab, setActiveTab] = useState<string>("overview");
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDetail[]>([]);
  const [allExercises, setAllExercises] = useState<any[]>([]);
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);

  // Computed values for better performance
  const hasCustomWorkouts = useMemo(() => userWorkouts.length > 0, [userWorkouts]);
  const selectedWorkoutObj = useMemo(() => 
    selectedWorkout ? userWorkouts.find(w => w.id === selectedWorkout) : null, 
    [selectedWorkout, userWorkouts]
  );
  const isTodayWorkoutAvailable = useMemo(() => 
    todayWorkout.title !== "Loading workout..." && todayWorkout.exercises > 0, 
    [todayWorkout]
  );

  // Data fetching effects
  useEffect(() => {
    if (profile) {
      loadWorkoutPlan();
      fetchUserWorkoutsData();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedWorkout) {
      fetchWorkoutExercises(selectedWorkout);
      setActiveTab("exercises");
    }
  }, [selectedWorkout]);

  useEffect(() => {
    fetchAllExercises();
  }, []);

  // Optimized data loading functions
      const loadWorkoutPlan = async () => {
        try {
          setIsGeneratingAIPlan(true);
          const workoutPlan = await generatePersonalizedWorkoutPlan(profile);
          setIsGeneratingAIPlan(false);
          
          if (workoutPlan) {
            setIsAIGenerated(workoutPlan.ai_generated === true);
            
            if (Array.isArray(workoutPlan.weekly_structure) && workoutPlan.weekly_structure.length > 0) {
              setWeeklyStructure(workoutPlan.weekly_structure);
            }
            
            if (Array.isArray(workoutPlan.exercises) && workoutPlan.exercises.length > 0) {
              setKeyExercises(workoutPlan.exercises);
            }
            
        // Update today's workout
            const today = new Date().getDay();
        const adjustedToday = today === 0 ? 6 : today - 1;
        const todayPlan = workoutPlan.weekly_structure?.[adjustedToday];
        
        if (todayPlan) {
              setTodayWorkout({
            title: todayPlan.focus || "Today's Workout",
            description: `Focus on ${todayPlan.focus.toLowerCase()}`,
            duration: todayPlan.duration || 45,
            exercises: workoutPlan.exercises?.length || 0,
                date: "Today",
            image: getWorkoutImage(String(workoutPlan.title || "General Fitness Workout"))
          });
        }
          }
        } catch (error) {
          console.error("Error loading workout plan:", error);
          setIsGeneratingAIPlan(false);
        }
      };

  const fetchUserWorkoutsData = async () => {
    try {
      if (user?.id) {
        const workouts = await fetchUserWorkouts(user.id);
        setUserWorkouts(workouts || []);
      }
    } catch (error) {
      console.error("Error fetching user workouts:", error);
    }
  };

  const fetchAllExercises = async () => {
    try {
      setIsLoadingExercises(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAllExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const fetchWorkoutExercises = async (workoutId: string) => {
    try {
      setIsLoadingExercises(true);
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workoutId)
        .order('order_in_workout', { ascending: true });
      
      if (error) throw error;
      
      // Map the data to ensure proper type compatibility
      const mappedExercises = (data || []).map((exercise: any) => ({
        ...exercise,
        order_in_workout: exercise.order_in_workout || exercise.order_position || 0,
        duration: exercise.duration_seconds || exercise.duration,
        rest_time: exercise.rest_seconds || exercise.rest_time
      }));
      
      setWorkoutExercises(mappedExercises);
    } catch (error) {
      console.error("Error fetching workout exercises:", error);
    } finally {
      setIsLoadingExercises(false);
    }
  };

  const getWorkoutImage = (plan: WorkoutPlan | string | null) => {
    if (!plan) return "/placeholder.svg";
    
    if (typeof plan === 'string') {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23444' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EWorkout Plan%3C/text%3E%3C/svg%3E";
    }
    
    if (plan.title.toLowerCase().includes('strength')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23506' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EStrength Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('cardio')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23056' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3ECardio Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('stretch') || plan.title.toLowerCase().includes('flexibility')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23065' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EFlexibility Workout%3C/text%3E%3C/svg%3E";
    } else if (plan.title.toLowerCase().includes('core')) {
      return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23905' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3ECore Workout%3C/text%3E%3C/svg%3E";
    }
    
    return "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23444' width='500' height='300'/%3E%3Ctext fill='%23fff' font-family='sans-serif' font-size='30' x='50%25' y='50%25' text-anchor='middle'%3EWorkout Plan%3C/text%3E%3C/svg%3E";
  };

  // Event handlers
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
    setSelectedWorkout(workout.id);
  };

  const handleExerciseAdded = (exercise: WorkoutExerciseDetail) => {
    setWorkoutExercises([...workoutExercises, exercise]);
  };

  const handleRemoveExercise = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);
      
      if (error) throw error;
      
      setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error("Error removing exercise:", error);
    }
  };

  const handleStartWorkout = (workoutId: string) => {
    navigate(`/workout-session/${workoutId}`);
  };

  const handleRegeneratePlan = async () => {
    if (profile && user?.id && !isRegenerating) {
                setIsRegenerating(true);
      showInfo("Regenerating your AI workout plan...");
                
                try {
                  const success = await regenerateWorkoutPlan(
                    user.id,
                    (message, progress) => {
                      setRegenerationStatus(message);
                      setRegenerationProgress(progress);
                    }
                  );
                  
                  if (success) {
          showAIWorkoutSuccess("Workout plan regenerated successfully!");
                    setTimeout(() => window.location.reload(), 1500);
                  } else {
          showAIWorkoutError("Failed to regenerate workout plan. Please try again.");
                    setIsRegenerating(false);
                  }
                } catch (error) {
                  console.error("Error regenerating workout plan:", error);
        showAIWorkoutError("An error occurred while regenerating your workout plan");
                  setIsRegenerating(false);
                }
              }
  };

  return (
    <DashboardLayout title="Workout Plan">
      {/* Hero Section - Primary Action Area */}
      <div className="mb-8">
                        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 rounded-xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Ready to crush your goals?</h1>
              <p className="text-blue-100">Your personalized workout plan is ready to go</p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Target className="w-3 h-3 mr-1" />
                {profile?.fitness_goal || "General Fitness"}
              </Badge>
            </div>
          </div>
          
                     {/* Primary Action Buttons */}
           <div className="flex flex-col sm:flex-row gap-3">
             {isTodayWorkoutAvailable && (
                                       <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-white to-orange-50 text-blue-600 hover:from-orange-50 hover:to-white font-semibold shadow-lg"
                          onClick={() => navigate("/today-workout")}
                        >
                 <Play className="w-5 h-5 mr-2" />
                 Start Today's Workout
          </Button>
             )}
        <Button 
          variant="outline" 
               size="lg"
               className="border-white/30 text-white hover:bg-gradient-to-r hover:from-white/20 hover:to-orange-500/20 bg-white/10 shadow-lg"
          onClick={() => navigate("/progress")}
        >
               <TrendingUp className="w-5 h-5 mr-2" />
          View Progress
        </Button>
           </div>
        </div>
      </div>

      {/* AI Status Banner */}
      {(isGeneratingAIPlan || isRegenerating || isAIGenerated) && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {isGeneratingAIPlan && "Creating your AI workout plan..."}
                    {isRegenerating && "Regenerating your workout plan..."}
                    {!isGeneratingAIPlan && !isRegenerating && isAIGenerated && "AI-Powered Workout Plan"}
                  </span>
                </div>
                {isRegenerating && (
                  <div className="flex items-center space-x-2">
                    <Progress value={regenerationProgress} className="w-20 h-2" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                      {regenerationProgress}%
                    </span>
                  </div>
                )}
              </div>
              
              {!isGeneratingAIPlan && !isRegenerating && isAIGenerated && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegeneratePlan}
                  disabled={isRegenerating}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              )}
            </div>
            
            {isRegenerating && regenerationStatus && (
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                {regenerationStatus}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <TabsTrigger 
            value="overview" 
            className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="custom" 
            className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Custom</span>
          </TabsTrigger>
          {selectedWorkout && (
            <TabsTrigger 
              value="exercises" 
              className="flex items-center space-x-2 data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300"
            >
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        {/* Overview Tab - AI Workouts & Plan */}
        <TabsContent value="overview" className="space-y-6">
          {/* Today's Workout Card */}
          <Card className="border-2 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span>Today's Workout</span>
                <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                  Recommended
                </Badge>
              </CardTitle>
              <CardDescription>
                Your AI-generated workout for today
              </CardDescription>
            </CardHeader>
            <CardContent>
      <TodayWorkout 
        todayWorkout={todayWorkout}
        userId={user?.id}
      />
            </CardContent>
          </Card>

          {/* Weekly Plan & Key Exercises */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <span>Weekly Plan</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Your 7-day workout structure
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
        <WeeklyStructure weeklyStructure={weeklyStructure} />
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
              <CardContent className="p-6">
        <KeyExercises exercises={keyExercises} />
              </CardContent>
            </Card>
          </div>

          {/* AI Workouts Link */}
          <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-orange-50 dark:from-blue-950 dark:via-purple-950 dark:to-orange-950 border-blue-200 dark:border-blue-800 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      AI-Powered Workouts
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Generate custom workouts tailored to your needs
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/ai-workouts')}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  Explore
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Custom Workouts Tab */}
        <TabsContent value="custom" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Custom Workouts</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage your own workout routines
              </p>
            </div>
            <CreateWorkoutForm userId={user?.id} onWorkoutCreated={handleWorkoutCreated} />
      </div>

      <CustomWorkoutList 
        userId={user?.id} 
        userWorkouts={userWorkouts}
        selectedWorkout={selectedWorkout}
        onSelectWorkout={handleSelectWorkout}
        onDeleteWorkout={handleDeleteWorkout}
        onWorkoutCreated={handleWorkoutCreated}
      />
        </TabsContent>

        {/* Edit Exercises Tab */}
        {selectedWorkout && (
          <TabsContent value="exercises" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Edit Workout</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Customize exercises for {selectedWorkoutObj?.name}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("custom")}
                >
                  Back to Custom
                </Button>
                <Button
                  onClick={() => handleStartWorkout(selectedWorkout)}
                  className="bg-fitness-primary hover:bg-fitness-primary-dark"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Workout
                </Button>
          </div>
        </div>

            <Card>
              <CardHeader>
                <CardTitle>Workout Details</CardTitle>
                <CardDescription>
                  Add, remove, or modify exercises in your workout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutDetails
                  selectedWorkout={selectedWorkout}
                  userWorkouts={userWorkouts}
                  workoutExercises={workoutExercises}
                  exercises={allExercises}
                  onExerciseAdded={handleExerciseAdded}
                  onRemoveExercise={handleRemoveExercise}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </DashboardLayout>
  );
};

export default WorkoutPlanPage;
