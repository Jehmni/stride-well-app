
import React from "react";
import { Target, Clock } from "lucide-react";
import { WorkoutDay } from "./types";

interface WeeklyStructureProps {
  weeklyStructure: WorkoutDay[];
}

const WeeklyStructure: React.FC<WeeklyStructureProps> = ({ weeklyStructure }) => {
  return (
    <div className="bg-fitness-primary bg-opacity-10 p-6 rounded-lg mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Target className="mr-2 h-5 w-5" />
        Weekly Structure
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {weeklyStructure.map((day, index) => (
          <div 
            key={index}
            className={`p-4 rounded-lg border ${
              new Date().getDay() === (index + 1) % 7 ? 
              'border-fitness-primary bg-fitness-primary bg-opacity-5' : 
              'border-gray-200 dark:border-gray-700'
            }`}
          >
            <p className="font-medium">{day.day}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{day.focus}</p>
            {day.duration > 0 ? (
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>{day.duration} mins</span>
              </div>
            ) : (
              <div className="mt-2 text-xs text-gray-500">Rest Day</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyStructure;
