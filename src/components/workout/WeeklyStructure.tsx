
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
      {/* Header with Summary - Enhanced for Desktop */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">Weekly Structure</h3>
            <p className="text-gray-600 dark:text-gray-400">Your 7-day fitness journey</p>
          </div>
        </div>
        
        {/* Enhanced Weekly Stats for Desktop */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 lg:gap-6">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Strength</span>
              <span className="text-xs bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 px-2 py-0.5 rounded-full">
                {weeklyStructure.filter(d => d.focus.toLowerCase().includes('strength')).length}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Cardio</span>
              <span className="text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full">
                {weeklyStructure.filter(d => d.focus.toLowerCase().includes('cardio')).length}
              </span>
            </div>
            <div className="flex items-center space-x-2 bg-purple-100 dark:bg-purple-900/30 px-3 py-2 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Core</span>
              <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded-full">
                {weeklyStructure.filter(d => d.focus.toLowerCase().includes('core')).length}
              </span>
            </div>
          </div>
          
          {/* Quick stats for large screens */}
          <div className="hidden xl:flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                {weeklyStructure.reduce((total, day) => total + day.duration, 0)} min/week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Grid - Stacked Layout for Maximum Space */}
      <div className="flex flex-col space-y-4">
        {weeklyStructure.map((day, index) => {
          const isToday = today === getDayNumber(index);
          const dayName = dayNames[index];
          
          return (
            <div 
              key={index}
              className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-default ${
                getDayColor(day.focus, isToday)
              } ${isToday ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background' : ''}`}
            >
              {/* Today Badge */}
              {isToday && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg animate-pulse">
                  Today
                </div>
              )}
              
              {/* Day Header with Enhanced Layout */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${isToday ? 'bg-white/20' : 'bg-current/10'}`}>
                    {getDayIcon(day.focus)}
                  </div>
                  <div>
                    <span className={`font-bold text-lg ${getDayTextColor(day.focus, isToday)}`}>
                      {dayName}
                    </span>
                    <h4 className={`font-semibold text-xl mt-1 leading-tight ${getDayTextColor(day.focus, isToday)}`}>
                      {day.focus}
                    </h4>
                  </div>
                </div>
                
                {/* Duration and Intensity on the Right */}
                <div className="flex items-center space-x-6">
                  {day.duration > 0 ? (
                    <>
                      <div className={`flex items-center space-x-2 ${getDayTextColor(day.focus, isToday)}`}>
                        <Clock className="h-5 w-5" />
                        <span className="text-lg font-bold">{day.duration} mins</span>
                      </div>
                      
                      {/* Intensity Indicator */}
                      <div className="flex flex-col items-center space-y-2">
                        <div className="flex space-x-1">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                i < (day.duration > 45 ? 3 : day.duration > 30 ? 2 : 1)
                                  ? (isToday ? 'bg-white/70' : 'bg-current opacity-70')
                                  : (isToday ? 'bg-white/25' : 'bg-current opacity-25')
                              }`}
                            />
                          ))}
                        </div>
                        <div className={`text-sm font-medium ${getDayTextColor(day.focus, isToday)} opacity-60`}>
                          {day.duration > 45 ? 'High' : day.duration > 30 ? 'Med' : 'Low'}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`px-4 py-2 rounded-full text-sm font-bold ${getDayBadgeColor(day.focus, isToday)}`}>
                      Rest Day
                    </div>
                  )}
                </div>
              </div>
              
              {/* Workout Details */}
              {day.duration > 0 && (
                <div className="mb-4">
                  <p className={`text-base opacity-75 ${getDayTextColor(day.focus, isToday)}`}>
                    {day.duration < 30 ? 'Quick session - Light and efficient workout' : 
                     day.duration < 45 ? 'Standard workout - Balanced training session' : 
                     'Intensive training - Comprehensive workout session'}
                  </p>
                </div>
              )}
              
              {/* Hover Effect for Desktop */}
              <div className="hidden lg:block absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* Weekly Summary - Enhanced for Desktop */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950/50 dark:via-indigo-950/50 dark:to-purple-950/50 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-lg text-blue-900 dark:text-blue-100">Weekly Overview</h4>
              <p className="text-blue-700 dark:text-blue-300">
                <span className="font-semibold">{weeklyStructure.filter(d => d.duration > 0).length} active days</span> • 
                <span className="font-semibold ml-2">{weeklyStructure.reduce((total, day) => total + day.duration, 0)} total minutes</span>
              </p>
            </div>
          </div>
          
          {/* Desktop-optimized stats grid */}
          <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-8">
            <div className="flex items-center justify-between lg:justify-start lg:space-x-6">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {weeklyStructure.filter(d => d.duration > 0).length}
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active Days</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(weeklyStructure.reduce((total, day) => total + day.duration, 0) / 60)}h
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">Total Time</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Math.round(weeklyStructure.reduce((total, day) => total + day.duration, 0) / weeklyStructure.filter(d => d.duration > 0).length) || 0}m
                </div>
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Avg Session</div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="hidden lg:flex items-center space-x-2">
              <div className="w-24 h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
                  style={{ width: `${(weeklyStructure.filter(d => d.duration > 0).length / 7) * 100}%` }}
                />
              </div>
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                {Math.round((weeklyStructure.filter(d => d.duration > 0).length / 7) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyStructure;