
import React from "react";
import { Dumbbell } from "lucide-react";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  step: number;
  totalSteps: number;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  step,
  totalSteps
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-fitness-primary rounded-full">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        
        <div className="relative mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-fitness-primary rounded-full transition-all duration-300" 
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
          <div className="mt-2 text-sm text-gray-500 text-right">
            Step {step} of {totalSteps}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;
