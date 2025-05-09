import React from 'react';
import { Activity, Dumbbell, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WorkoutStatsDisplayProps {
  title: string;
  totalWorkouts: number;
  lastWorkoutDate?: string;
  avgWorkoutDuration?: number;
  showPlaceholder?: boolean;
}

/**
 * Component for displaying workout statistics
 */
const WorkoutStatsDisplay: React.FC<WorkoutStatsDisplayProps> = ({
  title,
  totalWorkouts,
  lastWorkoutDate,
  avgWorkoutDuration,
  showPlaceholder = false
}) => {
  if (showPlaceholder) {
    return (
      <Card className="bg-muted/40">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <Dumbbell className="h-12 w-12 mb-4 text-muted-foreground/60" />
          <h3 className="text-lg font-semibold text-muted-foreground">No workout data yet</h3>
          <p className="text-sm text-muted-foreground/80 mt-1">
            Complete your first workout to see your stats
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-3 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
              <p className="font-medium">{totalWorkouts}</p>
            </div>
          </div>
          
          {lastWorkoutDate && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Last Workout</p>
                <p className="font-medium">{lastWorkoutDate}</p>
              </div>
            </div>
          )}
          
          {avgWorkoutDuration !== undefined && (
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-3 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Duration</p>
                <p className="font-medium">{avgWorkoutDuration} mins</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkoutStatsDisplay;
