import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EnhancedAIWorkoutForm from "@/components/ai/EnhancedAIWorkoutForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const CreateAIWorkout: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout title="Create AI Workout Plan">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">AI Workout Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Let our AI create a personalized workout plan based on your fitness profile and preferences.
        </p>
      </div>

      <EnhancedAIWorkoutForm />
    </DashboardLayout>
  );
};

export default CreateAIWorkout; 