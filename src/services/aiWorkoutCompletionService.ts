// AI Workout Completion Service
// This service handles logging workout completions for AI-generated workouts
// Works with the current Supabase schema and RLS policies

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface WorkoutCompletionData {
  aiWorkoutPlanId: string;
  duration?: number;
  exercisesCompleted?: number;
  totalExercises?: number;
  caloriesBurned?: number;
  notes?: string;
  rating?: number;
}

interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

export class AIWorkoutCompletionService {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }
  /**
   * Log completion of an AI workout
   */
  async logAIWorkoutCompletion(completionData: WorkoutCompletionData): Promise<ServiceResponse<any>> {
    try {
      // Get the current user
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }

      // Get the AI workout plan details
      const { data: aiPlan, error: planError } = await this.supabase
        .from('workout_plans')
        .select('id, title, user_id')
        .eq('id', completionData.aiWorkoutPlanId)
        .eq('ai_generated', true)
        .single();

      if (planError) {
        return { data: null, error: planError };
      }

      if (aiPlan.user_id !== user.id) {
        return { data: null, error: new Error('Unauthorized: Workout plan does not belong to user') };
      }      // Create the workout log entry with available columns only
      // Based on actual database schema: user_id, notes, rating, calories_burned, completed_at, ai_workout_plan_id, workout_type
      const logData: any = {
        user_id: user.id,
        ai_workout_plan_id: completionData.aiWorkoutPlanId,
        workout_type: 'ai_generated',
        calories_burned: completionData.caloriesBurned || null,
        notes: this.formatCompletionNotes(completionData),
        rating: completionData.rating || null,
        completed_at: new Date().toISOString()
      };

      const { data: logResult, error: logError } = await this.supabase
        .from('workout_logs')
        .insert(logData)
        .select()
        .single();

      if (logError) {
        return { data: null, error: logError };
      }

      return { data: logResult, error: null };

    } catch (error) {
      return { data: null, error };
    }
  }
  /**
   * Get AI workout completion history for the current user
   */
  async getAIWorkoutHistory(limit: number = 20): Promise<ServiceResponse<any[]>> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return { data: null, error: new Error('User not authenticated') };
      }      const query = this.supabase
        .from('workout_logs')
        .select(`
          id,
          ai_workout_plan_id,
          workout_type,
          calories_burned,
          notes,
          rating,
          completed_at
        `)
        .eq('user_id', user.id)
        .eq('workout_type', 'ai_generated')
        .order('completed_at', { ascending: false });

      // Filter by AI workouts if ai_workout_plan_id column exists
      // Otherwise, filter by notes containing completion details
      if (limit) {
        query.limit(limit);
      }

      const { data, error } = await query;

      if (error) {
        return { data: null, error };
      }      // Filter for AI workouts based on available data
      const aiWorkouts = data.filter(log => 
        log.workout_type === 'ai_generated' && log.ai_workout_plan_id
      );

      return { data: aiWorkouts, error: null };

    } catch (error) {
      return { data: null, error };
    }
  }
  /**
   * Get completion count for a specific AI workout plan
   */
  async getAIWorkoutCompletionCount(aiWorkoutPlanId: string): Promise<{ count: number; error: Error | null }> {
    try {
      const { data: { user }, error: userError } = await this.supabase.auth.getUser();
      if (userError || !user) {
        return { count: 0, error: new Error('User not authenticated') };
      }      const { count, error } = await this.supabase
        .from('workout_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('workout_type', 'ai_generated')
        .eq('ai_workout_plan_id', aiWorkoutPlanId);

      if (error) {
        return { count: 0, error };
      }

      return { count: count || 0, error: null };

    } catch (error) {
      return { count: 0, error };
    }
  }  /**
   * Format completion notes with exercise details
   */
  private formatCompletionNotes(completionData: WorkoutCompletionData): string {
    const parts = [];
    
    parts.push('AI workout completed');
    
    if (completionData.exercisesCompleted && completionData.totalExercises) {
      parts.push(`${completionData.exercisesCompleted}/${completionData.totalExercises} exercises`);
    } else if (completionData.exercisesCompleted) {
      parts.push(`${completionData.exercisesCompleted} exercises completed`);
    }
    
    if (completionData.duration) {
      parts.push(`Duration: ${completionData.duration} minutes`);
    }
    
    if (completionData.notes) {
      parts.push(`Notes: ${completionData.notes}`);
    }
    
    // Store structured data as JSON for later parsing
    const metadata = {
      exercisesCompleted: completionData.exercisesCompleted,
      totalExercises: completionData.totalExercises,
      duration: completionData.duration,
      userNotes: completionData.notes
    };
    
    parts.push(`[DATA:${JSON.stringify(metadata)}]`);
    
    return parts.join(' | ');
  }
}

// Example usage:
/*
const supabase = createClient(url, key);
const completionService = new AIWorkoutCompletionService(supabase);

// Log a workout completion
const result = await completionService.logAIWorkoutCompletion({
  aiWorkoutPlanId: 'workout-plan-uuid',
  duration: 45,
  exercisesCompleted: 8,
  totalExercises: 10,
  caloriesBurned: 350,
  notes: 'Great workout session!',
  rating: 5
});

// Get workout history
const history = await completionService.getAIWorkoutHistory(10);

// Get completion count
const count = await completionService.getAIWorkoutCompletionCount('workout-plan-uuid');
*/

export default AIWorkoutCompletionService;
