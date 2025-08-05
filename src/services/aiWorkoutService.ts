import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export interface AIWorkoutResponse {
  title: string;
  description: string;
  weekly_structure: {
    days: {
      [key: string]: {
        name: string;
        description: string;
        focus: string;
      }
    }
  };
  exercises: {
    day: string;
    exercises: Array<{
      name: string;
      muscle_group: string;
      sets: number;
      reps: number;
      rest_time: number;
      notes?: string;
    }>
  }[];
}

interface WorkoutPlan {
  title: string;
  description: string;
  fitness_goal: string;
  weekly_structure: Record<string, any>;
  exercises: Record<string, any>;
  ai_generated: boolean;
  user_id: string;
}

/**
 * Generate a personalized workout plan using OpenAI
 * @param userProfile The user's profile data
 * @returns The generated workout plan ID or null if generation failed
 */
export const generateAIWorkout = async (userProfile: UserProfile): Promise<string | null> => {
  try {
    // Get OpenAI configuration
    const aiConfig = await getAIConfig('openai');
    if (!aiConfig || !aiConfig.api_key || !aiConfig.is_enabled) {
      console.error('OpenAI API is not configured or disabled');
      return null;
    }

    const prompt = createWorkoutPrompt(userProfile);
    
    const response = await fetch(aiConfig.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.api_key}`
      },
      body: JSON.stringify({
        model: aiConfig.model_name,
        messages: [
          {
            role: 'system',
            content: 'You are a professional fitness trainer who creates personalized workout plans. Respond only with a JSON object that follows the structure shown in the user\'s message. Do not include any explanations or text outside of the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return null;
    }

    const data = await response.json();
    const workoutPlan = JSON.parse(data.choices[0].message.content) as AIWorkoutResponse;
    
    // Save the workout plan to the database
    const workoutId = await saveWorkoutPlan(workoutPlan, userProfile);
    return workoutId;
  } catch (error) {
    console.error('Error generating AI workout:', error);
    return null;
  }
};

/**
 * Create a prompt for the OpenAI API to generate a workout plan
 * @param userProfile The user's profile data
 * @returns The prompt string
 */
const createWorkoutPrompt = (userProfile: UserProfile): string => {
  const { age, sex, height, weight, fitness_goal } = userProfile;
  const bmi = weight / ((height / 100) * (height / 100));
  
  return `Create a personalized workout plan for a ${age}-year-old ${sex} with a height of ${height}cm, weight of ${weight}kg, and a BMI of ${bmi.toFixed(1)}. 
  Their fitness goal is: ${fitness_goal.replace('-', ' ')}.
  
  Please provide the workout plan as a JSON object with the following structure:
  {
    "title": "Name of the workout plan",
    "description": "Brief overview of the workout plan",
    "weekly_structure": {
      "days": {
        "monday": { "name": "Day name", "description": "Day description", "focus": "Main focus" },
        "tuesday": { "name": "Day name", "description": "Day description", "focus": "Main focus" },
        ...
        "sunday": { "name": "Day name", "description": "Day description", "focus": "Main focus" }
      }
    },
    "exercises": [
      {
        "day": "monday",
        "exercises": [
          {
            "name": "Exercise name",
            "muscle_group": "Target muscle group",
            "sets": 3,
            "reps": 10,
            "rest_time": 60,
            "notes": "Optional notes about form or technique"
          },
          ...more exercises
        ]
      },
      ...more days
    ]
  }

  Include 3-6 exercises per workout day. Be specific with exercise names, sets, reps, and rest times. Include at least 1-2 rest days per week.`;
};

/**
 * Save the generated workout plan to the database
 * @param workoutPlan The workout plan data
 * @param userProfile The user's profile
 * @returns The ID of the saved workout plan
 */
const saveWorkoutPlan = async (workoutPlan: AIWorkoutResponse, userProfile: UserProfile): Promise<string | null> => {
  try {
    const plan: WorkoutPlan = {
      title: workoutPlan.title,
      description: workoutPlan.description,
      fitness_goal: userProfile.fitness_goal,
      weekly_structure: workoutPlan.weekly_structure,
      exercises: workoutPlan.exercises,
      ai_generated: true,
      user_id: userProfile.id
    };

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        ...plan,
        name: plan.title // Add the required name field
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving workout plan:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error saving workout plan:', error);
    return null;
  }
};

/**
 * Get all AI-generated workout plans for a user
 * @param userId The user ID
 * @returns Array of workout plans with completion counts
 */
export const getAIWorkoutPlans = async (userId: string) => {
  try {
    // Try to use the RPC function first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('get_ai_workout_plans', { p_user_id: userId });
    
    if (!rpcError && rpcData) {
      return rpcData;
    }
    
    // Fallback to direct query if RPC fails
    console.warn('Falling back to direct query for AI workout plans');
    const { data, error } = await supabase
      .from('workout_plans')
      .select(`
        id,
        title,
        description,
        fitness_goal,
        created_at
      `)
      .eq('user_id', userId)
      .eq('ai_generated', true)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching AI workout plans:', error);
      return [];
    }
    
    // Get completion counts for each plan
    const plansWithCompletions = await Promise.all(data.map(async (plan) => {
      const { count, error: countError } = await supabase
        .from('workout_logs')
        .select('id', { count: 'exact', head: true })
        .eq('ai_workout_plan_id', plan.id);
      
      return {
        ...plan,
        times_completed: countError ? 0 : (count || 0)
      };
    }));
    
    return plansWithCompletions;
  } catch (error) {
    console.error('Error in getAIWorkoutPlans:', error);
    return [];
  }
};

/**
 * Log the completion of an AI workout
 * @param userId User ID
 * @param workoutId Workout ID
 * @param aiWorkoutPlanId AI workout plan ID
 * @param data Additional workout data
 * @returns The ID of the created workout log
 */
export const logAIWorkoutCompletion = async (
  userId: string,
  workoutId: string,
  aiWorkoutPlanId: string,
  data: {
    duration?: number;
    calories_burned?: number;
    notes?: string;
    rating?: number;
  }
) => {
  try {
    // Try to use the RPC function first
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('complete_workout', {
        p_user_id: userId,
        p_workout_id: workoutId,
        p_duration: data.duration,
        p_calories_burned: data.calories_burned,
        p_notes: data.notes,
        p_rating: data.rating,
        p_is_from_ai_plan: true,
        p_ai_workout_plan_id: aiWorkoutPlanId
      });
    
    if (!rpcError && rpcData) {
      return rpcData;
    }
    
    // Fallback to direct query if RPC fails
    console.warn('Falling back to direct query for logging AI workout');
    
    // Get workout details
    const { data: workoutData } = await supabase
      .from('workouts')
      .select('name, description')
      .eq('id', workoutId)
      .single();
      
    // Create workout log
    const { data: logData, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_id: workoutId,
        workout_name: workoutData?.name,
        workout_description: workoutData?.description,
        duration: data.duration,
        calories_burned: data.calories_burned,
        notes: data.notes,
        rating: data.rating,
        is_from_ai_plan: true,
        ai_workout_plan_id: aiWorkoutPlanId
      })
      .select('id')
      .single();
    
    if (logError) {
      console.error('Error logging AI workout completion:', logError);
      return null;
    }
    
    return logData.id;
  } catch (error) {
    console.error('Error in logAIWorkoutCompletion:', error);
    return null;
  }
}; 