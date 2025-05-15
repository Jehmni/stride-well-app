import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { Dumbbell, Clock, Activity, CheckCircle, Save, ArrowUpFromLine, Wifi, WifiOff } from 'lucide-react';
import { format } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
  instructions?: string;
  equipment_required?: string;
  difficulty?: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  weekly_structure: WorkoutDay[];
  exercises: Exercise[];
  ai_generated?: boolean;
}

interface WorkoutTrackerProps {
  workoutPlan: WorkoutPlan;
  focusArea?: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({
  workoutPlan,
  focusArea,
  onComplete,
  onCancel
}) => {
  const [exerciseStates, setExerciseStates] = useState<Record<string, { 
    completed: boolean;
    sets_completed: number;
    reps_completed: number;
    weight_used: number | null;
    notes: string;
  }>>({});
  const [duration, setDuration] = useState<number>(30);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [completionProgress, setCompletionProgress] = useState<number>(0);
  const { toast } = useToast();
  const { logWorkout, isSubmitting, isOnline, syncWorkouts } = useWorkoutTracking();

  // Initialize exercise states
  useEffect(() => {
    const initialStates: Record<string, any> = {};
    workoutPlan.exercises.forEach(exercise => {
      initialStates[exercise.id] = {
        completed: false,
        sets_completed: 0,
        reps_completed: 0,
        weight_used: null,
        notes: ''
      };
    });
    setExerciseStates(initialStates);
  }, [workoutPlan]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isTimerRunning && startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setElapsedTime(elapsed);
        setDuration(Math.floor(elapsed / 60)); // Convert seconds to minutes
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, startTime]);

  // Calculate completion progress
  useEffect(() => {
    const totalSets = workoutPlan.exercises.reduce((sum, exercise) => sum + exercise.sets, 0);
    const completedSets = Object.values(exerciseStates).reduce((sum, state) => 
      sum + (state.completed ? state.sets_completed : 0), 0);
    
    const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    setCompletionProgress(progress);
  }, [exerciseStates, workoutPlan.exercises]);

  const handleStartWorkout = () => {
    setStartTime(new Date());
    setIsTimerRunning(true);
    toast({
      title: "Workout Started",
      description: "Your workout timer has started. Good luck!",
      duration: 3000,
    });
  };

  const handlePauseWorkout = () => {
    setIsTimerRunning(false);
  };

  const handleResumeWorkout = () => {
    // Adjust the start time to account for the pause duration
    if (startTime) {
      const pauseDuration = Date.now() - (startTime.getTime() + elapsedTime * 1000);
      setStartTime(new Date(Date.now() - elapsedTime * 1000 - pauseDuration));
      setIsTimerRunning(true);
    }
  };

