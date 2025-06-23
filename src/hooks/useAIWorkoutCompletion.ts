import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AIWorkoutCompletionService } from '@/services/aiWorkoutCompletionService';
import { useToast } from '@/hooks/use-toast';

interface WorkoutCompletionData {
  aiWorkoutPlanId: string;
  duration?: number;
  exercisesCompleted?: number;
  totalExercises?: number;
  caloriesBurned?: number;
  notes?: string;
  rating?: number;
}

export const useAIWorkoutCompletion = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [completionHistory, setCompletionHistory] = useState<any[]>([]);
  const { toast } = useToast();
  
  const completionService = new AIWorkoutCompletionService(supabase);

  const logWorkoutCompletion = useCallback(async (data: WorkoutCompletionData) => {
    setIsLoading(true);
    
    try {
      const { data: result, error } = await completionService.logAIWorkoutCompletion(data);
      
      if (error) {
        toast({
          title: "Error logging workout",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error };
      }

      toast({
        title: "Workout completed!",
        description: "Your AI workout has been logged successfully.",
        variant: "default",
      });

      // Refresh completion history
      await getCompletionHistory();
      
      return { success: true, data: result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  }, [completionService, toast]);

  const getCompletionHistory = useCallback(async (limit?: number) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await completionService.getAIWorkoutHistory(limit);
      
      if (error) {
        toast({
          title: "Error fetching history",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setCompletionHistory(data || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [completionService, toast]);

  const getCompletionCount = useCallback(async (aiWorkoutPlanId: string) => {
    try {
      const { count, error } = await completionService.getAIWorkoutCompletionCount(aiWorkoutPlanId);
      
      if (error) {
        console.error('Error fetching completion count:', error);
        return 0;
      }
      
      return count;
    } catch (error) {
      console.error('Error fetching completion count:', error);
      return 0;
    }
  }, [completionService]);

  return {
    isLoading,
    completionHistory,
    logWorkoutCompletion,
    getCompletionHistory,
    getCompletionCount,
  };
};
