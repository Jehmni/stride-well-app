import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Settings } from 'lucide-react';
import { QuickWorkoutComplete } from './QuickWorkoutComplete';
import { AIWorkoutCompletion } from './AIWorkoutCompletion';

interface WorkoutCompletionFlowProps {
  aiWorkoutPlanId: string;
  workoutTitle: string;
  totalExercises?: number;
  onCompleted?: () => void;
}

export const WorkoutCompletionFlow: React.FC<WorkoutCompletionFlowProps> = ({
  aiWorkoutPlanId,
  workoutTitle,
  totalExercises = 0,
  onCompleted
}) => {
  const [showDetailed, setShowDetailed] = useState(false);

  if (showDetailed) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetailed(false)}
          className="mb-2"
        >
          ← Back to Quick Complete
        </Button>
        <AIWorkoutCompletion
          aiWorkoutPlanId={aiWorkoutPlanId}
          workoutTitle={workoutTitle}
          totalExercises={totalExercises}
          onCompleted={onCompleted}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuickWorkoutComplete
        aiWorkoutPlanId={aiWorkoutPlanId}
        workoutTitle={workoutTitle}
        totalExercises={totalExercises}
        onCompleted={onCompleted}
        showDetailedOption={false}
      />
      
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-4">
          <Button
            variant="outline"
            onClick={() => setShowDetailed(true)}
            className="w-full flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Add Details (Duration, Notes, etc.)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
