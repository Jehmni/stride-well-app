import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { AIWorkoutPlanResponse } from '@/types/rpc';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

interface AIWorkoutListProps {
  userId: string;
}

export const AIWorkoutList: React.FC<AIWorkoutListProps> = ({ userId }) => {
  const [workoutPlans, setWorkoutPlans] = useState<AIWorkoutPlanResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (userId) {
      fetchAIWorkoutPlans();
    }
  }, [userId]);

  const fetchAIWorkoutPlans = async () => {
    try {
      setIsLoading(true);
      setError(null);      try {
        // Try to use the optimized RPC function first
        const { data, error } = await supabase.rpc('get_ai_workout_plans', {
          p_user_id: userId
        });

        if (error) {
          throw error;
        }

        setWorkoutPlans(data || []);
        console.log('AI workout plans fetched:', data);
      } catch (rpcError) {
        console.warn('RPC function failed, falling back to direct query:', rpcError);

        // Fallback to direct query
        const { data, error } = await supabase
          .from('workout_plans')
          .select(`
            id,
            title,
            description,
            fitness_goal,
            created_at,
            workout_logs!ai_workout_plan_id(count)
          `)
          .eq('user_id', userId)
          .eq('ai_generated', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          throw error;
        }

        // Transform the data to match the RPC response format
        const formattedData = data.map(plan => ({
          id: plan.id,
          title: plan.title,
          description: plan.description,
          fitness_goal: plan.fitness_goal,
          created_at: plan.created_at,
          completion_count: plan.workout_logs?.length || 0
        }));

        setWorkoutPlans(formattedData);
        console.log('AI workout plans fetched via direct query:', formattedData);
      }
    } catch (error) {
      console.error('Error fetching AI workout plans:', error);
      setError('Failed to load AI workout plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewWorkout = (workoutPlanId: string) => {
    router.push(`/workout-plan/${workoutPlanId}`);
  };

  const renderSkeleton = () => {
    return Array(3)
      .fill(0)
      .map((_, i) => (
        <Card key={`skeleton-${i}`} className="mb-4">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      ));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Your AI-Generated Workouts</h2>
        </div>
        {renderSkeleton()}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 dark:border-red-800 mb-4">
        <CardHeader>
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
            <CardTitle>Error Loading Workouts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300">
            {error}. Please try again later.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAIWorkoutPlans}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (workoutPlans.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Your AI-Generated Workouts</h2>
        </div>
        <Card className="border-gray-200 dark:border-gray-800">
          <CardContent className="pt-6">
            <div className="text-center py-6">
              <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">No AI Workouts Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Generate a custom workout plan based on your fitness goals.
              </p>
              <Button 
                onClick={() => router.push('/create-workout?type=ai')}
                className="gap-2"
              >
                Generate Workout Plan
                <Brain className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Brain className="h-5 w-5 mr-2 text-blue-500" />
          <h2 className="text-xl font-semibold">Your AI-Generated Workouts</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/create-workout?type=ai')}
          className="gap-2"
        >
          <Brain className="h-4 w-4" />
          New AI Workout
        </Button>
      </div>

      {workoutPlans.map((plan) => (
        <Card 
          key={plan.id} 
          className="mb-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{plan.title}</CardTitle>
              <Badge variant={plan.completion_count > 0 ? "default" : "secondary"}>
                {plan.completion_count > 0 
                  ? `Used ${plan.completion_count} time${plan.completion_count !== 1 ? 's' : ''}` 
                  : 'New Plan'}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {formatDistanceToNow(new Date(plan.created_at), { addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {plan.description || `A personalized workout plan for ${plan.fitness_goal || 'your fitness goals'}.`}
            </p>
            {plan.fitness_goal && (
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {plan.fitness_goal}
                </Badge>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              size="sm"
              onClick={() => handleViewWorkout(plan.id)}
              className="gap-1"
            >
              Start Workout
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default AIWorkoutList; 