
import React from "react";
import { Dumbbell, Target, Activity, Zap, Clock, TrendingUp, Eye } from "lucide-react";
import { ExerciseCount, WorkoutExercise } from "./types";

interface KeyExercisesProps {
  exerciseData?: ExerciseCount[];
  exercises?: WorkoutExercise[];
  onExerciseSelect?: (exerciseId: string) => void;
}

const KeyExercises: React.FC<KeyExercisesProps> = ({ exerciseData, exercises, onExerciseSelect }) => {
  const getMuscleGroupIcon = (muscleGroup?: string) => {
    if (!muscleGroup) return <Dumbbell className="h-4 w-4" />;
    const group = muscleGroup.toLowerCase();
    if (group.includes('chest') || group.includes('upper')) return <Target className="h-4 w-4" />;
    if (group.includes('back') || group.includes('lats')) return <Activity className="h-4 w-4" />;
    if (group.includes('legs') || group.includes('quad') || group.includes('hamstring')) return <Zap className="h-4 w-4" />;
    if (group.includes('core') || group.includes('abs')) return <Target className="h-4 w-4" />;
    if (group.includes('full_body')) return <Dumbbell className="h-4 w-4" />;
    return <Dumbbell className="h-4 w-4" />;
  };

  const getMuscleGroupColor = (muscleGroup?: string) => {
    if (!muscleGroup) return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
    const group = muscleGroup.toLowerCase();
    if (group.includes('chest') || group.includes('upper')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-400';
    if (group.includes('back') || group.includes('lats')) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400';
    if (group.includes('legs') || group.includes('quad') || group.includes('hamstring')) return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-400';
    if (group.includes('core') || group.includes('abs')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-400';
    if (group.includes('full_body')) return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400';
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-400';
  };

  // If exerciseData is provided (from ExerciseDashboard), render exercise table
  if (exerciseData && exerciseData.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Most Used Exercises</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your top performing exercises</p>
            </div>
          </div>
        </div>
        
        {/* Exercise Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exerciseData.slice(0, 6).map((exercise, index) => (
            <div 
              key={exercise.exercise_id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getMuscleGroupColor(exercise.muscle_group)}`}>
                    {getMuscleGroupIcon(exercise.muscle_group)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {exercise.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {exercise.muscle_group?.replace('_', ' ') || 'General'}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {exercise.count}
                  </div>
                  <div className="text-xs text-gray-500">times</div>
                </div>
              </div>
              
              {onExerciseSelect && (
                <button 
                  onClick={() => onExerciseSelect(exercise.exercise_id)}
                  className="w-full mt-3 flex items-center justify-center space-x-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  <span>View Progress</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // If exercises is provided (from WorkoutPlan), render key exercises
  if (exercises && exercises.length > 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Key Exercises</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Focus areas for your goals</p>
            </div>
          </div>
        </div>
        
        {/* Exercise Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exercises.slice(0, 8).map((exercise, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getMuscleGroupColor(exercise.muscle)}`}>
                    {getMuscleGroupIcon(exercise.muscle)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {exercise.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {exercise.muscle?.replace('_', ' ') || 'General'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Exercise Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Dumbbell className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Sets</span>
                  </div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {exercise.sets}
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-1">
                    <Activity className="h-3 w-3 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">Reps</span>
                  </div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {exercise.reps}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100">Workout Summary</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {exercises.length} exercises • {exercises.reduce((total, ex) => total + ex.sets, 0)} total sets
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {exercises.length}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">Exercises</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback if no data is provided
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Dumbbell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No exercise data available</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Complete a workout to see your exercises</p>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center">
        <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Start your first workout to populate this section
        </p>
      </div>
    </div>
  );
};

export default KeyExercises;
