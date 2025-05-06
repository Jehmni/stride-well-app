
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
  trend?: "up" | "down" | "neutral";  // Add trending direction
  trendValue?: string;                // Add trending value as string
  loading?: boolean;                  // Add loading state
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  change,
  className = "",
  trend,
  trendValue,
  loading = false
}) => {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            {loading ? (
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
            ) : (
              <p className="text-2xl font-bold mt-1">
                {value}
              </p>
            )}
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
            {trendValue && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === "up" 
                ? "text-green-600" 
                : trend === "down"
                ? "text-red-600"
                : "text-gray-500"
              }`}>
                <span className="font-medium">
                  {trendValue}
                </span>
              </div>
            )}
            {change && (
              <div className={`flex items-center mt-2 text-sm ${
                change.isPositive 
                ? "text-green-600" 
                : "text-red-600"
              }`}>
                <span className="font-medium">
                  {change.isPositive ? "+" : "-"}{Math.abs(change.value)}%
                </span>
                <span className="ml-1">from last week</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-full bg-fitness-primary bg-opacity-10">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
