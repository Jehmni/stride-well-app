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
import { ChevronDown, ChevronUp, Info, CheckCircle } from "lucide-react";
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
import { getExerciseIcon } from "@/utils/exerciseIcons";

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
    <Card className={`transition-all duration-300 ${
      isCompleted 
        ? 'border-green-400 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 shadow-lg' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`h-3 w-3 rounded-full transition-colors ${
                isCompleted ? 'bg-green-500' : progressPercentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
              <span className="text-lg mr-1">{getExerciseIcon(exercise.exercise.name)}</span>
              <h4 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{exercise.exercise.name}</h4>
              {isCompleted && (
                <Badge className="bg-green-600 text-white font-medium">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Done
                </Badge>
              )}
            </div>
            
            <div className="ml-6 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {exercise.sets} sets × {repsText} reps
                  </span>
                  {exercise.rest_time && (
                    <span className="text-gray-600 dark:text-gray-400">
                      {exercise.rest_time}s rest
                    </span>
                  )}
                  {exercise.weight_kg && (
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      {exercise.weight_kg}kg
                    </span>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">{exercise.exercise.muscle_group}</Badge>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Progress</span>
                  <span className={`font-medium ${
                    progressPercentage === 100 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
                  }`}>
                    {setsCompleted}/{exercise.sets} sets ({progressPercentage}%)
                  </span>
                </div>
                <Progress 
                  value={progressPercentage} 
                  className={`h-2 transition-all duration-300 ${
                    progressPercentage === 100 ? '[&>div]:bg-green-500' : ''
                  }`}
                />
              </div>
              
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {isExpanded 
                  ? 'Configure sets, reps, weight, and notes below' 
                  : 'Click the arrow to expand for detailed tracking'
                }
              </p>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="shrink-0 h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label={isExpanded ? "Hide details" : "Show details"}
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
      </div>
      
      {/* Sets tracking */}
      <div className="px-4 pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sets Progress</Label>
            <span className="text-xs text-gray-500">Tap to mark complete</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {setProgress.map((completed, index) => (
              <Button
                key={`${exercise.id}-set-${index}`}
                variant={completed ? "default" : "outline"}
                size="sm"
                className={`h-10 text-sm font-medium transition-all duration-200 ${
                  completed 
                    ? "bg-green-600 hover:bg-green-700 text-white border-green-600" 
                    : "border-2 border-dashed border-gray-300 hover:border-gray-400 text-gray-600"
                }`}
                onClick={() => handleSetComplete(index)}
                disabled={isCompleted}
              >
                {completed ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Set {index + 1}
                  </>
                ) : (
                  `Set ${index + 1}`
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="px-4 pb-4">
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
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
              variant={progressPercentage === 100 ? "default" : "secondary"}
              size="sm"
              className={`w-full font-medium transition-all duration-200 ${
                progressPercentage === 100 
                  ? "bg-green-600 hover:bg-green-700 text-white shadow-md" 
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              }`}
              disabled={progressPercentage < 100}
            >
              {progressPercentage === 100 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </>
              ) : (
                <>
                  Complete {progressPercentage}% of sets first
                </>
              )}
            </Button>
          )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ExerciseTracker;
