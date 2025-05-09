// Model-Context Protocol Server Implementation
import { supabase } from '@/integrations/supabase/client';

/**
 * MCP - Model Context Protocol server implementation
 * This provides a cleaner abstraction for fixing workout history display issues
 */

interface MCPResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * The WorkoutHistoryFixer handles fixing workout history display issues
 * using the Model-Context Protocol pattern
 */
export class WorkoutHistoryFixer {
  /**
   * Validates if workout logs are properly configured
   * @returns Promise with validation results
   */
  async validateWorkoutLogs(): Promise<MCPResponse<{ 
    valid: boolean, 
    missingColumns: string[],
    incorrectTypeCount: number 
  }>> {
    try {
      // Check for required columns
      const { data: columnInfo, error: columnError } = await supabase.rpc(
        'exec_sql',
        { 
          sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'workout_logs'
          `
        }
      );

      if (columnError) {
        return { 
          success: false, 
          error: `Failed to check table structure: ${columnError.message}` 
        };
      }

      // Transform column data to map
      const columns = new Map();
      if (Array.isArray(columnInfo)) {
        columnInfo.forEach(col => {
          columns.set(col.column_name, col.data_type);
        });
      }

      // Check for required columns
      const requiredColumns = [
        { name: 'workout_type', type: 'character varying' },
        { name: 'is_custom', type: 'boolean' },
        { name: 'workout_name', type: 'character varying' }
      ];

      const missingColumns = requiredColumns.filter(col => !columns.has(col.name));
      
      // Check for incorrect workout type values
      const { data: incorrectTypes, error: typeError } = await supabase.rpc(
        'exec_sql',
        { 
          sql: `
          SELECT COUNT(*) as count
          FROM workout_logs
          WHERE workout_type IS NULL 
             OR workout_type = ''
             OR (workout_type = 'completed' AND is_custom = true)
          `
        }
      );

      if (typeError) {
        return { 
          success: false, 
          error: `Failed to check workout types: ${typeError.message}` 
        };
      }

      const incorrectTypeCount = Array.isArray(incorrectTypes) && incorrectTypes.length > 0
        ? parseInt(incorrectTypes[0].count)
        : 0;

      return {
        success: true,
        data: {
          valid: missingColumns.length === 0 && incorrectTypeCount === 0,
          missingColumns: missingColumns.map(col => col.name),
          incorrectTypeCount
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Applies fixes to workout history display issues
   * @returns Promise with fix results
   */
  async applyFixes(): Promise<MCPResponse<{ 
    columnsFix: boolean, 
    typeUpdates: number,
    nameUpdates: number
  }>> {
    try {
      // Step 1: Add missing columns
      const { error: columnsError } = await supabase.rpc(
        'exec_sql',
        { 
          sql: `
          ALTER TABLE workout_logs 
          ADD COLUMN IF NOT EXISTS workout_type VARCHAR DEFAULT 'completed',
          ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS workout_name VARCHAR DEFAULT NULL;
          `
        }
      );

      if (columnsError) {
        return { 
          success: false, 
          error: `Failed to add columns: ${columnsError.message}` 
        };
      }

      // Step 2: Update workout types
      const { data: typeUpdateResult, error: typeUpdateError } = await supabase.rpc(
        'exec_sql',
        { 
          sql: `
          UPDATE workout_logs
          SET workout_type = 'completed',
              is_custom = false
          WHERE workout_type IS NULL 
             OR workout_type = ''
             OR (workout_type = 'completed' AND is_custom = true)
          RETURNING id;
          `
        }
      );

      if (typeUpdateError) {
        return { 
          success: false, 
          error: `Failed to update workout types: ${typeUpdateError.message}` 
        };
      }

      // Step 3: Add workout names
      const { data: nameUpdateResult, error: nameUpdateError } = await supabase.rpc(
        'exec_sql',
        { 
          sql: `
          WITH updates AS (
            -- First update from related workouts
            UPDATE workout_logs wl
            SET workout_name = w.name || ' Workout'
            FROM workouts w
            WHERE wl.workout_id = w.id 
              AND wl.workout_name IS NULL 
              AND w.name IS NOT NULL
            RETURNING wl.id
          )
          -- Then update any remaining ones
          UPDATE workout_logs
          SET workout_name = 'Completed Workout'
          WHERE workout_name IS NULL
            AND id NOT IN (SELECT id FROM updates)
          RETURNING id;
          `
        }
      );

      if (nameUpdateError) {
        return { 
          success: false, 
          error: `Failed to update workout names: ${nameUpdateError.message}` 
        };
      }

      const typeUpdates = Array.isArray(typeUpdateResult) ? typeUpdateResult.length : 0;
      const nameUpdates = Array.isArray(nameUpdateResult) ? nameUpdateResult.length : 0;

      return {
        success: true,
        data: {
          columnsFix: true,
          typeUpdates,
          nameUpdates
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Unexpected error applying fixes: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Checks if we have workout history records
   * @returns Promise with count of workout history records
   */
  async getWorkoutHistoryCount(): Promise<MCPResponse<{ count: number }>> {
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('workout_type', 'completed')
        .eq('is_custom', false);

      if (error) {
        return { 
          success: false, 
          error: `Failed to count workout history: ${error.message}` 
        };
      }

      return {
        success: true,
        data: {
          count: data || 0
        }
      };
    } catch (error) {
      return { 
        success: false, 
        error: `Unexpected error counting workout history: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}

// Export an instance of the fixer for easier import
export const workoutHistoryFixer = new WorkoutHistoryFixer();
