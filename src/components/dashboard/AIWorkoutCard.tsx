import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface AIWorkoutCardProps {
  userId: string;
}

const AIWorkoutCard: React.FC<AIWorkoutCardProps> = ({ userId }) => {
  const [latestWorkout, setLatestWorkout] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (userId) {
      fetchLatestAIWorkout();
    }
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
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Brain className="mr-2 h-5 w-5 text-blue-500" />
            AI Workout
          </CardTitle>
          {latestWorkout && (
            <Badge variant="outline" className="text-xs">
              {getRelativeTime(latestWorkout.created_at)}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : latestWorkout ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Your latest AI-generated workout plan
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
              <h3 className="font-medium">{latestWorkout.title}</h3>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              No AI workouts yet. Generate a personalized workout plan based on your fitness goals.
            </p>
            <div className="flex items-center justify-center h-16">
              <Brain className="h-8 w-8 text-gray-300" />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end pt-2">
        {latestWorkout ? (
          <Button 
            size="sm" 
            onClick={handleContinueWorkout}
            className="gap-1"
          >
            View AI Workouts
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            onClick={handleCreateWorkout}
            className="gap-1"
          >
            <Brain className="h-4 w-4" />
            Generate Workout
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default AIWorkoutCard; 