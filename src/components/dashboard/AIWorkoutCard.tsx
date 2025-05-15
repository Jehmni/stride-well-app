import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronRight, Plus, Loader2, ArrowRight, Lightbulb, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { getAIConfig } from '@/integrations/supabase/aiConfig';

interface AIWorkoutCardProps {
  userId: string;
}

const AIWorkoutCard: React.FC<AIWorkoutCardProps> = ({ userId }) => {
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean | null>(null);
  const [aiWorkoutCount, setAiWorkoutCount] = useState<number | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (userId) {
      fetchLatestAIWorkout();
    }
  }, [userId]);
  
  useEffect(() => {
    const checkAIConfig = async () => {
      try {
        // Set a timeout to avoid waiting too long for the API
        const timeoutId = setTimeout(() => {
          setTimeoutReached(true);
          setIsLoading(false);
        }, 3000); // 3 seconds timeout

        const aiConfig = await getAIConfig('openai');
        clearTimeout(timeoutId);
        
        setIsAIEnabled(Boolean(aiConfig?.is_enabled && aiConfig?.api_key));
        
        // Fetch AI workout count
        await fetchAIWorkoutCount();
      } catch (error) {
        console.error('Error checking AI configuration:', error);
        setIsAIEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAIConfig();
  }, [userId]);
  
  const fetchLatestAIWorkout = async () => {
    try {
      setIsLoading(true);
      
      // Fetch the most recent AI workout plan
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .eq('ai_generated', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // No rows returned is not a real error
          console.error('Error fetching latest AI workout:', error);
        }
        setLatestWorkout(null);
      } else {
        setLatestWorkout(data);
      }
    } catch (err) {
      console.error('Error in fetchLatestAIWorkout:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchAIWorkoutCount = async () => {
    try {
      const { data, error, count } = await supabase
        .from('workout_plans')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('ai_generated', true);
        
      if (error) throw error;
      
      setAiWorkoutCount(count || 0);
    } catch (error) {
      console.error('Error fetching AI workout count:', error);
      setAiWorkoutCount(0);
    }
  };
  
  const handleCreateWorkout = () => {
    navigate('/ai-workouts');
  };
  
  const handleContinueWorkout = () => {
    navigate('/ai-workouts');
  };
  
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return new Date(dateString).toLocaleDateString();
    }
  };
  
  if (isLoading) {
    return (
      <Card className="h-64">
        <CardContent className="pt-6 h-full flex flex-col">
          <div className="flex items-center mb-4">
            <Skeleton className="h-6 w-6 mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-20 w-full mb-4" />
          <div className="mt-auto">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If we hit the timeout but AI is still not confirmed, we still show the card
  // assuming it's enabled to avoid poor UX
  if (timeoutReached && isAIEnabled === null) {
    setIsAIEnabled(true);
  }

  return (
    <Card className="h-64">
      <CardContent className="pt-6 h-full flex flex-col">
        <div className="flex items-center mb-4">
          <Brain className="h-6 w-6 text-fitness-primary mr-2" />
          <h3 className="text-lg font-semibold">AI Workout Generator</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {isAIEnabled
            ? aiWorkoutCount && aiWorkoutCount > 0
              ? `You've created ${aiWorkoutCount} AI workout plan${aiWorkoutCount !== 1 ? 's' : ''}. Create another personalized plan based on your fitness profile.`
              : "Get a personalized workout plan created by AI based on your fitness goals."
            : "AI-powered workout generation is currently unavailable."}
        </p>
        <div className="mt-auto">
          {isAIEnabled ? (
            <Button 
              className="w-full" 
              onClick={() => navigate('/create-ai-workout')}
            >
              {aiWorkoutCount && aiWorkoutCount > 0 ? 'Create New AI Workout' : 'Create AI Workout'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              <Lightbulb className="mr-2 h-4 w-4" />
              AI Generation Unavailable
            </Button>
          )}
        </div>
      </CardContent>
      {isAIEnabled && (
        <CardFooter className="bg-gray-50 dark:bg-gray-800 border-t px-6 py-3">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
            Workout plans are tailored to your personal profile
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIWorkoutCard; 