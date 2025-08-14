import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { saveWorkoutOffline } from "./offlineStorageService";
import { registerForBackgroundSync } from "./serviceWorkerRegistration";

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

// Extended user profile with additional fitness preferences
export interface EnhancedUserProfile extends UserProfile {
  fitness_level?: 'beginner' | 'intermediate' | 'advanced';
  available_equipment?: string[];
  workout_frequency?: number;
  health_conditions?: string[];
  workout_preferences?: {
    preferred_days?: string[];
    preferred_duration?: number;
    preferred_exercise_types?: string[];
  };
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    biceps?: number;
    thighs?: number;
    last_updated?: string;
  };
}

// AI response for workout plans
export interface AIWorkoutResponse {
  title: string;
  description: string;
  fitness_goal: string;
  target_muscle_groups: string[];
  estimated_calories: number;
  difficulty_level: string;
  weekly_structure: {
    days: {
      [key: string]: {
        name: string;
        description: string;
        focus: string;
        intensity: string;
      }
    }
  };
  exercises: {
    day: string;
    exercises: Array<{
      name: string;
      muscle_group: string;
      sets: number;
      reps: number | string;
      rest_time: number;
      notes?: string;
      alternatives?: string[];
    }>
  }[];
}

// Simplified workout plan structure for database
interface WorkoutPlan {
  title: string;
  description: string;
  fitness_goal: string;
  target_muscle_groups?: string[];
  estimated_calories?: number;
  difficulty_level?: string;
  weekly_structure: Record<string, any>;
  exercises: Record<string, any>;
  ai_generated: boolean;
  user_id: string;
}

/**
 * Generate a personalized workout plan using OpenAI with enhanced personalization
 * @param userProfile The user's profile data
 * @returns The generated workout plan ID or null if generation failed
 */
