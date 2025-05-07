
import React, { useState, useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutHistory from "@/components/progress/WorkoutHistory";
import WorkoutStatistics from "@/components/workout/WorkoutStatistics";
import ExerciseDashboard from "@/components/workout/ExerciseDashboard";
import { useAuth } from "@/hooks/useAuth";
import { calculateBMI, getBMICategory } from "@/utils/healthCalculations";
import UserAvatar from "@/components/profile/UserAvatar"; 
import DbFixesNotice from "@/components/common/DbFixesNotice";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Progress: React.FC = () => {
  const { profile } = useAuth();
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
        
        // Check exercise logging function
        const { data: loggingCheck, error: loggingError } = await supabase.rpc('exec_sql', {
          sql: "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_exercise_completion');"
        });
        
        // Check AI workout configuration
        const { data: aiCheck, error: aiError } = await supabase.rpc('exec_sql', {
          sql: "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_configurations');"
        });
        
        // Process logging check response - handle array or object response
        const loggingCheckData = loggingCheck && Array.isArray(loggingCheck) && loggingCheck.length > 0 
          ? loggingCheck[0] as Record<string, any> 
          : null;
          
        const loggingOk = loggingCheckData && 
          (loggingCheckData.exists === true || 
           loggingCheckData.exists === 'true' || 
           loggingCheckData.exists === 't') && 
          !loggingError;
          
        // Process AI check response - handle array or object response  
        const aiCheckData = aiCheck && Array.isArray(aiCheck) && aiCheck.length > 0 
          ? aiCheck[0] as Record<string, any> 
          : null;
          
        const aiOk = aiCheckData && 
          (aiCheckData.exists === true || 
           aiCheckData.exists === 'true' || 
           aiCheckData.exists === 't') && 
          !aiError;
        
        if (!loggingOk && !aiOk) {
          setDbIssueType("both");
        } else if (!loggingOk) {
          setDbIssueType("exercise-logging");
        } else if (!aiOk) {
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
      description: "Please run the script: scripts/apply_database_fixes.bat",
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
      
      {!isChecking && dbIssueType && (
        <DbFixesNotice 
          hasIssues={true} 
          issueType={dbIssueType} 
          onFixClick={handleApplyFixes}
        />
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
          <WorkoutHistory />
        </TabsContent>
        
        <TabsContent value="exercises">
          <ExerciseDashboard />
        </TabsContent>
        
        <TabsContent value="statistics">
          <WorkoutStatistics />
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
