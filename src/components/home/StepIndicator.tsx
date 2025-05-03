
import React from "react";

interface StepIndicatorProps {
  step: number;
  title: string;
  description: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ step, title, description }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-fitness-primary text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {step}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default StepIndicator;
