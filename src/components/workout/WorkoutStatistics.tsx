import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { getUserWorkoutStatistics, getExerciseProgressHistory } from "@/services/workoutService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, parseISO, subDays } from 'date-fns';
import { Activity, Calendar, TrendingUp, BarChart3, Dumbbell } from "lucide-react";
import ExerciseProgressChart from "./ExerciseProgressChart";
import { Skeleton } from "../ui/skeleton";

interface WorkoutStatisticsProps {
  onViewAllProgress?: () => void;
}

const WorkoutStatistics: React.FC<WorkoutStatisticsProps> = ({ 
  onViewAllProgress 
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [topExercises, setTopExercises] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchWorkoutStats = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const userStats = await getUserWorkoutStatistics(user.id);
        setStats(userStats);
          // Fetch the user's most frequently logged exercises
        const { data: exerciseLogs, error } = await supabase
          .from('exercise_logs')
          .select(`
            exercise_id,
            exercises:exercise_id(id, name, muscle_group, equipment_required),
            workout_logs:workout_log_id(user_id),
            count
          `)
          .eq('workout_logs.user_id', user.id)
          .order('count', { ascending: false })
          .limit(3)
          .group('exercise_id, exercises(id, name, muscle_group, equipment_required)');
          
        if (error) throw error;
        
        if (exerciseLogs && exerciseLogs.length > 0) {
          setTopExercises(exerciseLogs.map((log: any) => ({
            id: log.exercise_id,
            name: log.exercises.name,
            muscleGroup: log.exercises.muscle_group,
            count: log.count
          })));
        }
      } catch (error) {
        console.error('Error fetching workout statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWorkoutStats();
  }, [user?.id]);
  
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <CardHeader className="p-4">
                  <Skeleton className="h-4 w-20" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-6">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Format the last active date
  const lastActiveDate = stats?.last_workout_date 
    ? format(parseISO(stats.last_workout_date), 'MMMM d, yyyy')
    : 'N/A';

  // Calculate streak
  const streak = stats?.current_streak || 0;
    
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" /> 
          Workout Progress
        </CardTitle>
        <CardDescription>
          Track your fitness journey and see your improvements over time
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="p-4">
              <CardDescription className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" /> Total Workouts
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{stats?.total_workouts || 0}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardDescription className="flex items-center">
                <TrendingUp className="mr-2 h-4 w-4" /> Current Streak
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{streak} {streak === 1 ? 'day' : 'days'}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardDescription className="flex items-center">
                <BarChart3 className="mr-2 h-4 w-4" /> Avg. Duration
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-2xl font-bold">{stats?.avg_duration ? Math.round(stats.avg_duration) : 0} min</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardDescription className="flex items-center">
                <Dumbbell className="mr-2 h-4 w-4" /> Last Active
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-lg font-medium">{lastActiveDate}</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Exercise progress charts */}
        {topExercises.length > 0 ? (
          <Tabs defaultValue={topExercises[0]?.id}>
            <TabsList className="mb-4">
              {topExercises.map((exercise) => (
                <TabsTrigger key={exercise.id} value={exercise.id}>
                  {exercise.name}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {topExercises.map((exercise) => (
              <TabsContent key={exercise.id} value={exercise.id}>
                <ExerciseProgressChart 
                  exerciseId={exercise.id}
                  exerciseName={exercise.name}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="bg-muted/50 p-6 rounded-lg text-center">
            <p className="text-muted-foreground">Complete more workouts to see your exercise progress over time</p>
            <Button variant="outline" className="mt-4">Start a Workout</Button>
          </div>
        )}
      </CardContent>
      
      {onViewAllProgress && (
        <CardFooter>
          <Button variant="outline" onClick={onViewAllProgress} className="w-full">
            View All Progress History
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default WorkoutStatistics;
