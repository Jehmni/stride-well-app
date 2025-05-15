import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import WorkoutTracker from '@/components/workout/WorkoutTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Dumbbell, Calendar, ListChecks, Play, Brain, Info, Loader2, ArrowLeft } from 'lucide-react';
import AIGeneratedNotice from '@/components/common/AIGeneratedNotice';
import WorkoutWeeklySchedule from '@/components/workout/WorkoutWeeklySchedule';
import WorkoutExerciseList from '@/components/workout/WorkoutExerciseList';

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
  ai_generated: boolean;
  created_at: string;
}

const AIWorkoutDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isTrackingMode, setIsTrackingMode] = useState(false);

  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (!data) {
          setError('Workout plan not found');
          return;
        }
        
        // Format exercise data if needed
        let exercises = data.exercises || [];
        if (Array.isArray(exercises) && exercises.length > 0) {
          // Make sure each exercise has an id for tracking
          exercises = exercises.map((ex, index) => ({
            ...ex,
            id: ex.id || `exercise-${index}-${Date.now()}`
          }));
        }
        
        setWorkoutPlan({
          ...data,
          exercises
        });
      } catch (err) {
        console.error('Error fetching workout plan:', err);
        setError('Failed to load workout plan');
      } finally {
        setLoading(false);
      }
    };
    
    fetchWorkoutPlan();
  }, [id]);

  const handleStartTracking = () => {
    setIsTrackingMode(true);
    setActiveTab('tracking');
    
    // Scroll to top for better user experience
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCompleteTracking = () => {
    toast.success('Workout completed successfully!');
    setIsTrackingMode(false);
    setActiveTab('overview');
    
    // Reload to reflect updated stats
    setTimeout(() => {
      navigate('/progress');
    }, 1500);
  };

  const handleCancelTracking = () => {
    setIsTrackingMode(false);
    setActiveTab('overview');
  };

  // Get today's workout from the weekly structure
  const getTodaysWorkout = () => {
    if (!workoutPlan?.weekly_structure) return null;
    
    const today = new Date().getDay(); // 0-6, Sunday is 0
    // Convert to our format where Monday is 0
    const todayIndex = today === 0 ? 6 : today - 1;
    
    return workoutPlan.weekly_structure[todayIndex] || null;
  };

  if (loading) {
    return (
      <DashboardLayout title="Workout Plan">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !workoutPlan) {
    return (
      <DashboardLayout title="Workout Plan">
        <Alert variant="destructive" className="mb-6">
          <Info className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || 'Failed to load workout plan. Please try again.'}
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/ai-workouts')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workouts
        </Button>
      </DashboardLayout>
    );
  }

  const todaysWorkout = getTodaysWorkout();

  return (
    <DashboardLayout title={workoutPlan.title}>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/ai-workouts')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workouts
            </Button>
            
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Dumbbell className="h-8 w-8 text-primary" />
              {workoutPlan.title}
            </h1>
            <p className="text-muted-foreground mt-1">
              {workoutPlan.description}
            </p>
          </div>
          
          {!isTrackingMode && (
            <Button 
              onClick={handleStartTracking}
              className="w-full md:w-auto"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          )}
        </div>
        
        {workoutPlan.ai_generated && (
          <AIGeneratedNotice className="mb-6" />
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="overview" disabled={isTrackingMode}>
              <Info className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="schedule" disabled={isTrackingMode}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <ListChecks className="mr-2 h-4 w-4" />
              Tracking
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Workout Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium">Goal</h3>
                    <p className="text-muted-foreground">
                      {workoutPlan.fitness_goal.replace(/-/g, ' ')}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      {workoutPlan.description}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium">Created</h3>
                    <p className="text-muted-foreground">
                      {new Date(workoutPlan.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Today's Focus</h3>
                    {todaysWorkout ? (
                      <div className="bg-secondary/50 p-4 rounded-lg">
                        <p className="font-medium">{todaysWorkout.focus}</p>
                        <p className="text-sm text-muted-foreground">
                          {todaysWorkout.duration} minutes
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">No workout scheduled for today</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5" />
                    Exercises
                  </CardTitle>
                  <CardDescription>
                    {workoutPlan.exercises.length} exercises in this workout plan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WorkoutExerciseList exercises={workoutPlan.exercises} />
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Your weekly workout routine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutWeeklySchedule weeklyStructure={workoutPlan.weekly_structure} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Workout Schedule</CardTitle>
                <CardDescription>
                  Detailed breakdown of your weekly training routine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkoutWeeklySchedule 
                  weeklyStructure={workoutPlan.weekly_structure} 
                  exercises={workoutPlan.exercises}
                  showDetails
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="tracking">
            {isTrackingMode ? (
              <WorkoutTracker 
                workoutPlan={workoutPlan}
                focusArea={todaysWorkout?.focus}
                onComplete={handleCompleteTracking}
                onCancel={handleCancelTracking}
              />
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Play className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ready to start your workout?</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Track your progress, record weights and sets, and keep a log of your fitness journey.
                </p>
                <Button onClick={handleStartTracking}>
                  Start Tracking Workout
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AIWorkoutDetailPage; 