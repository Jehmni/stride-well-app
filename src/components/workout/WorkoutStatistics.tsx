// Fix WorkoutStatistics component to properly handle RPC function results
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ExerciseCount {
  exercise_id: string;
  name: string;
  muscle_group: string;
  count: number;
}

interface MuscleGroupData {
  name: string;
  count: number;
  percentage: number;
}

const WorkoutStatistics: React.FC = () => {
  const { user } = useAuth();
  const [exerciseCounts, setExerciseCounts] = useState<ExerciseCount[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Use RPC function to get user's exercise counts
        const { data, error } = await supabase
          .rpc('get_user_exercise_counts', { 
            user_id_param: user.id
          });

        if (error) throw error;

        if (data) {
          // Process exercise counts
          const exercises = data.map(ex => ({
            exercise_id: ex.exercise_id,
            name: ex.name,
            muscle_group: ex.muscle_group,
            count: Number(ex.count)
          }));
          
          setExerciseCounts(exercises);
          
          // Calculate muscle group distribution
          const groupCounts: { [key: string]: number } = {};
          let totalCount = 0;
          
          exercises.forEach(ex => {
            const group = ex.muscle_group;
            groupCounts[group] = (groupCounts[group] || 0) + ex.count;
            totalCount += ex.count;
          });
          
          const muscleGroupData = Object.entries(groupCounts).map(([name, count]) => ({
            name,
            count,
            percentage: totalCount > 0 ? Math.round((count / totalCount) * 100) : 0
          }));
          
          // Sort by count descending
          muscleGroupData.sort((a, b) => b.count - a.count);
          
          setMuscleGroups(muscleGroupData);
        }
      } catch (error) {
        console.error("Error fetching exercise data:", error);
        setExerciseCounts([]);
        setMuscleGroups([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExerciseData();
  }, [user?.id]);

  return (
    <Card className="w-full shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Exercise Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-4 border-fitness-primary border-t-transparent rounded-full"></div>
          </div>
        ) : exerciseCounts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>No exercise data available.</p>
            <p className="text-sm mt-2">Complete workouts to see your exercise statistics here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Muscle Group Distribution</h4>
              <ul className="mt-2 space-y-2">
                {muscleGroups.map((group) => (
                  <li key={group.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h5 className="font-medium">{group.name}</h5>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold">{group.percentage}%</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">Most Frequent Exercises</h4>
              <ul className="mt-2 space-y-2">
                {exerciseCounts.map((exercise) => (
                  <li key={exercise.exercise_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <h5 className="font-medium">{exercise.name}</h5>
                      <p className="text-sm text-gray-500">{exercise.muscle_group}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-lg font-semibold">{exercise.count}</span>
                      <span className="ml-1 text-sm text-gray-500">times</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutStatistics;
