import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAIWorkoutPlans, generateAIWorkout } from "@/services/aiWorkoutService";
import { getEnhancedAIWorkoutPlans, generateEnhancedAIWorkout } from "@/services/enhancedAIWorkoutService";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { 
  Brain, Calendar, ChevronDown, ChevronRight, Dumbbell, Play, 
  Target, Zap, Heart, Activity, Flame, Trophy, Star, Clock,
  CheckCircle, ArrowRight, Sparkles, Gauge, TrendingUp
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

type AIWorkoutPlan = {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  created_at: string;
  times_completed: number;
  weekly_structure?: any;
  exercises?: any;
};

// Exercise Icon Mapping Function
const getExerciseIcon = (exerciseName: string) => {
  const name = exerciseName.toLowerCase();
  
  // Upper Body Exercises
  if (name.includes('push') || name.includes('press') || name.includes('chest')) {
    return '💪';
  }
  if (name.includes('pull') || name.includes('row') || name.includes('chin') || name.includes('lat')) {
    return '🔄';
  }
  if (name.includes('curl') || name.includes('bicep')) {
    return '💪';
  }
  if (name.includes('tricep') || name.includes('dip')) {
    return '🔥';
  }
  if (name.includes('shoulder') || name.includes('lateral') || name.includes('overhead')) {
    return '🏔️';
  }
  
  // Lower Body Exercises
  if (name.includes('squat') || name.includes('quad')) {
    return '🦵';
  }
  if (name.includes('lunge') || name.includes('step')) {
    return '👟';
  }
  if (name.includes('deadlift') || name.includes('hamstring')) {
    return '⚡';
  }
  if (name.includes('calf') || name.includes('raise')) {
    return '🦶';
  }
  if (name.includes('glute') || name.includes('hip')) {
    return '🍑';
  }
  
  // Core Exercises
  if (name.includes('plank') || name.includes('core')) {
    return '🎯';
  }
  if (name.includes('crunch') || name.includes('sit') || name.includes('ab')) {
    return '⚡';
  }
  if (name.includes('mountain') || name.includes('climber')) {
    return '🏔️';
  }
  
  // Cardio/Full Body
  if (name.includes('burpee') || name.includes('jump')) {
    return '🔥';
  }
  if (name.includes('run') || name.includes('sprint')) {
    return '🏃';
  }
  if (name.includes('bike') || name.includes('cycle')) {
    return '🚴';
  }
  if (name.includes('swim')) {
    return '🏊';
  }
  
  // General/Compound Movements
  if (name.includes('clean') || name.includes('snatch')) {
    return '🏋️';
  }
  if (name.includes('row') && !name.includes('dumbbell')) {
    return '🚣';
  }
  
  // Default
  return '💪';
};

const getFitnessGoalGradient = (goal: string) => {
  switch (goal) {
    case 'weight-loss':
    case 'weight_loss':
      return 'from-red-500 to-orange-500';
    case 'muscle-gain':
    case 'muscle_gain':
      return 'from-blue-500 to-purple-500';
    case 'general-fitness':
    case 'general_fitness':
      return 'from-green-500 to-blue-500';
    case 'endurance':
      return 'from-cyan-500 to-blue-500';
    case 'strength':
      return 'from-purple-500 to-pink-500';
    case 'flexibility':
      return 'from-pink-500 to-rose-500';
    default:
      return 'from-gray-500 to-gray-600';
  }
};

const getFitnessGoalIcon = (goal: string) => {
  switch (goal) {
    case 'weight-loss':
    case 'weight_loss':
      return <Flame className="h-4 w-4" />;
    case 'muscle-gain':
    case 'muscle_gain':
      return <Dumbbell className="h-4 w-4" />;
    case 'general-fitness':
    case 'general_fitness':
      return <Activity className="h-4 w-4" />;
    case 'endurance':
      return <Heart className="h-4 w-4" />;
    case 'strength':
      return <Zap className="h-4 w-4" />;
    case 'flexibility':
      return <Target className="h-4 w-4" />;
    default:
      return <Dumbbell className="h-4 w-4" />;
  }
};

export function AIWorkoutList() {
  const { user, profile } = useAuth();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: workoutPlans, isLoading, refetch } = useQuery({
    queryKey: ["aiWorkoutPlans"],
    queryFn: () => getEnhancedAIWorkoutPlans(user?.id),
    enabled: !!user?.id,
    staleTime: 60 * 60 * 1000,
  });

  const handleGenerateWorkout = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    toast.loading("Generating your personalized workout plan...");
    
    const workoutId = await generateEnhancedAIWorkout(profile);
    
    toast.dismiss();
    
    if (workoutId) {
      toast.success("Workout plan generated successfully!");
      refetch();
    } else {
      toast.error("Failed to generate workout plan. Please try again.");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedPlan(expandedPlan === id ? null : id);
  };

  const handleStartWorkout = async (planId: string) => {
    const plan = workoutPlans?.find((p) => p.id === planId);
    if (plan && plan.weekly_structure) {
      navigate("/workout", { state: { workoutPlan: plan } });
      toast.success("Workout plan loaded!");
    } else {
      toast.error("No workout structure found for this plan");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-gray-700">Loading Your AI Workouts</h3>
            <p className="text-gray-500">Preparing your personalized fitness plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workoutPlans || workoutPlans.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-yellow-800" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to AI Workouts</h2>
          <p className="text-gray-600 mb-8 text-lg">
            Ready to transform your fitness journey? Create your first AI-powered workout plan tailored specifically for you.
          </p>
          <div className="space-y-4">
            <Button 
              onClick={() => navigate("/workout/ai")}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Brain className="h-5 w-5 mr-2" />
              Create Your First AI Workout
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-500">Powered by advanced AI technology</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10"></div>
        <div className="relative px-6 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      AI Workouts
                    </h1>
                    <p className="text-gray-600 text-lg mt-1">
                      Your personalized fitness plans powered by artificial intelligence
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-gray-600">{workoutPlans.length} Plans Created</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <span className="text-gray-600">
                      {workoutPlans.reduce((sum, plan) => sum + (plan.times_completed || 0), 0)} Workouts Completed
                    </span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => navigate("/ai-workouts/generate")}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Brain className="h-5 w-5 mr-2" />
                Create New Workout
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workout Plans Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12 space-y-6">
        {workoutPlans.map((plan, index) => (
          <Card key={plan.id} className="group relative overflow-hidden bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02] rounded-2xl">
            {/* Gradient Background */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getFitnessGoalGradient(plan.fitness_goal)} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <CardHeader className="relative">
              <div className="flex items-start justify-between">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getFitnessGoalGradient(plan.fitness_goal)} rounded-xl flex items-center justify-center`}>
                      {getFitnessGoalIcon(plan.fitness_goal)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {plan.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 text-base mt-1">
                        {plan.description}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center space-x-2 bg-white/80 rounded-lg px-3 py-1.5">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {format(new Date(plan.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    
                    <Badge 
                      variant="secondary" 
                      className={`bg-gradient-to-r ${getFitnessGoalGradient(plan.fitness_goal)} text-white border-0 px-3 py-1.5`}
                    >
                      <span className="flex items-center space-x-1">
                        {getFitnessGoalIcon(plan.fitness_goal)}
                        <span className="ml-1">{plan.fitness_goal?.replace("_", " ") || "General Fitness"}</span>
                      </span>
                    </Badge>
                    
                    {plan.times_completed > 0 && (
                      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 px-3 py-1.5">
                        <Trophy className="h-3 w-3 mr-1" />
                        Completed {plan.times_completed}x
                      </Badge>
                    )}
                    
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 px-3 py-1.5">
                      <Star className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 ml-6">
                  <Button
                    onClick={() => handleStartWorkout(plan.id)}
                    size="lg"
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Start Workout
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                    className="border-2 border-gray-200 hover:border-gray-300 rounded-xl px-4 py-3 transition-all duration-300"
                  >
                    {expandedPlan === plan.id ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>

  const startWorkout = (planId: string) => {
    // Navigate to workout detail page
    navigate(`/ai-workouts/${planId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your AI Workout Plans</h2>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-28 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!workoutPlans || workoutPlans.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your AI Workout Plans</h2>
          <Button onClick={handleGenerateWorkout}>Generate New Plan</Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>No AI Workout Plans Yet</CardTitle>
            <CardDescription>
              Generate your first personalized workout plan with AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Our AI will analyze your profile data and create a custom workout plan
              tailored to your fitness goals, age, sex, height, and weight.
            </p>
            <Button onClick={handleGenerateWorkout}>Generate Workout Plan</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your AI Workout Plans</h2>
        <Button onClick={handleGenerateWorkout} className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      <div className="space-y-4">
        {workoutPlans.map((plan: AIWorkoutPlan) => (
          <Card key={plan.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{plan.title}</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      {plan.fitness_goal.replace("-", " ")}
                    </Badge>
                  </div>
                  <CardDescription>
                    Created: {format(new Date(plan.created_at), "PPP")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {plan.times_completed > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3" />
                      {plan.times_completed} {plan.times_completed === 1 ? "completion" : "completions"}
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpand(plan.id)}
                    className="p-2 h-8 w-8"
                  >
                    {expandedPlan === plan.id ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm mt-2">{plan.description}</p>
            </CardHeader>

            {expandedPlan === plan.id && (
              <>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="schedule">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Weekly Schedule
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid gap-2">
                          {Object.entries(plan.weekly_structure?.days || {}).map(
                            ([day, dayData]: [string, any]) => (
                              <div
                                key={day}
                                className="border rounded-md p-3 bg-card"
                              >
                                <div className="font-medium capitalize">
                                  {day}: {dayData.name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {dayData.description}
                                </div>
                                <div className="mt-1 text-xs bg-primary/10 text-primary inline-block px-2 py-0.5 rounded-full">
                                  {dayData.focus}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="exercises">
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4" />
                          Exercises
                        </div>
                      </AccordionTrigger>                      <AccordionContent>
                        {Array.isArray(plan.exercises) && plan.exercises.length > 0 ? (
                          <div className="mb-4">
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Exercise</TableHead>
                                    <TableHead>Muscle Group</TableHead>
                                    <TableHead>Sets</TableHead>
                                    <TableHead>Reps</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {plan.exercises.map((exercise: any, index: number) => (
                                    <TableRow key={`${plan.id}-exercise-${index}`}>
                                      <TableCell className="font-medium">
                                        {exercise.name || 'Unknown Exercise'}
                                      </TableCell>
                                      <TableCell>{exercise.muscle || exercise.muscle_group || 'N/A'}</TableCell>
                                      <TableCell>{exercise.sets || 0}</TableCell>
                                      <TableCell>{exercise.reps || 0}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground py-4">
                            No exercise data available
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full flex items-center gap-2 mt-2"
                    onClick={() => startWorkout(plan.id)}
                  >
                    <Play className="h-4 w-4" />
                    Start Workout
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
} 