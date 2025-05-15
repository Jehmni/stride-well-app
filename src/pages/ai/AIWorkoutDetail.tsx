import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useWorkoutTracking } from "@/hooks/useWorkoutTracking";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Dumbbell, Save, Check, Brain, Bell, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { scheduleLocalNotification, requestNotificationPermission } from "@/services/notificationService";

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  sets: number;
  reps: string | number;
  rest_time: number;
  notes?: string;
  completed: boolean;
}

interface DayExercises {
  day: string;
  exercises: Exercise[];
}

const AIWorkoutDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [progress, setProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const { isOnline, logWorkout } = useWorkoutTracking();
  const [showReminderButton, setShowReminderButton] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    const fetchWorkoutPlan = async () => {
      try {
        setLoading(true);
        
        // First check local cache
        const cachedPlan = localStorage.getItem(`workout_plan_${id}`);
        if (cachedPlan) {
          const parsedPlan = JSON.parse(cachedPlan);
          setWorkoutPlan(parsedPlan);
          processExercises(parsedPlan);
          
          // In background, check for newer data
          fetchFromServer();
        } else {
          await fetchFromServer();
        }
      } catch (error) {
        console.error('Error fetching workout plan:', error);
        toast.error('Failed to load workout plan');
        setLoading(false);
      }
    };
    
    const fetchFromServer = async () => {
      try {
        const { data, error } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        // Cache the data locally
        localStorage.setItem(`workout_plan_${id}`, JSON.stringify(data));
        
        setWorkoutPlan(data);
        
        // Set selected day to current day of week if possible
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = daysOfWeek[new Date().getDay()];
        
        // Check if weekly_structure exists and has the expected format
        const weeklyStructure = data.weekly_structure;
        let days: string[] = [];
        
        if (weeklyStructure && typeof weeklyStructure === 'object') {
          // Try to find days in the format stored in the database
          if (Array.isArray(weeklyStructure)) {
            // Format: Array of day objects
            days = weeklyStructure.map((day: any) => day.day.toLowerCase());
          } else if (weeklyStructure.days) {
            // Format: Object with 'days' property
            days = Object.keys(weeklyStructure.days);
          }
        }
        
        if (days.includes(today)) {
          setSelectedDay(today);
        } else if (days.length > 0) {
          setSelectedDay(days[0]);
        }
        
        // Initialize exercises from the workout plan
        processExercises(data);
      } catch (error) {
        console.error('Error fetching workout plan from server:', error);
        toast.error('Failed to load workout plan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutPlan();
  }, [id]);
  
  useEffect(() => {
    if (exercises.length > 0) {
      const completed = exercises.filter(ex => ex.completed).length;
      setCompletedCount(completed);
      setTotalExercises(exercises.length);
      setProgress(Math.round((completed / exercises.length) * 100));
    }
  }, [exercises]);
  
  const processExercises = (plan: any) => {
    if (!plan.exercises || !Array.isArray(plan.exercises)) return;
    
    // Find exercises for current day
    const allExercises: Exercise[] = [];
    
    plan.exercises.forEach((dayExercises: DayExercises) => {
      if (dayExercises.exercises && Array.isArray(dayExercises.exercises)) {
        dayExercises.exercises.forEach((exercise: any) => {
          allExercises.push({
            ...exercise,
            id: exercise.id || crypto.randomUUID(), // Use existing ID if available or generate a temporary one
            completed: false
          });
        });
      }
    });
    
    setExercises(allExercises);
  };
  
  const handleDayChange = (day: string) => {
    setSelectedDay(day);
  };
  
  const toggleExerciseCompletion = (id: string) => {
    setExercises(prevExercises => 
      prevExercises.map(ex => 
        ex.id === id ? { ...ex, completed: !ex.completed } : ex
      )
    );
  };
  
  const resetAllExercises = () => {
    setExercises(prevExercises => 
      prevExercises.map(ex => ({ ...ex, completed: false }))
    );
    setProgress(0);
    setCompletedCount(0);
    toast.info('All exercises have been reset');
  };
  
  const handleCompleteWorkout = async () => {
    if (!user?.id || !id) {
      toast.error('You must be logged in to save workout progress');
      return;
    }
    
    try {
      setSaving(true);
      
      // Calculate duration based on exercises (rough estimate)
      const totalDuration = Math.floor(
        exercises.reduce((total, ex) => {
          const repTime = 30; // Default 30s per set
          return total + (ex.sets * (repTime + ex.rest_time));
        }, 0) / 60
      ); // Convert to minutes
      
      // Estimate calories burned
      const caloriesBurned = Math.floor(totalDuration * 8);
      
      // Get only completed exercises
      const completedExercises = exercises.filter(ex => ex.completed);
      
      if (completedExercises.length === 0) {
        toast.error('Please complete at least one exercise before saving');
        setSaving(false);
        return;
      }
      
      // Format exercises for the logWorkout function
      const formattedExercises = completedExercises.map(ex => ({
        exercise_id: ex.id,
        sets_completed: ex.sets,
        reps_completed: typeof ex.reps === 'string' ? parseInt(ex.reps) || 1 : ex.reps,
        weight_used: null
      }));
      
      // Use the hook for completing workouts (handles online/offline)
      const workoutLogId = await logWorkout({
        workout_plan_id: id,
        exercises: formattedExercises,
        duration: totalDuration,
        calories_burned: caloriesBurned,
        title: workoutPlan.title,
        description: workoutPlan.description
      });
      
      if (workoutLogId) {
        // Update the local workout plan to reflect completion
        const updatedPlan = {
          ...workoutPlan,
          times_completed: (workoutPlan.times_completed || 0) + 1,
          last_completed: new Date().toISOString()
        };
        
        // Update in cache
        localStorage.setItem(`workout_plan_${id}`, JSON.stringify(updatedPlan));
        
        // Redirect to progress page
        navigate('/progress');
      }
    } catch (error) {
      console.error('Error completing workout:', error);
      toast.error('Failed to save workout completion. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleSetReminder = async () => {
    if (!workoutPlan || !user?.id) return;
    
    // Request notification permission if not granted
    if (Notification.permission !== 'granted') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        toast.error('Permission to send notifications was denied');
        return;
      }
    }
    
    try {
      // Create a reminder 30 minutes from now
      const reminderTime = new Date(Date.now() + 30 * 60 * 1000);
      
      // Schedule the notification
      const scheduled = await scheduleLocalNotification(
        'Workout Reminder',
        {
          body: `Don't forget your "${workoutPlan.title}" workout!`,
          timestamp: reminderTime.getTime(),
          workoutPlanId: id
        }
      );
      
      if (scheduled) {
        toast.success('Reminder set for 30 minutes from now');
        setShowReminderButton(false);
        
        // Also save to database
        const { error } = await supabase
          .from('workout_reminders')
          .insert({
            user_id: user.id,
            title: `Reminder for ${workoutPlan.title}`,
            workout_plan_id: id,
            scheduled_date: format(reminderTime, 'yyyy-MM-dd'),
            scheduled_time: format(reminderTime, 'HH:mm'),
            is_recurring: false,
            is_enabled: true
          });
          
        if (error) {
          console.error('Error saving reminder to database:', error);
        }
      } else {
        toast.error('Failed to set reminder');
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      toast.error('Failed to set reminder');
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout title="Loading Workout...">
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!workoutPlan) {
    return (
      <DashboardLayout title="Workout Not Found">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Workout Plan Not Found</h2>
          <p className="text-muted-foreground mb-6">The workout plan you're looking for doesn't exist or is no longer available.</p>
          <Button onClick={() => navigate('/ai-workouts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Workouts
          </Button>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout title={workoutPlan.title}>
      <div className="mb-6">
        {!isOnline && (
          <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 p-2 rounded mb-4 text-sm flex items-center justify-center">
            You're currently offline. Completed workouts will be synced when you reconnect.
          </div>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="outline"
            onClick={() => navigate('/ai-workouts')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to AI Workouts
          </Button>
          
          {showReminderButton && (
            <Button
              variant="outline"
              onClick={handleSetReminder}
              className="flex items-center"
            >
              <Bell className="mr-2 h-4 w-4" />
              Remind Me Later
            </Button>
          )}
        </div>
        
        <Button
          variant="outline"
          onClick={() => navigate('/ai-workouts')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to AI Workouts
        </Button>
        
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold">{workoutPlan.title}</h1>
            <p className="text-muted-foreground">{workoutPlan.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-primary/10 text-primary capitalize">
                {workoutPlan.fitness_goal.replace('-', ' ')}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Created {format(new Date(workoutPlan.created_at), "MMM d, yyyy")}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI Generated
              </Badge>
            </div>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Workout Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">
                  {completedCount} of {totalExercises} exercises completed
                </span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Exercises
              </CardTitle>
              <CardDescription>Complete all exercises in this workout plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exercises.map((exercise) => (
                  <div 
                    key={exercise.id}
                    className={`p-4 border rounded-lg ${
                      exercise.completed ? 'bg-primary/5 border-primary/30' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Checkbox
                          id={`exercise-${exercise.id}`}
                          checked={exercise.completed}
                          onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                          className="mt-1"
                        />
                        <div>
                          <label
                            htmlFor={`exercise-${exercise.id}`}
                            className="font-medium text-lg cursor-pointer"
                          >
                            {exercise.name}
                          </label>
                          <p className="text-sm text-muted-foreground">{exercise.muscle_group}</p>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center">
                              <span className="text-xs font-medium uppercase text-muted-foreground mr-2">Sets</span>
                              <span>{exercise.sets}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs font-medium uppercase text-muted-foreground mr-2">Reps</span>
                              <span>{exercise.reps}</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-xs font-medium uppercase text-muted-foreground mr-2">Rest</span>
                              <span>{exercise.rest_time}s</span>
                            </div>
                          </div>
                          {exercise.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">{exercise.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  className="w-full" 
                  disabled={completedCount === 0 || saving}
                  onClick={handleCompleteWorkout}
                >
                  {saving ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Complete Workout
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={resetAllExercises}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset All
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIWorkoutDetail; 