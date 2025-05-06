
import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-10 w-10"
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-fitness-primary`} />
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
