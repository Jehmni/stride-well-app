import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Star } from 'lucide-react';
import { useAIWorkoutCompletion } from '@/hooks/useAIWorkoutCompletion';

interface QuickWorkoutCompleteProps {
  aiWorkoutPlanId: string;
  workoutTitle: string;
  totalExercises?: number;
  onCompleted?: () => void;
  showDetailedOption?: boolean;
}

export const QuickWorkoutComplete: React.FC<QuickWorkoutCompleteProps> = ({
  aiWorkoutPlanId,
  workoutTitle,
  totalExercises = 0,
  onCompleted,
  showDetailedOption = true
}) => {
  const { logWorkoutCompletion, isLoading } = useAIWorkoutCompletion();

  const handleQuickComplete = async (rating: number = 5) => {
    const result = await logWorkoutCompletion({
      aiWorkoutPlanId,
      exercisesCompleted: totalExercises, // Assume all exercises completed
      totalExercises,
      rating,
      notes: 'Quick completion'
    });

    if (result.success && onCompleted) {
      onCompleted();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
        </div>
        <CardTitle>Workout Complete!</CardTitle>
        <CardDescription>
          Great job completing your {workoutTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-600">
            How would you rate this workout?
          </p>
          
          <div className="flex justify-center gap-2">
            {[3, 4, 5].map((rating) => (
              <Button
                key={rating}
                variant="outline"
                size="sm"
                onClick={() => handleQuickComplete(rating)}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                <div className="flex">
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs ml-1">
                  {rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Amazing'}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {showDetailedOption && (
          <div className="pt-2 border-t">
            <p className="text-xs text-gray-500 text-center">
              Want to add more details? Use the detailed completion form.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
