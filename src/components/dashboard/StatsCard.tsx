
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  change,
  className = ""
}) => {
  return (
    <Card className={`hover:shadow-lg transition-all duration-300 touch-manipulation ${className}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1 mr-3">
            <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </p>
            <p className="text-xl sm:text-2xl font-bold mt-1 truncate">
              {value}
            </p>
            {description && (
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {description}
              </p>
            )}
            {change && (
              <div className={`flex items-center mt-2 text-xs sm:text-sm ${
                change.isPositive 
                ? "text-green-600" 
                : "text-red-600"
              }`}>
                <span className="font-medium">
                  {change.isPositive ? "+" : "-"}{Math.abs(change.value)}%
                </span>
                <span className="ml-1 hidden sm:inline">from last week</span>
                <span className="ml-1 sm:hidden">vs last week</span>
              </div>
            )}
          </div>
          <div className="p-2 sm:p-3 rounded-full bg-fitness-primary bg-opacity-10 flex-shrink-0">
            {React.cloneElement(icon as React.ReactElement, { 
              size: 18, 
              className: "sm:w-6 sm:h-6" 
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
