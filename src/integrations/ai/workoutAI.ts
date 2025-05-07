import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";
import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";
import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { createOpenAIClient, OpenAIClient } from "./openAIClient";

/**
 * Response format for AI-generated workout plans
 */
interface AIWorkoutResponse {
  weekly_structure: WorkoutDay[];
  exercises: {
    exercise_id: string;
    sets: number;
    reps: string;
    rest_time: number;
  }[];
  title: string;
  description: string;
}

/**
 * Available exercises from the database
 */
interface AvailableExercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
  difficulty: string;
  exercise_type: string;
}

/**
 * Generate a personalized workout plan using AI
 * @param userProfile User profile data
 * @returns AI-generated workout plan
 */
export const generateAIWorkoutPlan = async (userProfile: UserProfile): Promise<WorkoutPlan | null> => {
  try {
    // Get AI configuration
    const aiConfig = await getAIConfig('openai');
    
    // Check if AI is configured and enabled
    if (!aiConfig || !aiConfig.api_key || !aiConfig.is_enabled) {
      console.warn("AI service not configured or disabled. Falling back to rule-based workout generation.");
      return null;
    }
    
    // Store configuration values from aiConfig
    const OPENAI_API_URL = aiConfig.api_endpoint;
    const OPENAI_API_KEY = aiConfig.api_key;
    const AI_MODEL = aiConfig.model_name;

    // Get available exercises from the database to provide to the AI
    const { data: availableExercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, description, muscle_group, difficulty, exercise_type')
      .limit(100); // Limit to prevent token overflow

    if (exercisesError) {
      console.error("Error fetching exercises for AI:", exercisesError);
      return null;
    }

  // Format user information for the AI prompt
    const userInfo = {
      age: userProfile.age,
      sex: userProfile.sex,
      height_cm: userProfile.height,
      weight_kg: userProfile.weight,
      fitness_goal: userProfile.fitness_goal,
      fitness_level: getFitnessLevel(userProfile),
      medical_conditions: [],  // Could be added to user profile in future
      equipment_available: "minimal"  // Could be added to user profile in future
    };

    // Create the prompt for the AI
    const prompt = createWorkoutPrompt(userInfo, availableExercises);
    
    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a certified personal trainer and exercise physiologist specializing in creating personalized workout plans. Provide scientifically-backed workout recommendations tailored to the user's profile and goals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      return null;
    }

    const aiResponse = await response.json();
    const workoutPlan = JSON.parse(aiResponse.choices[0].message.content) as AIWorkoutResponse;
    
    // Process the AI response into a proper workout plan
    const processedPlan: Omit<WorkoutPlan, "id"> = {
      title: workoutPlan.title || getPlanTitleFallback(userProfile.fitness_goal),
      description: workoutPlan.description || `AI-generated workout plan for ${userProfile.fitness_goal} goal`,
      fitness_goal: userProfile.fitness_goal,
      weekly_structure: workoutPlan.weekly_structure,
      exercises: await processExercises(workoutPlan.exercises, availableExercises)
    };

    // Store the AI-generated plan in the database for future reference
    const { data: insertedPlan, error: insertError } = await supabase
      .from('workout_plans')
      .insert({
        title: processedPlan.title,
        description: processedPlan.description,
        fitness_goal: processedPlan.fitness_goal,
        weekly_structure: processedPlan.weekly_structure as any,
        exercises: processedPlan.exercises as any,
        ai_generated: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing AI-generated plan:", insertError);
      return processedPlan as WorkoutPlan;
    }

    return {
      ...processedPlan,
      id: insertedPlan.id
    };
  } catch (error) {
    console.error("Error generating AI workout plan:", error);
    return null;
  }
};

/**
 * Create a detailed prompt for the AI based on user info and available exercises
 */
const createWorkoutPrompt = (userInfo: any, exercises: any[]): string => {
  // Group exercises by muscle group for easier reference
  const exercisesByMuscle: Record<string, any[]> = {};
  exercises.forEach(ex => {
    if (!exercisesByMuscle[ex.muscle_group]) {
      exercisesByMuscle[ex.muscle_group] = [];
    }
    exercisesByMuscle[ex.muscle_group].push(ex);
  });

  // Create a prompt that helps the AI understand the task
  return `
    Create a personalized 7-day workout plan for a user with the following profile:
    
    User Profile:
    - Age: ${userInfo.age}
    - Sex: ${userInfo.sex}
    - Height: ${userInfo.height_cm} cm
    - Weight: ${userInfo.weight_kg} kg
    - Fitness Goal: ${userInfo.fitness_goal}
    - Current Fitness Level: ${userInfo.fitness_level}
    - Medical Considerations: ${userInfo.medical_conditions.join(', ') || 'None'}
    - Available Equipment: ${userInfo.equipment_available}
    
    Create a response in JSON format with the following structure:
    {
      "title": "Name of the workout plan",
      "description": "Brief description of the workout plan and its benefits",
      "weekly_structure": [
        { "day": "Monday", "focus": "Focus area", "duration": minutes as number },
        ...repeat for all 7 days, include rest days
      ],
      "exercises": [
        {
          "exercise_id": "ID from the available exercises list",
          "sets": number,
          "reps": "number or range like '8-12'",
          "rest_time": rest time in seconds
        },
        ...include 15-20 exercises total
      ]
    }
    
    Available exercises by muscle group:
    ${Object.keys(exercisesByMuscle).map(muscle => {
      return `
      ${muscle}:
      ${exercisesByMuscle[muscle].map(ex => `- ${ex.name} (ID: ${ex.id}): ${ex.description} (Difficulty: ${ex.difficulty}, Type: ${ex.exercise_type})`).join('\n      ')}
      `;
    }).join('\n')}
    
    Important considerations:
    - Design the plan specifically for the "${userInfo.fitness_goal}" goal
    - Include appropriate rest days
    - Vary exercise intensity and types throughout the week
    - Consider the user's age and fitness level
    - Include only exercises from the provided list, using their exact IDs
    - Include a mix of exercise types: strength, cardio, mobility, etc. as appropriate for the goal
    - For beginners, focus on form and gradual progression
  `;
};

/**
 * Process the exercises from AI response and match them with database exercises
 */
const processExercises = async (
  aiExercises: { exercise_id: string; sets: number; reps: string; rest_time: number }[],
  availableExercises: any[]
): Promise<WorkoutExercise[]> => {
  // Create a map for quick lookup of exercise details
  const exerciseMap: Record<string, any> = {};
  availableExercises.forEach(ex => {
    exerciseMap[ex.id] = ex;
  });

  // Process each exercise
  return aiExercises.map((ex, index) => {
    // Check if the exercise ID exists in our database
    const exerciseDetails = exerciseMap[ex.exercise_id] || null;
    
    // If we can't find the exercise, try to find a similar one or use a default
    let exercise_id = ex.exercise_id;
    if (!exerciseDetails) {
      // Find a fallback exercise
      const fallbackExercise = availableExercises[index % availableExercises.length];
      exercise_id = fallbackExercise.id;
    }
    
    return {
      id: `ai-exercise-${index}`,
      workout_id: 'ai-generated',
      exercise_id: exercise_id,
      sets: ex.sets || 3,
      reps: ex.reps || "10",
      duration: null,
      rest_time: ex.rest_time || 60,
      order_position: index,
      notes: null
    };
  });
};

/**
 * Determine user's fitness level based on profile data
 */
const getFitnessLevel = (userProfile: UserProfile): string => {
  // Simple calculation based on profile data
  // This would be enhanced in a real application with more metrics
  
  // Check if user has logged any workouts
  const hasWorkoutHistory = async (): Promise<boolean> => {
    const { count } = await supabase
      .from('workout_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userProfile.id);
      
    return count !== null && count > 0;
  };
  
  // Default to intermediate
  // In a production app, we would await the hasWorkoutHistory() call
  if (userProfile.age > 50) {
    return "beginner";
  } else {
    return "intermediate";
  }
};

/**
 * Fallback title generator if AI doesn't provide one
 */
const getPlanTitleFallback = (fitnessGoal: string): string => {
  switch (fitnessGoal) {
    case 'weight-loss':
      return "AI Weight Loss & Fat Burning Plan";
    case 'muscle-gain':
      return "AI Muscle Building & Strength Plan";
    case 'general-fitness':
      return "AI Complete Fitness & Wellness Plan";
    case 'endurance':
      return "AI Endurance & Stamina Builder";
    default:
      return `AI Custom ${fitnessGoal.charAt(0).toUpperCase() + fitnessGoal.slice(1)} Plan`;
  }
};
