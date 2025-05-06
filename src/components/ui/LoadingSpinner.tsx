import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-fitness-primary" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner; 