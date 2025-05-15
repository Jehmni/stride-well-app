import React, { useState, useEffect } from "react";
import { Dumbbell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { WorkoutLog, SelectQueryError } from "@/models/models";
import WorkoutLogCard, { ExtendedWorkoutLog } from "@/components/workout/WorkoutLogCard";
import { toast } from "@/components/ui/use-toast";

// Type guard to check if an object is a valid WorkoutLog (not an error)
function isValidWorkoutLog(log: any): log is Omit<WorkoutLog, "workout"> & { workout?: any } {
  return log !== null && 
         typeof log === "object" && 
         !("error" in log) &&
         "id" in log && 
         typeof log.id === "string";
}

const WorkoutHistoryV2: React.FC = () => {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<ExtendedWorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutLogs();
  }, [user?.id]);
  
  // Function to fetch workout logs
  const fetchWorkoutLogs = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      console.log("Fetching workout logs for user:", user.id);
      
      // Fetch workout logs for the user
      const { data: rawWorkoutsData, error: workoutsError } = await supabase
        .from("workout_logs")
        .select(`
          id,
          user_id,
          workout_id,
          completed_at,
          duration,
          calories_burned,
          notes,
          rating,
          workout_type,
          is_custom,
          workout_name,
          workout_description,
          ai_workout_plan:workout_plans(
            id, 
            title,
            description,
            exercises
          )
        `)
        .eq("user_id", user.id)
        // Show all workout logs, not just completed ones
        .order("completed_at", { ascending: false })
        .limit(20);
        
      if (workoutsError) throw workoutsError;
      
      // Safety check and type narrowing
      if (!rawWorkoutsData) {
        throw new Error("No workout data returned");
      }
      
      // Filter out null or invalid entries and extract workout log IDs
      const workoutsData = rawWorkoutsData
        .filter(log => isValidWorkoutLog(log))
        .map(log => log as ExtendedWorkoutLog);
      const workoutLogIds: string[] = workoutsData.map(log => log.id);
      
      // Initialize map to store completed exercises by workout log ID
      let completedExercises: Record<string, any[]> = {};
      
      if (workoutLogIds.length > 0) {
        try {
          // Fetch all exercise logs in batches since we can"t use IN with too many IDs
          let allExerciseLogs: any[] = [];
          
          // Process in batches of 10 to avoid query size limits
          for (let i = 0; i < workoutLogIds.length; i += 10) {
            const batchIds = workoutLogIds.slice(i, i + 10);
            console.log(`Fetching exercise logs batch ${i/10 + 1}, IDs:`, batchIds);
            
            const { data: batchExerciseLogs, error: batchError } = await supabase
              .from("exercise_logs")
              .select(`
                id,
                workout_log_id,
                exercise_id,
                sets_completed,
                reps_completed,
                weight_used,
                notes,
                completed_at,
                exercise:exercises (
                  id,
                  name,
                  muscle_group
                )
              `)
              .in("workout_log_id", batchIds);
              
            if (batchError) {
              console.error(`Error fetching exercise logs batch ${i/10 + 1}:`, batchError);
            } else if (batchExerciseLogs) {
              console.log(`Retrieved ${batchExerciseLogs.length} exercise logs for batch ${i/10 + 1}`);
              allExerciseLogs = [...allExerciseLogs, ...batchExerciseLogs];
            }
          }
          
          if (allExerciseLogs.length > 0) {
            console.log("Raw exercise logs data:", allExerciseLogs);
            
            // Group exercise logs by workout_log_id
            completedExercises = allExerciseLogs.reduce((acc: Record<string, any[]>, item) => {
              const workout_log_id = item.workout_log_id;
              if (!acc[workout_log_id]) {
                acc[workout_log_id] = [];
              }
              acc[workout_log_id].push(item);
              return acc;
            }, {});
            
            console.log("Completed exercises data:", completedExercises);
          }
        } catch (error) {
          console.error("Error fetching exercise logs:", error);
        }
      }
      
      // Combine workout logs with their completed exercises
      const validLogs: ExtendedWorkoutLog[] = workoutsData.map(log => ({
        ...log,
        completed_exercises: completedExercises[log.id] || []
      }));
      
      console.log("Final workout logs with exercises:", validLogs);
      setWorkoutLogs(validLogs);
    } catch (error) {
      console.error("Error fetching workout logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };
  
  const runDiagnostics = async () => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Import the diagnostic tool (dynamic import to avoid loading unless needed)
      const diagnosticModule = await import('@/utils/diagnosticTools');
      
      // Run diagnostics
      const results = await diagnosticModule.diagnoseWorkoutLogs(user.id);
      setDiagnosticData(results);
      
      // Refresh the data
      await fetchWorkoutLogs();
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to sync workout history data
  const syncWorkoutHistory = async () => {
    if (!user?.id) return;
    
    try {
      setIsSyncing(true);
      
      // Call the comprehensive RPC function to sync all workout data
      const { data, error } = await supabase.rpc(
        'sync_workout_progress',
        { user_id_param: user.id, workout_id_param: '', completed_exercises_param: [] }
      );
      
      if (error) {
        console.error("Error syncing workout data:", error);
        toast({
          title: "Sync Failed",
          description: "Could not sync workout history. Please try again.",
          variant: "destructive"
        });
      } else {
        console.log("Sync result:", data);
        toast({
          title: "Sync Complete",
          description: "Your workout history has been synced successfully."
        });
        
        // Refresh the workout logs
        await fetchWorkoutLogs();
      }
    } catch (error) {
      console.error("Exception during workout history sync:", error);
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred during sync.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Dumbbell className="animate-spin h-6 w-6 mr-2" />
        <span>Loading workout history...</span>
      </div>
    );
  }

  // Empty state
  if (workoutLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <Dumbbell className="h-12 w-12 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No workout history yet</h3>
        <p className="text-gray-500 mb-6 max-w-md">
          Complete your first workout to start tracking your progress.
        </p>
        <Button variant="outline" onClick={syncWorkoutHistory} disabled={isSyncing}>
          {isSyncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>Sync Workout Data</>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold">Workout History</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={syncWorkoutHistory}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>Sync Data</>
            )}
          </Button>
          {import.meta.env.DEV && (
            <Button variant="outline" size="sm" onClick={runDiagnostics}>
              Debug
            </Button>
          )}
          <Button variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>
      
      {/* Diagnostic output for debugging */}
      {diagnosticData && import.meta.env.DEV && (
        <div className="bg-muted p-4 rounded-md mb-4 text-xs overflow-auto max-h-60">
          <pre className="whitespace-pre-wrap">{diagnosticData}</pre>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2" 
            onClick={() => setDiagnosticData(null)}
          >
            Hide
          </Button>
        </div>
      )}

      {workoutLogs.map((log) => (
        <WorkoutLogCard 
          key={log.id}
          log={log}
          isExpanded={expandedLog === log.id}
          onToggleExpand={() => toggleExpand(log.id)}
        />
      ))}
    </div>
  );
};

export default WorkoutHistoryV2;
