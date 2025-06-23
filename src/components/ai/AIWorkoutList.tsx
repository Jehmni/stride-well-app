import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getAIWorkoutPlans, generateAIWorkout } from "@/services/aiWorkoutService";
import { getEnhancedAIWorkoutPlans, generateEnhancedAIWorkout } from "@/services/enhancedAIWorkoutService";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Brain, Calendar, ChevronDown, ChevronRight, Dumbbell, Play } from "lucide-react";
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

export function AIWorkoutList() {
  const { user, profile } = useAuth();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const { data: workoutPlans, isLoading, refetch } = useQuery({
    queryKey: ["aiWorkoutPlans", user?.id],
    queryFn: () => (user?.id ? getEnhancedAIWorkoutPlans(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    // Add stale-while-revalidate
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (was cacheTime in earlier versions)
  });

  const handleGenerateWorkout = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    toast.loading("Generating your personalized workout plan...");
    
    // Use enhanced AI workout generation
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

  const startWorkout = (planId: string) => {
    // Navigate to workout detail page
    navigate(`/workouts/ai/${planId}`);
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
                        {plan.exercises?.map((dayExercises: any) => (
                          <div key={dayExercises.day} className="mb-4">
                            <h4 className="font-medium capitalize mb-2">
                              {dayExercises.day}
                            </h4>
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Exercise</TableHead>
                                    <TableHead>Muscle Group</TableHead>
                                    <TableHead>Sets</TableHead>
                                    <TableHead>Reps</TableHead>
                                    <TableHead>Rest</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {dayExercises.exercises?.map(
                                    (exercise: any, index: number) => (
                                      <TableRow key={index}>
                                        <TableCell className="font-medium">
                                          {exercise.name || 'Unknown Exercise'}
                                        </TableCell>
                                        <TableCell>{exercise.muscle_group || 'N/A'}</TableCell>
                                        <TableCell>{exercise.sets || 0}</TableCell>
                                        <TableCell>{exercise.reps || 0}</TableCell>
                                        <TableCell>{exercise.rest_time ? `${exercise.rest_time}s` : 'N/A'}</TableCell>
                                      </TableRow>
                                    )
                                  ) || (
                                    <TableRow>
                                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        No exercises available for this day
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        )) || (
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