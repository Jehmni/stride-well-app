import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, CheckCircle } from 'lucide-react';
import { useAIWorkoutCompletion } from '@/hooks/useAIWorkoutCompletion';

interface AIWorkoutCompletionProps {
  aiWorkoutPlanId: string;
  workoutTitle: string;
  totalExercises?: number;
  onCompleted?: () => void;
}

export const AIWorkoutCompletion: React.FC<AIWorkoutCompletionProps> = ({
  aiWorkoutPlanId,
  workoutTitle,
  totalExercises = 0,
  onCompleted
}) => {
  const [duration, setDuration] = useState<number | undefined>(undefined);
  const [exercisesCompleted, setExercisesCompleted] = useState<number>(totalExercises);
  const [caloriesBurned, setCaloriesBurned] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  
  const { logWorkoutCompletion, isLoading } = useAIWorkoutCompletion();
  const handleComplete = async () => {
    const result = await logWorkoutCompletion({
      aiWorkoutPlanId,
      duration,
      exercisesCompleted,
      totalExercises,
      caloriesBurned,
      notes,
      rating
    });

    if (result.success && onCompleted) {
      onCompleted();
    }
  };

  const renderStarRating = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 cursor-pointer transition-colors ${
              star <= rating 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            onClick={() => setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          Workout Complete!
        </CardTitle>
        <CardDescription>
          How did your {workoutTitle} go?
        </CardDescription>
      </CardHeader><CardContent className="space-y-4">
        <div>
          <Label htmlFor="exercises">Exercises Completed</Label>
          <Input
            id="exercises"
            type="number"
            value={exercisesCompleted}
            onChange={(e) => setExercisesCompleted(parseInt(e.target.value) || 0)}
            min="0"
            max={totalExercises || 50}
          />
          {totalExercises > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              out of {totalExercises} exercises
            </p>
          )}
        </div>

        <div>
          <Label>Rate Your Workout</Label>
          {renderStarRating()}
        </div>

        <div>
          <Label htmlFor="notes">Notes (Optional)</Label>
          <Textarea
            id="notes"
            placeholder="How did you feel? Any observations?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <details className="cursor-pointer">
          <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Optional Details
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration || ''}
                onChange={(e) => setDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
                min="1"
                max="300"
              />
            </div>
            <div>
              <Label htmlFor="calories">Estimated Calories Burned</Label>
              <Input
                id="calories"
                type="number"
                value={caloriesBurned || ''}
                onChange={(e) => setCaloriesBurned(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
                min="0"
                max="2000"
              />
            </div>
          </div>
        </details>

        <Button 
          onClick={handleComplete} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Logging Workout...' : 'Complete Workout'}
        </Button>
      </CardContent>
    </Card>
  );
};
