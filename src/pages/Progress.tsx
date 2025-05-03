
import React, { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutHistory from "@/components/progress/WorkoutHistory";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";

const Progress: React.FC = () => {
  const { profile } = useAuth();
  // Calculate BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  const bmiCategory = userBMI ? getBMICategory(userBMI) : null;
  
  return (
    <DashboardLayout title="Progress Tracking">
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Track your fitness journey and see how far you've come.
        </p>
      </div>
      
      {/* Health Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Current Weight</h3>
          <div className="text-2xl font-bold">{profile?.weight || "--"} kg</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Height</h3>
          <div className="text-2xl font-bold">{profile?.height || "--"} cm</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">BMI</h3>
          <div className="text-2xl font-bold">{userBMI ? userBMI.toFixed(1) : "--"}</div>
          {bmiCategory && <span className="text-sm text-gray-500">{bmiCategory}</span>}
        </div>
      </div>
      
      <Tabs defaultValue="workouts">
        <TabsList className="mb-6">
          <TabsTrigger value="workouts">Workout History</TabsTrigger>
          <TabsTrigger value="weight">Weight Tracking</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workouts">
          <WorkoutHistory />
        </TabsContent>
        
        <TabsContent value="weight">
          <div className="p-12 text-center">
            <p className="text-gray-500">Weight tracking charts coming soon!</p>
          </div>
        </TabsContent>
        
        <TabsContent value="measurements">
          <div className="p-12 text-center">
            <p className="text-gray-500">Body measurements tracking coming soon!</p>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Progress;
