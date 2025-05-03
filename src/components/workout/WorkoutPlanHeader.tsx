
import React from "react";
import { WorkoutPlan } from "./types";

interface WorkoutPlanHeaderProps {
  workoutPlan?: WorkoutPlan;
  fitnessGoal?: string;
}

const WorkoutPlanHeader: React.FC<WorkoutPlanHeaderProps> = ({ workoutPlan, fitnessGoal }) => {
  // Define default values based on fitness goal if workoutPlan is not provided
  const title = workoutPlan?.title || getWorkoutTitleByGoal(fitnessGoal || 'general-fitness');
  const description = workoutPlan?.description || getWorkoutDescriptionByGoal(fitnessGoal || 'general-fitness');

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {description}
      </p>
    </div>
  );
};

// Helper functions to get title based on fitness goal
const getWorkoutTitleByGoal = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return 'Fat Loss Program';
    case 'muscle-gain':
      return 'Muscle Building Program';
    case 'endurance':
      return 'Endurance Training Program';
    default:
      return 'General Fitness Program';
  }
};

// Helper functions to get description based on fitness goal
const getWorkoutDescriptionByGoal = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return 'A high-intensity program designed to maximize calorie burn and promote fat loss.';
    case 'muscle-gain':
      return 'Progressive overload training focused on building muscle mass and strength.';
    case 'endurance':
      return 'Structured workouts to improve cardiovascular endurance and stamina.';
    default:
      return 'A balanced approach to fitness incorporating strength, cardio, and flexibility training.';
  }
};

export default WorkoutPlanHeader;
