// Model-Context Protocol Client Implementation
import { workoutHistoryFixer } from './server';

/**
 * The WorkoutHistoryClient handles the client-side interaction
 * with the MCP server for fixing workout history display issues
 */
export class WorkoutHistoryClient {
  /**
   * Checks if workout history display needs fixing
   * @returns Promise<boolean> true if fixes are needed
   */
  async checkIfNeedsFix(): Promise<boolean> {
    const validation = await workoutHistoryFixer.validateWorkoutLogs();
    
    if (!validation.success) {
      console.error("Error validating workout logs:", validation.error);
      return true; // Assume fixes are needed if we can't validate
    }
    
    return !validation.data?.valid;
  }
  
  /**
   * Applies fixes to workout history display issues and returns results
   */
  async applyFixes(): Promise<{
    success: boolean;
    message: string;
    details?: {
      typeUpdates: number;
      nameUpdates: number;
    };
  }> {
    try {
      // First check if we need to apply fixes
      const needsFix = await this.checkIfNeedsFix();
      
      if (!needsFix) {
        return {
          success: true,
          message: "No fixes needed. Workout history is already correctly configured."
        };
      }
      
      // Apply the fixes
      const result = await workoutHistoryFixer.applyFixes();
      
      if (!result.success) {
        return {
          success: false,
          message: `Failed to apply fixes: ${result.error}`
        };
      }
      
      // Check if we have workout history after applying fixes
      const historyCount = await workoutHistoryFixer.getWorkoutHistoryCount();
      
      if (!historyCount.success) {
        return {
          success: true,
          message: "Fixes applied, but couldn't verify workout history count.",
          details: {
            typeUpdates: result.data?.typeUpdates || 0,
            nameUpdates: result.data?.nameUpdates || 0
          }
        };
      }
      
      const count = historyCount.data?.count || 0;
      const countMessage = count > 0 
        ? `Found ${count} workout history records.` 
        : "No workout history records found.";
      
      return {
        success: true,
        message: `Fixes successfully applied. ${countMessage}`,
        details: {
          typeUpdates: result.data?.typeUpdates || 0,
          nameUpdates: result.data?.nameUpdates || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

// Export a singleton instance for easier import
export const workoutHistoryClient = new WorkoutHistoryClient();
