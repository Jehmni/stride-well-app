
import React from "react";
import { 
  CalendarDays, 
  ChevronRight, 
  Clock 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface WorkoutCardProps {
  title: string;
  description: string;
  duration: number; // duration in minutes
  exercises: number;
  date: string;
  image: string;
  onClick?: () => void;
}

const WorkoutCard: React.FC<WorkoutCardProps> = ({
  title,
  description,
  duration,
  exercises,
  date,
  image,
  onClick
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div 
        className="h-40 bg-cover bg-center" 
        style={{ backgroundImage: `url(${image})` }}
      />
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-1">
            <Clock size={16} />
            <span>{duration} mins</span>
          </div>
          <div>
            <span>{exercises} exercises</span>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarDays size={16} />
            <span>{date}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          className="w-full fitness-button-primary"
          onClick={onClick}
        >
          Start Workout
          <ChevronRight size={16} className="ml-2" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutCard;
