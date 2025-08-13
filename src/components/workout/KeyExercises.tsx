
import React from "react";
import { Dumbbell, Target, Activity, Zap, Clock, TrendingUp, Eye } from "lucide-react";
import { ExerciseCount, WorkoutExercise } from "./types";
import { getExerciseIcon } from "@/utils/exerciseIcons";

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
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                      <span className="text-lg">{getExerciseIcon(exercise.name)}</span>
                      <span>{exercise.name}</span>
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
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center space-x-2">
                      <span className="text-lg">{getExerciseIcon(exercise.name)}</span>
                      <span>{exercise.name}</span>
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

        {/* Additional Workout Insights - Fills white space */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Muscle Group Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Muscle Focus</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Target distribution</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const muscleGroups = exercises.reduce((acc, ex) => {
                  const muscle = ex.muscle || 'general';
                  acc[muscle] = (acc[muscle] || 0) + ex.sets;
                  return acc;
                }, {} as Record<string, number>);
                
                return Object.entries(muscleGroups).slice(0, 4).map(([muscle, sets]) => (
                  <div key={muscle} className="flex items-center justify-between">
                    <span className="text-xs capitalize text-gray-600 dark:text-gray-400">
                      {muscle.replace('_', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((sets / Math.max(...Object.values(muscleGroups))) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{sets}</span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Workout Intensity */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Intensity Metrics</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">Workout breakdown</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Total Volume</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {exercises.reduce((total, ex) => {
                    const avgReps = typeof ex.reps === 'string' ? 
                      (parseInt(ex.reps.split('-')[0]) + parseInt(ex.reps.split('-')[1] || ex.reps.split('-')[0])) / 2 :
                      ex.reps;
                    return total + (ex.sets * avgReps);
                  }, 0)} reps
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Est. Duration</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {Math.round(exercises.length * 2.5)} min
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Complexity</span>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < Math.min(Math.ceil(exercises.length / 3), 5)
                          ? 'bg-green-500'
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout Tips & Recommendations */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Pro Tips</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">Maximize your workout effectiveness</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Rest Between Sets</h5>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {exercises.some(ex => ex.muscle?.includes('strength')) ? '2-3 minutes' : '1-2 minutes'}
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Form Focus</h5>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Quality over quantity - control the movement
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Progression</h5>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Increase weight when you can complete all sets
              </p>
            </div>
            
            <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
              <h5 className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-1">Warm-up</h5>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                5-10 minutes before starting exercises
              </p>
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
