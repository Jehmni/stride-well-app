
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
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 touch-manipulation">
      <div 
        className="h-32 sm:h-40 bg-cover bg-center" 
        style={{ backgroundImage: `url(${image})` }}
      />
      <CardContent className="p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold mb-2 line-clamp-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base line-clamp-2">{description}</p>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="flex items-center space-x-1">
              <Clock size={14} className="sm:w-4 sm:h-4" />
              <span>{duration} mins</span>
            </div>
            <div>
              <span>{exercises} exercises</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarDays size={14} className="sm:w-4 sm:h-4" />
            <span>{date}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-6 pt-0">
        <Button 
          className="w-full fitness-button-primary h-10 sm:h-auto touch-manipulation"
          onClick={onClick}
        >
          <span className="text-sm sm:text-base">Start Workout</span>
          <ChevronRight size={16} className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkoutCard;
