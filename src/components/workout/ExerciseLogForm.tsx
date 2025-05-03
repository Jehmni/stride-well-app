import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { logExerciseCompletion } from "@/services/workoutService";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

interface ExerciseLogFormProps {
  workoutLogId: string;
  exerciseId: string;
  exerciseName: string;
  recommendedSets: number;
  recommendedReps: string;
  onComplete: () => void;
}

const ExerciseLogForm: React.FC<ExerciseLogFormProps> = ({
  workoutLogId,
  exerciseId,
  exerciseName,
  recommendedSets,
  recommendedReps,
  onComplete
}) => {
  const [setsCompleted, setSetsCompleted] = useState<number>(recommendedSets);
  const [repsCompleted, setRepsCompleted] = useState<number | undefined>(
    // If recommendedReps is a range (e.g. "8-12"), use the lower number
    parseInt(recommendedReps.split('-')[0]) || undefined
  );
  const [weightUsed, setWeightUsed] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!setsCompleted || setsCompleted < 1) {
      toast.error("Please enter the number of sets completed");
      return;
    }

    setIsLogging(true);
    
    try {
      await logExerciseCompletion(
        workoutLogId,
        exerciseId,
        setsCompleted,
        repsCompleted,
        weightUsed,
        notes
      );
      
      setIsComplete(true);
      toast.success(`${exerciseName} logged successfully!`);
      onComplete();
    } catch (error) {
      console.error("Error logging exercise:", error);
      toast.error("Failed to log exercise completion");
    } finally {
      setIsLogging(false);
    }
  };

  if (isComplete) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex items-center">
        <CheckCircle className="text-green-600 dark:text-green-400 mr-2" />
        <span>
          <strong>{exerciseName}</strong> completed: {setsCompleted} sets
          {repsCompleted ? ` of ${repsCompleted} reps` : ''}
          {weightUsed ? ` with ${weightUsed}kg` : ''}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
      <h4 className="font-medium">{exerciseName}</h4>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Recommended: {recommendedSets} sets of {recommendedReps} reps
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="sets">Sets Completed</Label>
          <Input
            id="sets"
            type="number"
            min="1"
            value={setsCompleted}
            onChange={(e) => setSetsCompleted(parseInt(e.target.value) || 0)}
            required
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="reps">Reps per Set</Label>
          <Input
            id="reps"
            type="number"
            min="1"
            placeholder="Optional"
            value={repsCompleted || ''}
            onChange={(e) => setRepsCompleted(e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="weight">Weight Used (kg)</Label>
        <Input
          id="weight"
          type="number"
          min="0"
          step="0.5"
          placeholder="Optional"
          value={weightUsed || ''}
          onChange={(e) => setWeightUsed(e.target.value ? parseFloat(e.target.value) : undefined)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="How did this exercise feel? Any improvements?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={isLogging} className="w-full">
        {isLogging ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Logging...
          </>
        ) : (
          'Complete Exercise'
        )}
      </Button>
    </form>
  );
};

export default ExerciseLogForm;
