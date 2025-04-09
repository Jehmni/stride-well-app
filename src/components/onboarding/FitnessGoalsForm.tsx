
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import OnboardingLayout from "./OnboardingLayout";

interface GoalOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FitnessGoalsForm: React.FC = () => {
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const navigate = useNavigate();

  const goals: GoalOption[] = [
    {
      id: "weight-loss",
      title: "Weight Loss",
      description: "Burn fat and improve overall health",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <polyline points="19 12 12 19 5 12"></polyline>
        </svg>
      )
    },
    {
      id: "muscle-gain",
      title: "Muscle Gain",
      description: "Build strength and increase muscle mass",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
        </svg>
      )
    },
    {
      id: "general-fitness",
      title: "General Fitness",
      description: "Improve overall health and fitness level",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
        </svg>
      )
    },
    {
      id: "endurance",
      title: "Endurance",
      description: "Improve stamina and cardiovascular health",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
          <line x1="16" y1="8" x2="2" y2="22"></line>
          <line x1="17.5" y1="15" x2="9" y2="15"></line>
        </svg>
      )
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoal) return;
    
    // Get existing user profile data
    const userProfileString = localStorage.getItem("userProfile");
    const userProfile = userProfileString ? JSON.parse(userProfileString) : {};
    
    // Add fitness goal to user profile
    localStorage.setItem("userProfile", JSON.stringify({
      ...userProfile,
      fitnessGoal: selectedGoal
    }));
    
    localStorage.setItem("isOnboarded", "true");
    navigate("/dashboard");
  };

  return (
    <OnboardingLayout
      title="Your Fitness Goals"
      subtitle="What do you want to achieve?"
      step={2}
      totalSteps={2}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {goals.map((goal) => (
            <div 
              key={goal.id}
              className={`cursor-pointer relative ${
                selectedGoal === goal.id 
                  ? "ring-2 ring-fitness-primary" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
              onClick={() => setSelectedGoal(goal.id)}
            >
              <Card className="p-4 transition-all duration-200">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full ${
                    selectedGoal === goal.id 
                      ? "bg-fitness-primary text-white" 
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  }`}>
                    {goal.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {goal.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {goal.description}
                    </p>
                  </div>
                  {selectedGoal === goal.id && (
                    <div className="absolute top-4 right-4 p-1 bg-fitness-primary rounded-full">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          ))}
        </div>

        <div>
          <Button
            type="submit"
            disabled={!selectedGoal}
            className="w-full fitness-button-primary"
          >
            Complete Setup
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default FitnessGoalsForm;