export const generateEnhancedAIWorkout = async (userProfile: EnhancedUserProfile): Promise<string | null> => {
  try {
    console.log("Starting enhanced AI workout generation process");
    
    // Get OpenAI configuration
    const aiConfig = await getAIConfig('openai');
    if (!aiConfig || !aiConfig.api_key || !aiConfig.is_enabled) {
      console.error('OpenAI API is not configured or disabled');
      return null;
    }
    
    console.log("OpenAI configuration retrieved successfully");

    const prompt = createEnhancedWorkoutPrompt(userProfile);
    
    console.log("Calling OpenAI API to generate workout plan");
    console.log(`API Endpoint: ${aiConfig.api_endpoint}`);
    console.log(`Model: ${aiConfig.model_name || 'gpt-4'}`);
    
    const response = await fetch(aiConfig.api_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.api_key}`
      },
      body: JSON.stringify({
        model: aiConfig.model_name || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert personal trainer with deep knowledge of exercise science, biomechanics, and nutrition. Create personalized, scientifically sound workout plans that adapt to individual fitness levels, goals, and constraints. Focus on progressive overload principles, proper form, and injury prevention.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return null;
    }

    console.log("OpenAI API response received, parsing data");
    const data = await response.json();
    
    try {
      const workoutPlan = JSON.parse(data.choices[0].message.content) as AIWorkoutResponse;
      console.log("Successfully parsed workout plan JSON");
      
      // Save the workout plan to the database or offline if necessary
      let workoutId: string | null = null;
      
      if (navigator.onLine) {
        // Try to save to the database
        console.log("Online - saving workout plan to database");
        workoutId = await saveWorkoutPlan(workoutPlan, userProfile);
        console.log("Workout plan saved with ID:", workoutId);
      } else {
        // Save offline and queue for syncing
        console.log("Offline - saving workout plan locally");
        const tempId = 'temp_' + Date.now();
      
      const offlineWorkout = {
        workoutPlanId: tempId,
        userId: userProfile.id,
        title: workoutPlan.title,
        description: workoutPlan.description,
        workoutPlan,
        completedAt: new Date().toISOString(),
        synced: false
      };
      
      // Store in local storage
      localStorage.setItem(`workout_plan_${tempId}`, JSON.stringify({
        id: tempId,
        ...workoutPlan,
        user_id: userProfile.id,
        created_at: new Date().toISOString()
      }));
      
      // Try to register for background sync
      registerForBackgroundSync()
        .then(registered => {
          console.log('Background sync registration:', registered ? 'success' : 'failed');
        });      
      workoutId = tempId;
    }
    
    return workoutId;
    } catch (parseError) {
      console.error('Error parsing AI workout response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error generating enhanced AI workout:', error);
    return null;
  }
};

/**
 * Create a detailed prompt for the OpenAI API to generate a workout plan
 * @param userProfile The user's profile data
 * @returns The enhanced prompt string
 */
const createEnhancedWorkoutPrompt = (userProfile: EnhancedUserProfile): string => {
  const { 
    age, 
    sex, 
    height, 
    weight, 
    fitness_goal, 
    fitness_level,
    available_equipment,
    workout_frequency,
    health_conditions,
    workout_preferences,
    measurements
  } = userProfile;
  
  // Calculate BMI if height and weight are available
  const bmi = (height && weight) ? weight / ((height / 100) * (height / 100)) : null;
  
  let prompt = `Create a highly personalized workout plan with these details:

USER PROFILE:
- Age: ${age || 'Not specified'}
- Sex: ${sex || 'Not specified'}
- Height: ${height ? `${height}cm` : 'Not specified'}
- Weight: ${weight ? `${weight}kg` : 'Not specified'}
- BMI: ${bmi ? bmi.toFixed(1) : 'Not calculated'}
- Fitness Level: ${fitness_level || 'Not specified'}
- Primary Fitness Goal: ${fitness_goal?.replace('-', ' ') || 'Not specified'}
- Available Equipment: ${available_equipment?.join(', ') || 'Assume basic gym equipment'}
- Workout Frequency: ${workout_frequency || '3-4'} times per week
${health_conditions?.length ? `- Health Considerations: ${health_conditions.join(', ')}` : ''}`;

  // Add workout preferences if available
  if (workout_preferences) {
    prompt += `\n\nPREFERENCES:`;
    if (workout_preferences.preferred_days?.length) {
      prompt += `\n- Preferred Workout Days: ${workout_preferences.preferred_days.join(', ')}`;
    }
    if (workout_preferences.preferred_duration) {
      prompt += `\n- Preferred Workout Duration: ${workout_preferences.preferred_duration} minutes`;
    }
    if (workout_preferences.preferred_exercise_types?.length) {
      prompt += `\n- Preferred Exercise Types: ${workout_preferences.preferred_exercise_types.join(', ')}`;
    }
  }
  
  // Add measurements if available
  if (measurements) {
    const hasMeasurements = Object.values(measurements).some(m => m !== undefined && m !== null);
    if (hasMeasurements) {
      prompt += `\n\nBODY MEASUREMENTS:`;
      if (measurements.chest) prompt += `\n- Chest: ${measurements.chest}cm`;
      if (measurements.waist) prompt += `\n- Waist: ${measurements.waist}cm`;
      if (measurements.hips) prompt += `\n- Hips: ${measurements.hips}cm`;
      if (measurements.biceps) prompt += `\n- Biceps: ${measurements.biceps}cm`;
      if (measurements.thighs) prompt += `\n- Thighs: ${measurements.thighs}cm`;
    }
  }
  
  prompt += `\n\nPlease provide the workout plan as a JSON object with the following structure:
  {
    "title": "Name of the workout plan",
    "description": "Brief overview of the workout plan and expected results",
    "fitness_goal": "${fitness_goal?.replace('-', ' ') || 'general fitness'}",
    "target_muscle_groups": ["Primary", "muscle", "groups", "targeted"],
    "estimated_calories": 300, 
    "difficulty_level": "beginner/intermediate/advanced",
    "weekly_structure": {
      "days": {
        "monday": { "name": "Day name", "description": "Day description", "focus": "Main focus", "intensity": "low/medium/high" },
        "tuesday": { "name": "Day name", "description": "Day description", "focus": "Main focus", "intensity": "low/medium/high" },
        ... other days
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
            "reps": 10, (or "10-12" for rep ranges),
            "rest_time": 60,
            "notes": "Optional notes about form or technique",
            "alternatives": ["Alternative exercise 1", "Alternative exercise 2"]
          },
          ... more exercises
        ]
      },
      ... more days
    ]
  }

  Provide 3-6 exercises per workout day based on fitness level. Include at least 1-2 rest days per week. For beginners, focus on form and learning movements. For intermediate/advanced, include progressive overload and varied intensity.
  
  Be specific with exercise names, sets, reps, and rest times. Include helpful form cues in the notes. Offer alternatives for each exercise in case equipment is unavailable.`;

  return prompt;
};

/**
 * Save the generated workout plan to the database
 * @param workoutPlan The workout plan data
 * @param userProfile The user's profile
 * @returns The ID of the saved workout plan
 */
const saveWorkoutPlan = async (workoutPlan: AIWorkoutResponse, userProfile: EnhancedUserProfile): Promise<string | null> => {
  try {
    console.log("Saving workout plan to database");
    
    // Create the plan object
    const plan = {
      title: workoutPlan.title,
      description: workoutPlan.description,
      fitness_goal: userProfile.fitness_goal || workoutPlan.fitness_goal,
      weekly_structure: workoutPlan.weekly_structure,
      exercises: workoutPlan.exercises,
      ai_generated: true,
      user_id: userProfile.id
    };

    console.log("Inserting workout plan with fields:", 
                Object.keys(plan).join(", "));

    const { data, error } = await supabase
      .from('workout_plans')
      .insert({
        ...plan,
        name: plan.title // Add the required name field
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving workout plan to database:', error);
      return null;
    }

    console.log("Workout plan saved successfully with ID:", data.id);

    // Cache the plan locally as well for offline access
    try {
      localStorage.setItem(`workout_plan_${data.id}`, JSON.stringify({
        id: data.id,
        title: workoutPlan.title,
        description: workoutPlan.description,
        fitness_goal: userProfile.fitness_goal || workoutPlan.fitness_goal,
        target_muscle_groups: workoutPlan.target_muscle_groups,
        estimated_calories: workoutPlan.estimated_calories,
        difficulty_level: workoutPlan.difficulty_level,
        weekly_structure: workoutPlan.weekly_structure,
        exercises: workoutPlan.exercises,
        user_id: userProfile.id,
        created_at: new Date().toISOString()
      }));
      console.log("Workout plan cached locally for offline access");
    } catch (cacheError) {
      console.warn("Error caching workout plan locally:", cacheError);
      // Continue even if caching fails
    }

    return data.id;
  } catch (error) {
    console.error('Error saving workout plan:', error);
    return null;
  }
};

/**
 * Get all AI-generated workout plans for a user with caching
 * @param userId The user ID
 * @returns Array of workout plans with completion counts
 */
export const getEnhancedAIWorkoutPlans = async (userId?: string) => {
  // Validate userId - must be a non-empty string to proceed
  if (!userId || userId.trim() === '') {
    console.warn('getEnhancedAIWorkoutPlans called with invalid userId:', userId);
    return [];
  }

  // Try to get from cache first (only if userId is provided)
  if (userId) {
    try {
      const cachedPlansJson = localStorage.getItem(`ai_workout_plans_${userId}`);
      const cachedTime = localStorage.getItem(`ai_workout_plans_${userId}_timestamp`);
      
      // If cache is less than 5 minutes old, use it
      if (cachedPlansJson && cachedTime) {
        const cachedTimeMs = parseInt(cachedTime, 10);
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        
        if (cachedTimeMs > fiveMinutesAgo) {
          return JSON.parse(cachedPlansJson);
        }
      }
    } catch (e) {
      console.error('Error reading from cache:', e);
    }
  }  // Get from database if online
  if (navigator.onLine) {
    try {
      console.log('Fetching AI workout plans from database...');
        // Try to use the RPC function first (now it exists!)
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_ai_workout_plans', { p_user_id: userId });
      
      let plansData;
      
      if (!rpcError && rpcData) {
        console.log(`Found ${rpcData.length} AI workout plans via RPC`);
        plansData = rpcData;
      } else {        // Fallback to direct query if RPC fails
        console.warn('Falling back to direct query for AI workout plans:', rpcError);
        const { data, error } = await supabase
          .from('workout_plans')
          .select(`
            id,
            title,
            description,
            fitness_goal,
            created_at,
            weekly_structure,
            exercises
          `)
          .eq('ai_generated', true)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching AI workout plans:', error);
          return [];
        }
        
        console.log(`Found ${data.length} AI workout plans via direct query`);
        
        // Get completion counts for each plan
        plansData = await Promise.all(data.map(async (plan) => {
          try {
            const { count, error: countError } = await supabase
              .from('workout_logs')
              .select('*', { count: 'exact', head: true })
              .eq('ai_workout_plan_id', plan.id);
            
            return {
              ...plan,
              times_completed: countError ? 0 : (count || 0)
            };
          } catch (err) {
            console.warn('Error in completion count query for plan', plan.id, ':', err);
            return {
              ...plan,
              times_completed: 0
            };
          }
        }));
      }
        // Cache the results if userId is provided
      if (userId) {
        try {
          localStorage.setItem(`ai_workout_plans_${userId}`, JSON.stringify(plansData));
          localStorage.setItem(`ai_workout_plans_${userId}_timestamp`, Date.now().toString());
        } catch (e) {
          console.error('Error caching workout plans:', e);
        }
      }
      
      return plansData;
    } catch (error) {
      console.error('Error in getEnhancedAIWorkoutPlans:', error);
    }
  }
    // If offline, get from local storage (only if userId is provided)
  if (userId) {
    try {
      // Find all workout plans stored in localStorage
      const workoutPlans = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('workout_plan_')) {
          try {
            const plan = JSON.parse(localStorage.getItem(key) || '');
            
            // Check if this plan belongs to the user
            if (plan?.user_id === userId && plan?.ai_generated) {
              workoutPlans.push({
                ...plan,
                times_completed: 0 // We don't know how many times it was completed offline
              });
            }
          } catch (e) {
            console.error('Error parsing localStorage workout plan:', e);
          }
        }
      }
      
      return workoutPlans;
    } catch (error) {
      console.error('Error getting offline workout plans:', error);
      return [];
    }
  }
  
  // If no userId and offline, return empty array
  return [];
};