import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getAIWorkoutPlans } from "@/services/aiWorkoutService";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { generateAIWorkout } from "@/services/aiWorkoutService";
import { toast } from "sonner";
import { Brain } from "lucide-react";

export function AIWorkoutCard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: aiWorkoutPlans, isLoading, refetch } = useQuery({
    queryKey: ["aiWorkoutPlans", user?.id],
    queryFn: () => user?.id ? getAIWorkoutPlans(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const handleGenerateWorkout = async () => {
    if (!profile) {
      toast.error("Please complete your profile first");
      return;
    }

    toast.loading("Generating your personalized workout plan...");
    
    const workoutId = await generateAIWorkout(profile);
    
    toast.dismiss();
    
    if (workoutId) {
      toast.success("Workout plan generated successfully!");
      refetch();
    } else {
      toast.error("Failed to generate workout plan. Please try again.");
    }
  };

  // Get the latest plan
  const latestPlan = aiWorkoutPlans && aiWorkoutPlans.length > 0 ? aiWorkoutPlans[0] : null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 text-primary h-5 w-5" />
            AI Workout Plan
          </CardTitle>
          <CardDescription>Loading your personalized workout plan...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  if (!latestPlan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 text-primary h-5 w-5" />
            AI Workout Plan
          </CardTitle>
          <CardDescription>Let AI generate a personalized workout plan for you</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a customized workout plan based on your fitness goals, age, sex, height, and weight.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleGenerateWorkout}>Generate Workout Plan</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Brain className="mr-2 text-primary h-5 w-5" />
          AI Workout Plan
        </CardTitle>
        <CardDescription>
          Last updated: {format(new Date(latestPlan.created_at), "MMM d, yyyy")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="font-semibold text-lg">{latestPlan.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{latestPlan.description}</p>
        <div className="flex items-center mb-3">
          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
            Goal: {latestPlan.fitness_goal.replace('-', ' ')}
          </span>
          {latestPlan.times_completed > 0 && (
            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 px-2 py-1 rounded-full ml-2">
              Completed {latestPlan.times_completed} times
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate("/ai-workouts")}>
          View All Plans
        </Button>
        <Button onClick={handleGenerateWorkout}>Generate New Plan</Button>
      </CardFooter>
    </Card>
  );
} 