import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Wifi, WifiOff, ArrowUpFromLine, Dumbbell, Clock, Activity, CheckCircle, Save } from 'lucide-react';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';

type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string | number;
  muscle?: string;
  instructions?: string;
  equipment_required?: string;
  difficulty?: string;
};

type WorkoutPlan = {
  id: string;
  title: string;
  description?: string;
  exercises: Exercise[];
};

type ExerciseState = {
  completed: boolean;
  sets_completed: number;
  reps_completed: number;
  weight_used?: number | null;
  notes?: string;
};

type Props = {
  workoutPlan: WorkoutPlan;
  focusArea?: string;
  onComplete?: () => void;
  onCancel?: () => void;
};

const WorkoutTracker: React.FC<Props> = ({ workoutPlan, focusArea, onComplete, onCancel }) => {
  const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>(() => {
    const initial: Record<string, ExerciseState> = {};
    workoutPlan.exercises.forEach((ex) => {
      initial[ex.id] = {
        completed: false,
        sets_completed: 0,
        reps_completed: 0,
        weight_used: null,
        notes: '',
      };
    });
    return initial;
  });

  const [isOnline] = useState(true); // conservatively assume online; sync logic lives elsewhere
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [duration, setDuration] = useState<number>(0);
  const [caloriesBurned, setCaloriesBurned] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let timer: number | undefined;
    if (isTimerRunning) {
      timer = window.setInterval(() => {
        setElapsedTime((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [isTimerRunning]);

  // compute progress
  const completionProgress = useMemo(() => {
    const totalSets = workoutPlan.exercises.reduce((sum, ex) => sum + (ex.sets || 0), 0);
    const completedSets = Object.entries(exerciseStates).reduce((sum, [id, state]) => sum + (state.sets_completed || 0), 0);
    return totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  }, [exerciseStates, workoutPlan.exercises]);

  const handleStartWorkout = () => {
    setStartTime(new Date());
    setIsTimerRunning(true);
    toast({ title: 'Workout Started', description: 'Your workout timer has started.', duration: 2000 });
  };

  const handlePauseWorkout = () => setIsTimerRunning(false);
  const handleResumeWorkout = () => setIsTimerRunning(true);

  const handleToggleExerciseCompletion = (exerciseId: string, completed: boolean) => {
    setExerciseStates((prev) => {
      const ex = workoutPlan.exercises.find((e) => e.id === exerciseId);
      const sets = ex?.sets || 0;
      const repsRange = ex?.reps || '0';
      const repsAvg = typeof repsRange === 'string' && repsRange.includes('-')
        ? Math.floor((parseInt(repsRange.split('-')[0]) + parseInt(repsRange.split('-')[1])) / 2)
        : parseInt(repsRange.toString() || '0');

      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          completed,
          sets_completed: completed ? sets : 0,
          reps_completed: completed ? repsAvg : 0,
        },
      };
    });
  };

  const handleUpdateExerciseSets = (exerciseId: string, value: number) => {
    setExerciseStates((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], sets_completed: value } }));
  };

  const handleUpdateExerciseReps = (exerciseId: string, value: number) => {
    setExerciseStates((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], reps_completed: value } }));
  };

  const handleUpdateExerciseWeight = (exerciseId: string, value: number | null) => {
    setExerciseStates((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], weight_used: value } }));
  };

  const handleUpdateExerciseNotes = (exerciseId: string, value: string) => {
    setExerciseStates((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], notes: value } }));
  };

  const { logWorkout } = useWorkoutTracking();

  const handleCompleteWorkout = async () => {
    setIsTimerRunning(false);
    const exercises = Object.entries(exerciseStates)
      .filter(([_, state]) => state.completed)
      .map(([id, state]) => ({
        exercise_id: id,
        sets_completed: state.sets_completed,
        reps_completed: state.reps_completed,
        weight_used: state.weight_used,
        notes: state.notes,
      }));

    if (exercises.length === 0) {
      toast.error('Please complete at least one exercise before finishing the workout.');
      return;
    }

    const calculatedCalories = Math.max(1, Math.round((elapsedTime / 60) * 7 * exercises.length));
    const finalCaloriesBurned = caloriesBurned > 0 ? caloriesBurned : calculatedCalories;

    setIsSubmitting(true);
    try {
      const result = await logWorkout({
        workout_plan_id: workoutPlan.id,
        duration: Math.max(1, Math.round(elapsedTime / 60)),
        calories_burned: finalCaloriesBurned,
        notes,
        exercises,
        title: workoutPlan.title,
        description: workoutPlan.description || '',
      });

      if (result && onComplete) onComplete();
      toast.success('Workout saved');
    } catch (err) {
      console.error('Failed to save workout', err);
      toast.error('Failed to save workout. It will be queued for sync if offline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExerciseIcon = (name: string) => {
    // lightweight placeholder for icons
    return <Dumbbell className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end mb-2">
        <Badge variant={isOnline ? 'default' : 'secondary'} className="flex items-center gap-1">
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
          <Button variant="outline" size="sm" className="ml-2">
            <ArrowUpFromLine className="h-3 w-3 mr-1" />
            Sync
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {workoutPlan.title}
          </CardTitle>
          <CardDescription>{focusArea ? `Focus: ${focusArea}` : workoutPlan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4">
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
                  <Button onClick={handlePauseWorkout} variant="outline" size="sm">
                    Pause
                  </Button>
                )}

                {startTime && !isTimerRunning && (
                  <Button onClick={handleResumeWorkout} variant="outline" size="sm">
                    Resume
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress: {Math.round(completionProgress)}%</span>
                <span>
                  {Object.values(exerciseStates).filter((s) => s.completed).length} / {workoutPlan.exercises.length} exercises
                </span>
              </div>
              <Progress value={completionProgress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Exercises
        </h3>

        <Accordion type="multiple" className="w-full">
          {workoutPlan.exercises.map((exercise) => (
            <AccordionItem value={exercise.id} key={exercise.id}>
              <div className="flex items-center">
                <div onClick={(e) => e.stopPropagation()} className="mr-2">
                  <Checkbox
                    checked={exerciseStates[exercise.id]?.completed || false}
                    onCheckedChange={(checked) => handleToggleExerciseCompletion(exercise.id, checked === true)}
                  />
                </div>

                <AccordionTrigger asChild>
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 text-left">
                      <span
                        className={`flex items-center space-x-2 ${
                          exerciseStates[exercise.id]?.completed ? 'line-through opacity-70' : ''
                        }`}
                      >
                        <span className="text-lg">{getExerciseIcon(exercise.name)}</span>
                        <span>{exercise.name}</span>
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

              </div>

              <AccordionContent className="pt-4">
                <div className="space-y-4 pb-2">
                  {(exercise.equipment_required || exercise.difficulty) && (
                    <div className="flex flex-wrap gap-2">
                      {exercise.equipment_required && <Badge variant="outline">Equipment: {exercise.equipment_required}</Badge>}
                      {exercise.difficulty && <Badge variant="outline">Difficulty: {exercise.difficulty}</Badge>}
                    </div>
                  )}

                  {exercise.instructions && <div className="text-sm text-muted-foreground"><p>{exercise.instructions}</p></div>}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor={`sets-${exercise.id}`} className="text-sm font-medium">Sets Completed</label>
                      <Input
                        id={`sets-${exercise.id}`}
                        type="number"
                        min={0}
                        max={20}
                        value={exerciseStates[exercise.id]?.sets_completed || 0}
                        onChange={(e) => handleUpdateExerciseSets(exercise.id, parseInt(e.target.value) || 0)}
                        disabled={!exerciseStates[exercise.id]?.completed}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor={`reps-${exercise.id}`} className="text-sm font-medium">Reps Per Set</label>
                      <Input
                        id={`reps-${exercise.id}`}
                        type="number"
                        min={0}
                        max={100}
                        value={exerciseStates[exercise.id]?.reps_completed || 0}
                        onChange={(e) => handleUpdateExerciseReps(exercise.id, parseInt(e.target.value) || 0)}
                        disabled={!exerciseStates[exercise.id]?.completed}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`weight-${exercise.id}`} className="text-sm font-medium">Weight Used (kg, optional)</label>
                    <Input
                      id={`weight-${exercise.id}`}
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Optional"
                      value={exerciseStates[exercise.id]?.weight_used ?? ''}
                      onChange={(e) => handleUpdateExerciseWeight(exercise.id, e.target.value ? parseFloat(e.target.value) : null)}
                      disabled={!exerciseStates[exercise.id]?.completed}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`notes-${exercise.id}`} className="text-sm font-medium">Notes</label>
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

      <Card>
        <CardHeader>
          <CardTitle>Workout Summary</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</label>
            <Input id="duration" type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} />
          </div>

          <div className="space-y-2">
            <label htmlFor="calories" className="text-sm font-medium">Calories Burned (estimated)</label>
            <Input id="calories" type="number" min={0} value={caloriesBurned} onChange={(e) => setCaloriesBurned(parseInt(e.target.value) || 0)} placeholder="Enter calories or leave for automatic calculation" />
          </div>

          <div className="space-y-2">
            <label htmlFor="workout-notes" className="text-sm font-medium">Workout Notes</label>
            <Textarea id="workout-notes" placeholder="How did this workout feel? Any achievements or challenges?" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={isSubmitting}>{isSubmitting ? (<><Save className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : (<><CheckCircle className="mr-2 h-4 w-4" />Complete Workout</>)}</Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Complete this workout?</AlertDialogTitle>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleCompleteWorkout}>Complete Workout</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WorkoutTracker;