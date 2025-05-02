
import React from "react";
import { WorkoutPlan } from "./types";

interface WorkoutPlanHeaderProps {
  workoutPlan: WorkoutPlan;
}

const WorkoutPlanHeader: React.FC<WorkoutPlanHeaderProps> = ({ workoutPlan }) => {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{workoutPlan.title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {workoutPlan.description}
      </p>
    </div>
  );
};

export default WorkoutPlanHeader;
