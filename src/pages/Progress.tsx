import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutHistoryV2 from "@/components/progress/WorkoutHistoryV2";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import ExerciseDashboard from "@/components/workout/ExerciseDashboard";
import MeasurementsTracker from "@/components/progress/MeasurementsTracker";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";
import UserAvatar from "@/components/profile/UserAvatar"; 
import DbFixesNotice from "@/components/common/DbFixesNotice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Progress: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [dbIssueType, setDbIssueType] = useState<"exercise-logging" | "ai-workouts" | "both" | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  
  // Calculate BMI if height and weight are available
  const userBMI = profile ? calculateBMI(profile.height, profile.weight) : null;
  const bmiCategory = userBMI ? getBMICategory(userBMI) : null;
  
  useEffect(() => {
    const checkDatabaseConfig = async () => {
      try {
        setIsChecking(true);
        
        // Simplify the check - just query the tables directly to see if they exist
        const { data: exerciseLogs, error: exerciseError } = await supabase
          .from('exercise_logs')
          .select('id')
          .limit(1);
          
        const { data: aiConfig, error: aiError } = await supabase
          .from('ai_configurations')
          .select('id')
          .limit(1);
        
        // Determine which features need fixing
        const exerciseLogsNeeded = exerciseError && exerciseError.message.includes('does not exist');
        const aiConfigNeeded = aiError && aiError.message.includes('does not exist');
        
        if (exerciseLogsNeeded && aiConfigNeeded) {
          setDbIssueType("both");
        } else if (exerciseLogsNeeded) {
          setDbIssueType("exercise-logging");
        } else if (aiConfigNeeded) {
          setDbIssueType("ai-workouts");
        } else {
          setDbIssueType(null);
        }
      } catch (error) {
        console.error("Error checking database configuration:", error);
        setDbIssueType("both"); // Assume both need fixing if error occurs
      } finally {
        setIsChecking(false);
      }
    };
    
    checkDatabaseConfig();
  }, []);
  
  const handleApplyFixes = async () => {
    toast({
      title: "Applying database fixes...",
      description: "Please run the script: scripts/fix_everything.bat",
    });
  };

  return (
    <DashboardLayout title="Progress Tracking">
      <div className="mb-6 flex items-center gap-4">
        <UserAvatar size="md" />
        <div>
          <p className="text-gray-600 dark:text-gray-400">
            Track your fitness journey and see how far you've come.
          </p>
        </div>
      </div>
      
      {!isChecking && dbIssueType && user && (
        <DbFixesNotice userId={user.id} />
      )}
      
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
          <TabsTrigger value="exercises">Exercise Progress</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
        </TabsList>
        
        <TabsContent value="workouts">
          <WorkoutHistoryV2 />
        </TabsContent>
        
        <TabsContent value="exercises">
          <ExerciseDashboard />
        </TabsContent>
        
        <TabsContent value="statistics">
          <WorkoutStatistics />
        </TabsContent>
        
        <TabsContent value="measurements">
          <MeasurementsTracker />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Progress;
