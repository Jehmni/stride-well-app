import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Dumbbell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  muscle: string;
}

interface WorkoutWeeklyScheduleProps {
  weeklyStructure: WorkoutDay[];
  exercises?: Exercise[];
  showDetails?: boolean;
  className?: string;
}

const WorkoutWeeklySchedule: React.FC<WorkoutWeeklyScheduleProps> = ({
  weeklyStructure,
  exercises = [],
  showDetails = false,
  className
}) => {
  const today = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
  const todayAdjusted = today === 0 ? 6 : today - 1; // Convert to 0 (Monday) to 6 (Sunday)
  
  // Get exercises for a specific focus area
  const getExercisesForFocus = (focus: string): Exercise[] => {
    if (!exercises.length) return [];
    
    // Simple matching - in a real app you might want more sophisticated matching
    const focusLower = focus.toLowerCase();
    return exercises.filter(exercise => {
      const muscleLower = exercise.muscle.toLowerCase();
      
      // Direct muscle group matches
      if (focusLower.includes(muscleLower)) return true;
      
      // Handle special cases
      if (focusLower.includes('upper body') && 
          ['chest', 'back', 'shoulders', 'arms', 'biceps', 'triceps'].some(m => muscleLower.includes(m))) {
        return true;
      }
      
      if (focusLower.includes('lower body') && 
          ['legs', 'quads', 'hamstrings', 'glutes', 'calves'].some(m => muscleLower.includes(m))) {
        return true;
      }
      
      if (focusLower.includes('core') && 
          ['abs', 'core', 'abdominals'].some(m => muscleLower.includes(m))) {
        return true;
      }
      
      if (focusLower.includes('full body')) return true;
      
      return false;
    });
  };
  
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-3", className)}>
      {weeklyStructure.map((day, index) => (
        <Card 
          key={day.day}
          className={cn(
            "h-full transition-all",
            index === todayAdjusted ? "ring-2 ring-primary" : "",
            day.duration === 0 ? "opacity-60" : ""
          )}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="font-medium">{day.day}</div>
              {index === todayAdjusted && (
                <Badge variant="secondary" className="text-xs">Today</Badge>
              )}
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Dumbbell className="w-4 h-4 mr-1" />
              <span>{day.focus}</span>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                {day.duration === 0 
                  ? "Rest Day" 
                  : `${day.duration} minutes`}
              </span>
            </div>
            
            {showDetails && day.duration > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <h4 className="text-xs font-medium mb-2">Suggested Exercises:</h4>
                <ul className="text-xs space-y-1">
                  {getExercisesForFocus(day.focus).slice(0, 4).map(exercise => (
                    <li key={exercise.id} className="text-muted-foreground">
                      {exercise.name} ({exercise.sets} × {exercise.reps})
                    </li>
                  ))}
                  {getExercisesForFocus(day.focus).length === 0 && (
                    <li className="text-muted-foreground italic">
                      No specific exercises assigned
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default WorkoutWeeklySchedule; 