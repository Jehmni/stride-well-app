import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { getExerciseProgressHistory } from '@/services/workoutService';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';

interface ExerciseProgressChartProps {
  exerciseId: string;
  exerciseName: string;
}

const ExerciseProgressChart: React.FC<ExerciseProgressChartProps> = ({
  exerciseId,
  exerciseName
}) => {
  const { user } = useAuth();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeMetric, setActiveMetric] = useState<'weight' | 'reps'>('weight');

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {        const data = await getExerciseProgressHistory(user.id, exerciseId, 20);
        
        // Transform data for the chart
        const formattedData = data.map((log: any) => ({
          date: format(parseISO(log.completed_at), 'MMM dd'),
          weight: log.weight_used || 0,
          reps: log.reps_completed || 0,
          sets: log.sets_completed || 0,
          timestamp: log.completed_at // Keep original timestamp for sorting
        }));
        
        // Sort by date (oldest first)
        formattedData.sort((a: any, b: any) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        setProgressData(formattedData);
      } catch (error) {
        console.error('Error fetching exercise progress:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgressData();
  }, [user?.id, exerciseId]);
  
  // Calculate improvements
  const calculateImprovement = (metric: 'weight' | 'reps') => {
    if (progressData.length < 2) return { value: 0, percentage: 0 };
    
    const first = progressData[0][metric];
    const last = progressData[progressData.length - 1][metric];
    
    if (first === 0) return { value: last, percentage: 100 }; // Avoid division by zero
    
    const improvement = last - first;
    const percentage = Math.round((improvement / first) * 100);
    
    return { value: improvement, percentage };
  };
  
  const weightImprovement = calculateImprovement('weight');
  const repsImprovement = calculateImprovement('reps');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-5 w-16" />
          </CardTitle>
          <CardDescription><Skeleton className="h-4 w-full" /></CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  if (progressData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{exerciseName}</CardTitle>
          <CardDescription>No progress data available yet</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] bg-gray-50 dark:bg-gray-800/30 rounded-md">
          <p className="text-gray-500 text-center">
            Complete this exercise to start tracking your progress
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{exerciseName}</CardTitle>
            <CardDescription>Your progress over time</CardDescription>
          </div>
            {activeMetric === 'weight' ? (
            <div>
              <Badge variant={weightImprovement.percentage > 0 ? "default" : "outline"} className="ml-auto">
                {weightImprovement.percentage > 0 ? '+' : ''}{weightImprovement.value}kg ({weightImprovement.percentage}%)
              </Badge>
            </div>
          ) : (
            <div>
              <Badge variant={repsImprovement.percentage > 0 ? "default" : "outline"} className="ml-auto">
                {repsImprovement.percentage > 0 ? '+' : ''}{repsImprovement.value} reps ({repsImprovement.percentage}%)
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="weight" value={activeMetric} onValueChange={(v) => setActiveMetric(v as 'weight' | 'reps')}>
          <TabsList className="mb-4">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="reps">Reps</TabsTrigger>
          </TabsList>
          
          <TabsContent value="weight" className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis unit="kg" />
                <Tooltip
                  formatter={(value: any) => [`${value}kg`, 'Weight']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Weight"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          <TabsContent value="reps" className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#888" strokeOpacity={0.2} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: any, name: any) => [value, name === "reps" ? "Reps" : "Sets"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="reps"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Reps"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="sets"
                  stroke="#84cc16"
                  strokeWidth={2}
                  name="Sets"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExerciseProgressChart;