  const handleToggleExerciseCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates(prev => {
      const exercise = workoutPlan.exercises.find(e => e.id === exerciseId);
      const sets = exercise?.sets || 0;
      const repsRange = exercise?.reps || '0';
      const repsAvg = typeof repsRange === 'string' && repsRange.includes('-')
        ? Math.floor((parseInt(repsRange.split('-')[0]) + parseInt(repsRange.split('-')[1])) / 2)
        : parseInt(repsRange.toString());

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          completed,
          sets_completed: completed ? sets : 0,
          reps_completed: completed ? repsAvg : 0
        }
      };
    });
  };

  const handleUpdateExerciseSets = (exerciseId: string, value: number) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        sets_completed: value
      }
    }));
  };

  const handleUpdateExerciseReps = (exerciseId: string, value: number) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        reps_completed: value
      }
    }));
  };

  const handleUpdateExerciseWeight = (exerciseId: string, value: number | null) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        weight_used: value
      }
    }));
  };

  const handleUpdateExerciseNotes = (exerciseId: string, value: string) => {
    setExerciseStates(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        notes: value
      }
    }));
  };

  const handleCompleteWorkout = async () => {
    // Stop the timer
    setIsTimerRunning(false);
    
    // Prepare completed exercises
    const exercises = Object.entries(exerciseStates)
      .filter(([_, state]) => state.completed)
      .map(([id, state]) => ({
        exercise_id: id,
        sets_completed: state.sets_completed,
        reps_completed: state.reps_completed,
        weight_used: state.weight_used,
        notes: state.notes
      }));
    
    if (exercises.length === 0) {
      toast({
        title: "No exercises completed",
        description: "Please complete at least one exercise before finishing the workout.",
        variant: "destructive",
      });
      return;
    }
    
    // Calculate estimated calories burned if not provided
    // This is a very simplified calculation
    const calculatedCalories = duration * 7 * exercises.length; // Simplified formula
    const finalCaloriesBurned = caloriesBurned > 0 ? caloriesBurned : calculatedCalories;
    
    // Log the workout
    const result = await logWorkout({
      workout_plan_id: workoutPlan.id,
      duration,
      calories_burned: finalCaloriesBurned,
      notes,
      exercises,
      title: workoutPlan.title,
      description: workoutPlan.description
    });
    
    if (result) {
      // Call the onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-end mb-2">
        <Badge variant={isOnline ? "default" : "secondary"} className="flex items-center gap-1">
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline Mode</span>
            </>
          )}
        </Badge>
        
        {!isOnline && (
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={syncWorkouts}
          >
            <ArrowUpFromLine className="h-3 w-3 mr-1" />
            Sync
          </Button>
        )}
      </div>
      
      {/* Workout Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {workoutPlan.title}
          </CardTitle>
          <CardDescription>
            {focusArea ? `Focus: ${focusArea}` : workoutPlan.description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
            {/* Timer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-mono">{formatTime(elapsedTime)}</span>
              </div>
              
              <div className="space-x-2">
                {!startTime && (
                  <Button onClick={handleStartWorkout} size="sm">
                    Start Workout
                  </Button>
                )}
                
                {startTime && isTimerRunning && (
                  <Button 
                    onClick={handlePauseWorkout}
                    variant="outline"
                    size="sm"
                  >
                    Pause
                  </Button>
                )}
                
                {startTime && !isTimerRunning && (
                  <Button 
                    onClick={handleResumeWorkout}
                    variant="outline"
                    size="sm"
                  >
                    Resume
                  </Button>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(completionProgress)}%</span>
                <span>{Object.values(exerciseStates).filter(state => state.completed).length} / {workoutPlan.exercises.length} exercises</span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Exercises
        </h3>
        
        <Accordion type="multiple" className="w-full">
          {workoutPlan.exercises.map((exercise) => (
            <AccordionItem value={exercise.id} key={exercise.id}>
              <AccordionTrigger className="flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <Checkbox 
                    checked={exerciseStates[exercise.id]?.completed || false}
                    onCheckedChange={(checked) => 
                      handleToggleExerciseCompletion(exercise.id, checked === true)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="mr-2"
                  />
                  
                  <div className="flex-1 text-left">
                    <span className={exerciseStates[exercise.id]?.completed ? "line-through opacity-70" : ""}>
                      {exercise.name}
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets} sets • {exercise.reps} reps • {exercise.muscle}
                    </div>
                  </div>
                  
                  {exerciseStates[exercise.id]?.completed && (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  )}
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="pt-4">
                <div className="space-y-4 pb-2">
                  {/* Equipment & Difficulty */}
                  {(exercise.equipment_required || exercise.difficulty) && (
                    <div className="flex flex-wrap gap-2">
                      {exercise.equipment_required && (
                        <Badge variant="outline">
                          Equipment: {exercise.equipment_required}
                        </Badge>
                      )}
                      {exercise.difficulty && (
                        <Badge variant="outline">
                          Difficulty: {exercise.difficulty}
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {/* Instructions */}
                  {exercise.instructions && (
                    <div className="text-sm text-muted-foreground">
                      <p>{exercise.instructions}</p>
                    </div>
                  )}
                  
                  {/* Sets & Reps Tracking */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`sets-${exercise.id}`} className="text-sm font-medium">
                        Sets Completed
                      </label>
                      <Input 
                        id={`sets-${exercise.id}`}
                        type="number"
                        min="0"
                        max="20"
                        value={exerciseStates[exercise.id]?.sets_completed || 0}
                        onChange={(e) => handleUpdateExerciseSets(exercise.id, parseInt(e.target.value) || 0)}
                        disabled={!exerciseStates[exercise.id]?.completed}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor={`reps-${exercise.id}`} className="text-sm font-medium">
                        Reps Per Set
                      </label>
                      <Input 
                        id={`reps-${exercise.id}`}
                        type="number"
                        min="0"
                        max="100"
                        value={exerciseStates[exercise.id]?.reps_completed || 0}
                        onChange={(e) => handleUpdateExerciseReps(exercise.id, parseInt(e.target.value) || 0)}
                        disabled={!exerciseStates[exercise.id]?.completed}
                      />
                    </div>
                  </div>
                  
                  {/* Weight Used */}
                  <div className="space-y-2">
                    <label htmlFor={`weight-${exercise.id}`} className="text-sm font-medium">
                      Weight Used (kg, optional)
                    </label>
                    <Input 
                      id={`weight-${exercise.id}`}
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="Optional"
                      value={exerciseStates[exercise.id]?.weight_used || ''}
                      onChange={(e) => handleUpdateExerciseWeight(
                        exercise.id, 
                        e.target.value ? parseFloat(e.target.value) : null
                      )}
                      disabled={!exerciseStates[exercise.id]?.completed}
                    />
                  </div>
                  
                  {/* Notes */}
                  <div className="space-y-2">
                    <label htmlFor={`notes-${exercise.id}`} className="text-sm font-medium">
                      Notes
                    </label>
                    <Textarea 
                      id={`notes-${exercise.id}`}
                      placeholder="Add notes about this exercise..."
                      value={exerciseStates[exercise.id]?.notes || ''}
                      onChange={(e) => handleUpdateExerciseNotes(exercise.id, e.target.value)}
                      disabled={!exerciseStates[exercise.id]?.completed}
                      rows={2}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
      {/* Workout Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Summary</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Duration */}
          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">
              Duration (minutes)
            </label>
            <Input 
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
            />
          </div>
          
          {/* Calories */}
          <div className="space-y-2">
            <label htmlFor="calories" className="text-sm font-medium">
              Calories Burned (estimated)
            </label>
            <Input 
              id="calories"
              type="number"
              min="0"
              value={caloriesBurned}
              onChange={(e) => setCaloriesBurned(parseInt(e.target.value) || 0)}
              placeholder="Enter calories or leave for automatic calculation"
            />
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <label htmlFor="workout-notes" className="text-sm font-medium">
              Workout Notes
            </label>
            <Textarea 
              id="workout-notes"
              placeholder="How did this workout feel? Any achievements or challenges?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete Workout
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete this workout?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will save your workout progress and add it to your workout history.
                  {!isOnline && " Since you're offline, it will be saved locally and synced when you reconnect."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteWorkout}>
                  Complete Workout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WorkoutTracker; 