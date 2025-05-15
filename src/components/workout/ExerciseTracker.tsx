import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WorkoutExerciseDetail } from "./types";

interface ExerciseTrackerProps {
  exercise: WorkoutExerciseDetail;
  onComplete: (exerciseId: string, data?: {
    sets_completed: number;
    reps_completed: number;
    weight_used?: number;
    notes?: string;
  }) => void;
  workoutId: string;
}

const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({ exercise, onComplete, workoutId }) => {
  const [setProgress, setSetProgress] = useState<boolean[]>([]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [setsCompleted, setSetsCompleted] = useState<number>(0);
  const [repsCompleted, setRepsCompleted] = useState<number>(0);
  const [weightUsed, setWeightUsed] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState<string>("");

  // Initialize set progress tracking array
  useEffect(() => {
    setSetProgress(Array(exercise.sets).fill(false));
    
    // Check if this exercise is already marked as completed in local storage
    const completedExercises = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
    if (completedExercises[exercise.id]) {
      setIsCompleted(true);
      setSetProgress(Array(exercise.sets).fill(true));
      setSetsCompleted(exercise.sets);
      
      // If we have stored detailed info, retrieve it
      if (completedExercises[exercise.id].details) {
        const details = completedExercises[exercise.id].details;
        setRepsCompleted(details.reps_completed || 0);
        setWeightUsed(details.weight_used);
        setNotes(details.notes || "");
      }
    }
  }, [exercise.id, exercise.sets, workoutId]);

  const handleSetComplete = (setIndex: number) => {
    const newSetProgress = [...setProgress];
    newSetProgress[setIndex] = !newSetProgress[setIndex];
    setSetProgress(newSetProgress);
    
    // Update sets completed count
    const completedSetsCount = newSetProgress.filter(set => set).length;
    setSetsCompleted(completedSetsCount);
    
    // Check if all sets are completed
    const allCompleted = newSetProgress.every(set => set);
    if (allCompleted && !isCompleted) {
      setIsExpanded(true); // Expand to show details when all sets completed
    } else if (!allCompleted && isCompleted) {
      setIsCompleted(false);
    }
  };

  const handleExerciseComplete = async () => {
    try {
      setIsCompleted(true);
      
      // Prepare data for completion
      const completionData = {
        sets_completed: setsCompleted,
        reps_completed: repsCompleted || 0,
        weight_used: weightUsed,
        notes: notes
      };
      
      // Store completion status and details in localStorage for persistent state
      const completedExercises = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
      completedExercises[exercise.id] = {
        completed: true,
        details: completionData
      };
      localStorage.setItem(`completedExercises-${workoutId}`, JSON.stringify(completedExercises));
      
      // Notify parent component
      onComplete(exercise.id, completionData);
      
      toast.success(`Completed ${exercise.exercise.name}!`);
    } catch (error) {
      console.error("Error marking exercise as complete:", error);
      toast.error("Failed to mark exercise as complete");
    }
  };

  const progressPercentage = Math.round((setProgress.filter(Boolean).length / setProgress.length) * 100);

  // Build reps display text
  const repsText = typeof exercise.reps === 'string' && exercise.reps.includes('-')
    ? exercise.reps
    : `${exercise.reps}`;

  return (
    <Card className={`p-4 ${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-900/10' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <h4 className="font-medium text-base mr-2">{exercise.exercise.name}</h4>
            <Badge variant="outline">{exercise.exercise.muscle_group}</Badge>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            {exercise.sets} sets × {repsText} reps
            {exercise.rest_time && ` • ${exercise.rest_time}s rest`}
          </p>
          
          <div className="flex items-center space-x-1 mb-2">
            <span className="text-xs text-gray-500">{progressPercentage}%</span>
            <Progress value={progressPercentage} className="h-1 flex-1" />
          </div>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="shrink-0"
              >
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isExpanded ? "Hide details" : "Show details"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Sets checkboxes */}
      <div className="flex flex-wrap gap-2 my-3">
        {setProgress.map((completed, index) => (
          <Checkbox
            key={`${exercise.id}-set-${index}`}
            id={`${exercise.id}-set-${index}`}
            checked={completed}
            onCheckedChange={() => handleSetComplete(index)}
            className={completed ? "data-[state=checked]:bg-green-500 data-[state=checked]:text-white" : ""}
            disabled={isCompleted}
          />
        ))}
      </div>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="space-y-4 mt-3 pt-3 border-t">
          {exercise.instructions && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
              <div className="flex items-center mb-1 text-gray-600 dark:text-gray-400">
                <Info size={14} className="mr-1" />
                <span className="font-medium">Instructions</span>
              </div>
              <p>{exercise.instructions}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`reps-${exercise.id}`} className="text-xs">Reps per Set</Label>
              <Input
                id={`reps-${exercise.id}`}
                type="number"
                min="0"
                max="100"
                value={repsCompleted || ''}
                onChange={(e) => setRepsCompleted(parseInt(e.target.value) || 0)}
                disabled={isCompleted}
                className="h-8 text-sm"
                placeholder={repsText}
              />
            </div>
            
            <div className="space-y-1">
              <Label htmlFor={`weight-${exercise.id}`} className="text-xs">Weight (kg)</Label>
              <Input
                id={`weight-${exercise.id}`}
                type="number"
                min="0"
                step="0.5"
                value={weightUsed || ''}
                onChange={(e) => setWeightUsed(e.target.value ? parseFloat(e.target.value) : undefined)}
                disabled={isCompleted}
                className="h-8 text-sm"
                placeholder="Optional"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor={`notes-${exercise.id}`} className="text-xs">Notes</Label>
            <Textarea
              id={`notes-${exercise.id}`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isCompleted}
              className="text-sm"
              placeholder="How did this exercise feel?"
              rows={2}
            />
          </div>
          
          {!isCompleted && (
            <Button 
              onClick={handleExerciseComplete}
              variant="outline"
              size="sm"
              className="w-full"
              disabled={progressPercentage < 100}
            >
              Mark Complete
            </Button>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ExerciseTracker;
