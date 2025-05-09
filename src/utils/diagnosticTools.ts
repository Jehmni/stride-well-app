import { supabase } from "@/integrations/supabase/client";

/**
 * Diagnostic function to check workout log data for a user
 * This helps identify issues with workout logs and exercises
 */
export const diagnoseWorkoutLogs = async (userId: string): Promise<string> => {
  if (!userId) return "No user ID provided";
  
  try {
    const results: string[] = [];
    results.push(`Diagnostic check for user ${userId} at ${new Date().toISOString()}`);
    
    // 1. Check workout logs
    const { data: workoutLogs, error: logsError } = await supabase
      .from("workout_logs")
      .select("id, workout_id, completed_at, workout_type, is_custom, workout_name")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(10);
      
    if (logsError) {
      results.push(`⚠️ Error fetching workout logs: ${logsError.message}`);
    } else {
      results.push(`Found ${workoutLogs.length} workout logs`);
      
      workoutLogs.forEach((log, i) => {
        results.push(`Log ${i+1}: ID=${log.id}, WorkoutType=${log.workout_type || 'undefined'}, IsCustom=${log.is_custom || false}, Date=${log.completed_at}`);
      });
    }
    
    // 2. Check exercise logs linked to workout logs
    if (workoutLogs && workoutLogs.length > 0) {
      const workoutLogIds = workoutLogs.map(log => log.id);
      
      const { data: exerciseLogs, error: exError } = await supabase
        .from("exercise_logs")
        .select("id, workout_log_id, exercise_id, sets_completed, reps_completed")
        .in("workout_log_id", workoutLogIds.slice(0, 5));
        
      if (exError) {
        results.push(`⚠️ Error fetching exercise logs: ${exError.message}`);
      } else {
        results.push(`Found ${exerciseLogs.length} exercise logs associated with recent workouts`);
        
        // Group exercise logs by workout_log_id
        const exercisesByWorkout: Record<string, number> = {};
        exerciseLogs.forEach(ex => {
          exercisesByWorkout[ex.workout_log_id] = (exercisesByWorkout[ex.workout_log_id] || 0) + 1;
        });
        
        Object.entries(exercisesByWorkout).forEach(([logId, count]) => {
          results.push(`Workout log ${logId} has ${count} exercise logs`);
        });
      }
    }
    
    // 3. Check workouts table
    const { data: workouts, error: workoutsError } = await supabase
      .from("workouts")
      .select("id, name")
      .eq("user_id", userId)
      .limit(10);
      
    if (workoutsError) {
      results.push(`⚠️ Error fetching workouts: ${workoutsError.message}`);
    } else {
      results.push(`Found ${workouts.length} workouts created by the user`);
    }
    
    // 4. Check workout plans
    const { data: plans, error: plansError } = await supabase
      .from("workout_plans")
      .select("id, title, ai_generated")
      .eq("user_id", userId)
      .limit(10);
      
    if (plansError) {
      results.push(`⚠️ Error fetching workout plans: ${plansError.message}`);
    } else if (plans && plans.length > 0) {
      results.push(`Found ${plans.length} workout plans for the user`);
      plans.forEach((plan, i) => {
        results.push(`Plan ${i+1}: ${plan.title} (AI Generated: ${plan.ai_generated ? 'Yes' : 'No'})`);
      });
    } else {
      results.push("⚠️ No workout plans found for this user");
    }
    
    return results.join("\n");
  } catch (error) {
    console.error("Error in diagnostics:", error);
    return `Diagnostic error: ${error instanceof Error ? error.message : String(error)}`;
  }
};

/**
 * Clear workout history for testing
 * USE WITH CAUTION - this will delete all workout data for a user
 */
export const clearWorkoutHistory = async (userId: string): Promise<string> => {
  if (!userId) return "No user ID provided";
  
  try {
    // 1. First get all workout log IDs
    const { data: workoutLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", userId);
      
    if (!workoutLogs || workoutLogs.length === 0) {
      return "No workout logs found to delete";
    }
    
    const workoutLogIds = workoutLogs.map(log => log.id);
    
    // 2. Delete all exercise logs associated with these workout logs
    const { error: exDeleteError } = await supabase
      .from("exercise_logs")
      .delete()
      .in("workout_log_id", workoutLogIds);
      
    if (exDeleteError) {
      return `Error deleting exercise logs: ${exDeleteError.message}`;
    }
    
    // 3. Delete all workout logs
    const { error: logDeleteError } = await supabase
      .from("workout_logs")
      .delete()
      .eq("user_id", userId);
      
    if (logDeleteError) {
      return `Error deleting workout logs: ${logDeleteError.message}`;
    }
    
    // 4. Delete workout plans for the user
    const { error: planDeleteError } = await supabase
      .from("workout_plans")
      .delete()
      .eq("user_id", userId);
      
    return `Successfully deleted ${workoutLogs.length} workout logs and associated data`;
  } catch (error) {
    console.error("Error clearing workout history:", error);
    return `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
};
