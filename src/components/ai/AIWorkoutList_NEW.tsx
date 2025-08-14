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
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const handleGenerateWorkout = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    toast.loading("Generating your personalized workout plan...");
    
    const workoutId = await generateEnhancedAIWorkout({
      ...profile,
      fitness_level: profile.fitness_level as "beginner" | "intermediate" | "advanced"
    });
    
    toast.dismiss();
    
    if (workoutId) {
      toast.success("Workout plan generated successfully!");
      refetch();
    } else {
      toast.error("Failed to generate workout plan. Please try again.");
    }
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
            
            {/* Collapsible Content */}
            {expandedPlan === plan.id && (
              <CardContent className="relative pt-0">
                <div className="space-y-8">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Duration</p>
                          <p className="text-lg font-bold text-blue-900">
                            {plan.weekly_structure?.total_duration || "45"} min
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center space-x-2">
                        <Gauge className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Intensity</p>
                          <p className="text-lg font-bold text-green-900">
                            {plan.weekly_structure?.intensity || "Moderate"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Focus</p>
                          <p className="text-lg font-bold text-purple-900">
                            {plan.weekly_structure?.primary_focus || "Full Body"}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Progress</p>
                          <p className="text-lg font-bold text-orange-900">
                            {plan.times_completed || 0}/{Math.ceil((plan.weekly_structure?.total_weeks || 4))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Weekly Structure */}
                  {plan.weekly_structure && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        Weekly Structure
                      </h3>
                      <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl p-6 border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(plan.weekly_structure).map(([day, exercises]: [string, any]) => {
                            if (typeof exercises !== 'object' || !exercises || Array.isArray(exercises)) return null;
                            
                            return (
                              <div key={day} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                                <h4 className="font-semibold text-gray-900 mb-3 capitalize flex items-center">
                                  <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getFitnessGoalGradient(plan.fitness_goal)} mr-2`}></div>
                                  {day.replace('_', ' ')}
                                </h4>
                                <div className="space-y-2">
                                  {Array.isArray(exercises.exercises) ? (
                                    exercises.exercises.slice(0, 3).map((exercise: string, idx: number) => (
                                      <div key={idx} className="flex items-center text-sm text-gray-600">
                                        <span className="mr-2">{getExerciseIcon(exercise)}</span>
                                        <span className="truncate">{exercise}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-gray-500">{exercises.focus || 'Rest day'}</p>
                                  )}
                                  {Array.isArray(exercises.exercises) && exercises.exercises.length > 3 && (
                                    <p className="text-xs text-gray-400">+{exercises.exercises.length - 3} more exercises</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exercise Details */}
                  {plan.exercises && plan.exercises.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Dumbbell className="h-5 w-5 mr-2 text-purple-600" />
                        Exercise Library
                      </h3>
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
                              <TableHead className="font-semibold text-gray-900">Exercise</TableHead>
                              <TableHead className="font-semibold text-gray-900">Sets</TableHead>
                              <TableHead className="font-semibold text-gray-900">Reps</TableHead>
                              <TableHead className="font-semibold text-gray-900">Rest</TableHead>
                              <TableHead className="font-semibold text-gray-900">Notes</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {plan.exercises.map((exercise: any, index: number) => (
                              <TableRow key={index} className="hover:bg-gray-50 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="flex items-center space-x-3">
                                    <span className="text-lg">{getExerciseIcon(exercise.name || exercise.exercise)}</span>
                                    <span className="text-gray-900">{exercise.name || exercise.exercise}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {exercise.sets || exercise.set || '3'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {exercise.reps || exercise.rep || '12'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                    {exercise.rest || '60s'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 max-w-xs">
                                  {exercise.notes || exercise.instructions || 'Focus on proper form'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}

            <CardFooter className="relative bg-gradient-to-r from-gray-50/50 to-gray-100/50 border-t border-gray-200">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Brain className="h-4 w-4 mr-1 text-purple-500" />
                    AI Generated
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-blue-500" />
                    {format(new Date(plan.created_at), "MMM d")}
                  </span>
                  {plan.times_completed > 0 && (
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                      {plan.times_completed} completions
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {expandedPlan === plan.id ? 'Show Less' : 'Show More'}
                  {expandedPlan === plan.id ? (
                    <ChevronDown className="h-4 w-4 ml-1" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
