
// Update ExerciseDashboard component to correctly handle RPC function results
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { testLogExerciseCompletion } from "@/utils/testRpcFunction";

interface Exercise {
  exercise_id: string;
  name: string;
  muscle_group: string;
  count: number;
}

const ExerciseDashboard: React.FC = () => {
  const { user } = useAuth();
  const [topExercises, setTopExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [rpcFunctionExists, setRpcFunctionExists] = useState<boolean | null>(null);

  useEffect(() => {
    const testRpcFunction = async () => {
      try {
        const exists = await testLogExerciseCompletion();
        setRpcFunctionExists(exists);
      } catch (err) {
        console.error("Error testing RPC function:", err);
        setRpcFunctionExists(false);
      }
    };

    testRpcFunction();
  }, []);

  useEffect(() => {
    const fetchTopExercises = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);          // Use RPC function to get user's top exercises by count
        const { data, error } = await supabase
          .rpc('get_top_exercises', { 
            user_id_param: user.id,
            limit_param: 5
          } as any);
        
        if (error) throw error;
        
        if (data) {
          setTopExercises((data as any[]).map(exercise => ({
            exercise_id: exercise.exercise_id,
            name: exercise.name,
            muscle_group: exercise.muscle_group,
            count: exercise.count
          })));
        }
      } catch (error) {
        console.error("Error fetching top exercises:", error);
        setTopExercises([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopExercises();
  }, [user?.id]);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Most Used Exercises</CardTitle>
      </CardHeader>
      <CardContent>
        {rpcFunctionExists === false ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
            <p className="text-sm">
              <strong>Note:</strong> The RPC function for exercise logging is not properly configured.
              Database migrations may need to be run.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
          </div>
        ) : topExercises.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>You haven't logged any exercises yet.</p>
            <p className="text-sm mt-2">Complete workouts to see your most used exercises here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {topExercises.map((exercise) => (
              <li 
                key={exercise.exercise_id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <h4 className="font-medium">{exercise.name}</h4>
                  <p className="text-sm text-gray-500">{exercise.muscle_group}</p>
                </div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold">{exercise.count}</span>
                  <span className="ml-1 text-sm text-gray-500">times</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default ExerciseDashboard;
