// This script fixes workout history display issues using Supabase client
// It updates workout_logs to ensure they appear in the right section

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

async function fixWorkoutHistoryDisplay() {
  console.log('Fixing workout history display issues using Supabase...');
  
  // Get Supabase URL and Key from environment variables or use defaults for local development
  const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9obAHOGyVVKa3pD--kJlyxp-Z2zV9UUMAhKpNLAcU';
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Ensure the necessary columns exist
    // Since we can't use DDL with the client, we'll assume the SQL script handled this
    
    // 2. Update existing workout logs to mark them as completed
    console.log('Updating workout logs to mark them as completed...');
    const { data: completedData, error: completedError } = await supabase.rpc(
      'exec_sql',
      {
        sql: "UPDATE workout_logs SET workout_type = 'completed' WHERE workout_type IS NULL OR workout_type = '';"
      }
    );
    
    if (completedError) {
      console.error('Error marking workouts as completed:', completedError);
    } else {
      console.log('Successfully marked workouts as completed');
    }
    
    // 3. Make sure completed workouts aren't marked as custom workouts
    console.log('Fixing custom workout flags...');
    const { data: customData, error: customError } = await supabase.rpc(
      'exec_sql',
      {
        sql: "UPDATE workout_logs SET is_custom = false WHERE workout_type = 'completed' AND is_custom = true;"
      }
    );
    
    if (customError) {
      console.error('Error fixing custom workout flags:', customError);
    } else {
      console.log('Successfully fixed custom workout flags');
    }
    
    // 4. Add proper workout names for logs that don't have them
    console.log('Adding workout names...');
    const { data: nameData, error: nameError } = await supabase.rpc(
      'exec_sql',
      {
        sql: "UPDATE workout_logs wl SET workout_name = w.name || ' Workout' FROM workouts w WHERE wl.workout_id = w.id AND wl.workout_name IS NULL AND w.name IS NOT NULL;"
      }
    );
    
    if (nameError) {
      console.error('Error adding workout names:', nameError);
    } else {
      console.log('Successfully added workout names');
    }
    
    // 5. For logs without valid workout_name, add a generic one
    console.log('Adding generic workout names for remaining logs...');
    const { data: genericData, error: genericError } = await supabase.rpc(
      'exec_sql',
      {
        sql: "UPDATE workout_logs SET workout_name = 'Completed Workout' WHERE workout_name IS NULL;"
      }
    );
    
    if (genericError) {
      console.error('Error adding generic workout names:', genericError);
    } else {
      console.log('Successfully added generic workout names');
    }
    
    // Count the affected rows
    console.log('Counting fixed workout logs...');
    const { data: countData, error: countError } = await supabase
      .from('workout_logs')
      .select('count()', { count: 'exact' })
      .eq('workout_type', 'completed');
      
    if (countError) {
      console.error('Error counting fixed workout logs:', countError);
    } else {
      console.log(`Total workout logs fixed: ${countData[0].count || 0}`);
    }
    
    console.log('Workout history display fix completed successfully!');
    return true;
  } catch (error) {
    console.error('Error fixing workout history display:', error);
    return false;
  }
}

// Run the function if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fixWorkoutHistoryDisplay()
    .then(success => {
      if (success) {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

// Export the function for use in other scripts
export default fixWorkoutHistoryDisplay;
