
import React from "react";
import { Target, Clock, Calendar, Zap, Activity, Dumbbell, Heart, Coffee } from "lucide-react";
import { WorkoutDay } from "./types";

interface WeeklyStructureProps {
  weeklyStructure: WorkoutDay[];
}

const WeeklyStructure: React.FC<WeeklyStructureProps> = ({ weeklyStructure }) => {
  const getDayIcon = (focus: string) => {
    const focusLower = focus.toLowerCase();
    if (focusLower.includes('strength') || focusLower.includes('body')) return <Dumbbell className="h-4 w-4" />;
    if (focusLower.includes('cardio') || focusLower.includes('cardio')) return <Activity className="h-4 w-4" />;
    if (focusLower.includes('core') || focusLower.includes('stability')) return <Target className="h-4 w-4" />;
    if (focusLower.includes('rest') || focusLower.includes('recovery')) return <Coffee className="h-4 w-4" />;
    if (focusLower.includes('mobility') || focusLower.includes('recovery')) return <Heart className="h-4 w-4" />;
    return <Zap className="h-4 w-4" />;
  };

  const getDayColor = (focus: string, isToday: boolean) => {
    const focusLower = focus.toLowerCase();
    
    if (isToday) {
      return 'bg-gradient-to-br from-blue-500 to-purple-600 text-white border-blue-500';
    }
    
    if (focusLower.includes('rest') || focusLower.includes('recovery')) {
      return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-gray-200 dark:border-gray-600';
    }
    
    if (focusLower.includes('strength')) {
      return 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200 dark:border-orange-700';
    }
    
    if (focusLower.includes('cardio')) {
      return 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 border-green-200 dark:border-green-700';
    }
    
    if (focusLower.includes('core') || focusLower.includes('stability')) {
      return 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-700';
    }
    
    return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-700';
  };

  const getDayTextColor = (focus: string, isToday: boolean) => {
    if (isToday) return 'text-white';
    
    const focusLower = focus.toLowerCase();
    if (focusLower.includes('rest') || focusLower.includes('recovery')) {
      return 'text-gray-600 dark:text-gray-400';
    }
    
    if (focusLower.includes('strength')) {
      return 'text-orange-700 dark:text-orange-300';
    }
    
    if (focusLower.includes('cardio')) {
      return 'text-green-700 dark:text-green-300';
    }
    
    if (focusLower.includes('core') || focusLower.includes('stability')) {
      return 'text-purple-700 dark:text-purple-300';
    }
    
    return 'text-blue-700 dark:text-blue-300';
  };

  const getDayBadgeColor = (focus: string, isToday: boolean) => {
    if (isToday) return 'bg-white/20 text-white';
    
    const focusLower = focus.toLowerCase();
    if (focusLower.includes('rest') || focusLower.includes('recovery')) {
      return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
    
    if (focusLower.includes('strength')) {
      return 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200';
    }
    
    if (focusLower.includes('cardio')) {
      return 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200';
    }
    
    if (focusLower.includes('core') || focusLower.includes('stability')) {
      return 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200';
    }
    
    return 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200';
  };

  const today = new Date().getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Map workout plan days (Monday=0, Tuesday=1, etc.) to JavaScript Date days (Monday=1, Tuesday=2, etc.)
  const getDayNumber = (index: number) => {
    // index 0 = Monday = day 1, index 1 = Tuesday = day 2, etc.
    return index + 1;
  };

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Structure</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Your 7-day fitness journey</p>
          </div>
        </div>
        
        {/* Weekly Stats */}
        <div className="hidden md:flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Strength</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Cardio</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Core</span>
          </div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {weeklyStructure.map((day, index) => {
          const isToday = today === getDayNumber(index);
          const dayName = dayNames[index];
          
          return (
            <div 
              key={index}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                getDayColor(day.focus, isToday)
              }`}
            >
              {/* Today Badge */}
              {isToday && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                  Today
                </div>
              )}
              
              {/* Day Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getDayIcon(day.focus)}
                  <span className={`font-bold text-sm ${getDayTextColor(day.focus, isToday)}`}>
                    {dayName}
                  </span>
                </div>
              </div>
              
              {/* Workout Focus */}
              <div className="mb-3">
                <h4 className={`font-semibold text-sm mb-1 ${getDayTextColor(day.focus, isToday)}`}>
                  {day.focus}
                </h4>
              </div>
              
              {/* Duration or Rest Badge */}
              <div className="flex items-center justify-between">
                {day.duration > 0 ? (
                  <div className={`flex items-center space-x-1 ${getDayTextColor(day.focus, isToday)}`}>
                    <Clock className="h-3 w-3" />
                    <span className="text-xs font-medium">{day.duration} mins</span>
                  </div>
                ) : (
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDayBadgeColor(day.focus, isToday)}`}>
                    Rest Day
                  </div>
                )}
                
                {/* Intensity Indicator */}
                {day.duration > 0 && (
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          i < (day.duration > 45 ? 3 : day.duration > 30 ? 2 : 1)
                            ? (isToday ? 'bg-white/60' : 'bg-current opacity-60')
                            : (isToday ? 'bg-white/20' : 'bg-current opacity-20')
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Weekly Overview</h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {weeklyStructure.filter(d => d.duration > 0).length} active days • 
                {weeklyStructure.reduce((total, day) => total + day.duration, 0)} total minutes
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {weeklyStructure.filter(d => d.duration > 0).length}/7
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">Active Days</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStructure;
