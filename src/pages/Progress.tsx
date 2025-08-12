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
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Target, 
  Activity, 
  BarChart3, 
  Calendar, 
  Zap,
  Heart,
  Ruler,
  Weight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

  const getBMIColor = (bmi: number): string => {
    if (bmi < 18.5) return 'from-blue-500 to-blue-600';
    if (bmi < 25) return 'from-green-500 to-green-600';
    if (bmi < 30) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

  const getBMIBadgeVariant = (bmi: number): "default" | "secondary" | "destructive" => {
    if (bmi < 18.5) return "secondary";
    if (bmi < 25) return "default";
    if (bmi < 30) return "secondary";
    return "destructive";
  };

  return (
    <DashboardLayout title="Progress Tracking">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-8"
      >
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col lg:flex-row items-start lg:items-center gap-6 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <UserAvatar size="lg" />
          <div className="space-y-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Progress Tracking
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl">
              Track your fitness journey and see how far you've come. Monitor your workouts, 
              exercise progress, and body measurements all in one place.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <Activity className="h-4 w-4" />
              <span>Your fitness journey, visualized</span>
            </div>
          </div>
        </motion.div>
        
        {!isChecking && dbIssueType && user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <DbFixesNotice userId={user.id} />
          </motion.div>
        )}
        
        {/* Health Stats Overview */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Weight className="h-8 w-8 text-blue-200" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Current
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-2">Current Weight</h3>
            <div className="text-3xl font-bold mb-1">
              {profile?.weight || "--"} kg
            </div>
            <p className="text-blue-200 text-sm">Track your weight changes</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg"
          >
            <div className="flex items-center justify-between mb-4">
              <Ruler className="h-8 w-8 text-green-200" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Height
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-green-100 mb-2">Height</h3>
            <div className="text-3xl font-bold mb-1">
              {profile?.height || "--"} cm
            </div>
            <p className="text-green-200 text-sm">Your current height</p>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            className={`bg-gradient-to-br ${userBMI ? getBMIColor(userBMI) : 'from-gray-500 to-gray-600'} text-white p-6 rounded-xl shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <Heart className="h-8 w-8 text-white/80" />
              <Badge 
                variant={userBMI ? getBMIBadgeVariant(userBMI) : "secondary"} 
                className="bg-white/20 text-white border-white/30"
              >
                BMI
              </Badge>
            </div>
            <h3 className="text-sm font-medium text-white/80 mb-2">Body Mass Index</h3>
            <div className="text-3xl font-bold mb-1">
              {userBMI ? userBMI.toFixed(1) : "--"}
            </div>
            {bmiCategory && (
              <p className="text-white/80 text-sm capitalize">{bmiCategory}</p>
            )}
          </motion.div>
        </motion.div>

        {/* Progress Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Tabs defaultValue="workouts" className="space-y-6">
            <TabsList className="mb-6 bg-gradient-to-r from-gray-100 to-blue-100 dark:from-gray-800 dark:to-blue-900/20 p-2 rounded-xl border border-blue-200 dark:border-blue-800">
              <TabsTrigger 
                value="workouts"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Workout History
              </TabsTrigger>
              <TabsTrigger 
                value="exercises"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3"
              >
                <Activity className="h-4 w-4 mr-2" />
                Exercise Progress
              </TabsTrigger>
              <TabsTrigger 
                value="statistics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Statistics
              </TabsTrigger>
              <TabsTrigger 
                value="measurements"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 text-gray-700 dark:text-gray-300 rounded-lg px-6 py-3"
              >
                <Target className="h-4 w-4 mr-2" />
                Body Measurements
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="workouts" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <WorkoutHistoryV2 />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="exercises" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <ExerciseDashboard />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="statistics" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <WorkoutStatistics />
              </motion.div>
            </TabsContent>
            
            <TabsContent value="measurements" className="space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <MeasurementsTracker />
              </motion.div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
};

export default Progress;
