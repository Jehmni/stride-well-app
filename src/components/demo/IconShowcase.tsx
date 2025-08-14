import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  getExerciseIcon, 
  getLucideWorkoutIcon, 
  getIntensityLucideIcon,
  getDifficultyIcon 
} from '@/utils/exerciseIcons';

const IconShowcase = () => {
  // Sample exercises to demonstrate icons
  const sampleExercises = [
    'Push ups', 'Pull ups', 'Squats', 'Lunges', 'Plank', 'Burpees',
    'Bench press', 'Deadlift', 'Bicep curls', 'Tricep dips',
    'Running', 'Cycling', 'Swimming', 'Mountain climbers'
  ];

  // Workout types for Lucide icons
  const workoutTypes = [
    'strength', 'cardio', 'flexibility', 'hiit', 'running', 
    'cycling', 'swimming', 'climbing', 'progress', 'stats'
  ];

  // Intensity levels
  const intensityLevels = [
    { level: 'low', value: 2 },
    { level: 'medium', value: 5 },
    { level: 'high', value: 7 },
    { level: 'extreme', value: 9 }
  ];

  // Difficulty levels
  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  return (
    <div className="p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Icon System Showcase</h1>
        <p className="text-gray-600">Comprehensive icon options for your fitness app</p>
      </div>

      {/* Exercise Emoji Icons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🏋️</span>
            <span>Exercise Emoji Icons (Current System)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sampleExercises.map((exercise, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                <span className="text-2xl">{getExerciseIcon(exercise)}</span>
                <span className="text-sm font-medium">{exercise}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lucide React Icons for UI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>⚡</span>
            <span>Lucide React Icons (UI Elements)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {workoutTypes.map((type, index) => {
              const IconComponent = getLucideWorkoutIcon(type);
              return (
                <div key={index} className="flex flex-col items-center space-y-2 p-3 border rounded-lg">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-medium capitalize">{type}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Intensity Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🔥</span>
            <span>Intensity Level Icons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {intensityLevels.map((intensity, index) => {
              const IconComponent = getIntensityLucideIcon(intensity.level);
              return (
                <div key={index} className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
                  <IconComponent className={`h-8 w-8 ${
                    intensity.level === 'low' ? 'text-green-500' :
                    intensity.level === 'medium' ? 'text-yellow-500' :
                    intensity.level === 'high' ? 'text-orange-500' :
                    'text-red-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{intensity.level}</span>
                  <Badge variant="outline">{intensity.value}/10</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Difficulty Icons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎯</span>
            <span>Difficulty Level Icons</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {difficultyLevels.map((difficulty, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 p-4 border rounded-lg">
                <span className="text-3xl">{getDifficultyIcon(difficulty)}</span>
                <span className="text-sm font-medium capitalize">{difficulty}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons with Icons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>🎮</span>
            <span>Interactive Elements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button className="flex items-center space-x-2">
              {React.createElement(getLucideWorkoutIcon('play'), { className: 'h-4 w-4' })}
              <span>Start Workout</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              {React.createElement(getLucideWorkoutIcon('pause'), { className: 'h-4 w-4' })}
              <span>Pause</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              {React.createElement(getLucideWorkoutIcon('stats'), { className: 'h-4 w-4' })}
              <span>View Stats</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              {React.createElement(getLucideWorkoutIcon('achievement'), { className: 'h-4 w-4' })}
              <span>Achievements</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>💡</span>
            <span>Usage Examples</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <h4 className="font-medium mb-2">Exercise Lists</h4>
              <div className="flex items-center space-x-3">
                <span className="text-xl">{getExerciseIcon('Push ups')}</span>
                <span>Push ups - 3 sets × 15 reps</span>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <h4 className="font-medium mb-2">Workout Cards</h4>
              <div className="flex items-center space-x-3">
                {React.createElement(getLucideWorkoutIcon('strength'), { className: 'h-5 w-5 text-blue-600' })}
                <span>Upper Body Strength Training</span>
                {React.createElement(getIntensityLucideIcon('high'), { className: 'h-4 w-4 text-red-500' })}
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
              <h4 className="font-medium mb-2">Progress Indicators</h4>
              <div className="flex items-center space-x-3">
                {React.createElement(getLucideWorkoutIcon('progress'), { className: 'h-5 w-5 text-green-600' })}
                <span>+15% improvement this week</span>
                <span className="text-lg">{getDifficultyIcon('intermediate')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IconShowcase;
