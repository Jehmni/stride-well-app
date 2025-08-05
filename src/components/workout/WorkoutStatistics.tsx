
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { ExerciseCountResponse } from '@/types/rpc';
import { getUserExerciseCountsRPC } from '@/integrations/supabase/functions';

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

interface WorkoutStatisticsProps {
  onViewAllProgress?: () => void;
}

const WorkoutStatistics: React.FC<WorkoutStatisticsProps> = ({ onViewAllProgress }) => {
  const { user } = useAuth();
  const [exerciseCounts, setExerciseCounts] = useState<ExerciseCount[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  useEffect(() => {
    const fetchExerciseData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        // Use RPC function to get user's exercise counts
        const { data, error } = await getUserExerciseCountsRPC({ 
          user_id_param: user.id
        });

        if (error) {
          console.error("Failed to get exercise counts:", error);
          setExerciseCounts([]);
          setMuscleGroups([]);
          return;
        }        if (data && Array.isArray(data)) {
          // Process exercise counts with proper NaN handling
          const exercises = data.map(ex => ({
            exercise_id: ex.exercise_id || `fallback-${Math.random()}`,
            name: ex.name || 'Unknown Exercise',
            muscle_group: ex.muscle_group || 'Unknown',
            count: isNaN(Number(ex.count)) ? 0 : Number(ex.count)
          }));
          
          setExerciseCounts(exercises);
          
          // Calculate muscle group distribution
          const groupCounts: { [key: string]: number } = {};
          let totalCount = 0;
          
          exercises.forEach(ex => {
            const group = ex.muscle_group || 'Unknown';
            const validCount = isNaN(ex.count) ? 0 : ex.count;
            groupCounts[group] = (groupCounts[group] || 0) + validCount;
            totalCount += validCount;
          });
          
          const muscleGroupData = Object.entries(groupCounts).map(([name, count]) => ({
            name: name || 'Unknown',
            count: isNaN(count) ? 0 : count,
            percentage: totalCount > 0 && !isNaN(count) && !isNaN(totalCount) 
              ? Math.round((count / totalCount) * 100) 
              : 0
          }));
          
          // Sort by count descending
          muscleGroupData.sort((a, b) => (b.count || 0) - (a.count || 0));
          
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
          <div className="space-y-4">            <div>
              <h4 className="text-sm font-medium text-gray-500">Muscle Group Distribution</h4>              <ul className="mt-2 space-y-2">
                {muscleGroups.map((group, index) => {
                  const uniqueKey = group.name || `muscle-group-${index}-${group.count || 0}`;
                  return (
                    <li key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h5 className="font-medium">{group.name || 'Unknown'}</h5>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-semibold">{isNaN(group.percentage) ? 0 : group.percentage}%</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>            <div>
              <h4 className="text-sm font-medium text-gray-500">Most Frequent Exercises</h4>
              <ul className="mt-2 space-y-2">
                {exerciseCounts.slice(0, 5).map((exercise, index) => {
                  const uniqueKey = exercise.exercise_id || `exercise-${index}-${exercise.name || 'unknown'}`;
                  return (
                    <li key={uniqueKey} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <h5 className="font-medium">{exercise.name || 'Unknown Exercise'}</h5>
                        <p className="text-sm text-gray-500">{exercise.muscle_group || 'Unknown'}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg font-semibold">{isNaN(exercise.count) ? 0 : exercise.count}</span>
                        <span className="ml-1 text-sm text-gray-500">times</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkoutStatistics;
