import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";
import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";
import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { createOpenAIClient } from "./openAIClient";

/**
 * Response format for AI-generated workout plans
 */
interface AIWorkoutResponse {
  weekly_structure: WorkoutDay[];
  exercises: AIExerciseResponse[];
  title: string;
  description: string;
}

/**
 * Exercise format in AI response
 */
interface AIExerciseResponse {
  exercise_id: string;
  sets: number;
  reps: string;
  rest_time: number;
}

/**
 * Available exercise from the database
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
 * User fitness information for the AI prompt
 */
interface UserFitnessInfo {
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  fitness_goal: string;
  fitness_level: string;
  medical_conditions: string[];
  equipment_available: string;
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
    const openAIClient = createOpenAIClient(aiConfig);
    
    // Check if AI is configured and enabled
    if (!openAIClient) {
      console.warn("AI service not configured or disabled. Falling back to rule-based workout generation.");
      return null;
    }

    // Fetch available exercises from the database
    const availableExercises = await fetchAvailableExercises();
    if (!availableExercises) {
      console.error("Failed to fetch exercises for AI workout plan");
      return null;
    }

    // Prepare user info for the prompt
    const userInfo = createUserInfoFromProfile(userProfile);

    // Create the workout plan
    const workoutPlan = await createAIWorkoutPlan(openAIClient, userInfo, availableExercises);
    if (!workoutPlan) {
      console.error("Failed to generate AI workout plan");
      return null;
    }

    // Store the AI-generated plan in the database
    return await saveAIWorkoutPlan(workoutPlan, userProfile);
  } catch (error) {
    console.error("Error generating AI workout plan:", error);
    return null;
  }
};

/**
 * Fetch available exercises from the database
 */
async function fetchAvailableExercises(): Promise<AvailableExercise[] | null> {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, description, muscle_group, difficulty, exercise_type')
      .limit(100); // Limit to prevent token overflow

    if (error) {
      console.error("Error fetching exercises for AI:", error);
      return null;
    }

    return data as AvailableExercise[];
  } catch (error) {
    console.error("Error fetching exercises:", error);
    return null;
  }
}

/**
 * Create user fitness info object from profile
 */
function createUserInfoFromProfile(userProfile: UserProfile): UserFitnessInfo {
  return {
    age: userProfile.age,
    sex: userProfile.sex,
    height_cm: userProfile.height,
    weight_kg: userProfile.weight,
    fitness_goal: userProfile.fitness_goal,
    fitness_level: getFitnessLevel(userProfile),
    medical_conditions: [],  // Could be added to user profile in future
    equipment_available: "minimal"  // Could be added to user profile in future
  };
}

/**
 * Create an AI-generated workout plan
 */
async function createAIWorkoutPlan(
  openAIClient: ReturnType<typeof createOpenAIClient>,
  userInfo: UserFitnessInfo,
  availableExercises: AvailableExercise[]
): Promise<AIWorkoutResponse | null> {
  try {
    // Create prompt for AI
    const prompt = createWorkoutPrompt(userInfo, availableExercises);
    
    // Call OpenAI API with system prompt and user prompt
    const systemPrompt = "You are a certified personal trainer and exercise physiologist specializing in creating personalized workout plans. Provide scientifically-backed workout recommendations tailored to the user's profile and goals.";
    
    const aiResponse = await openAIClient.createChatCompletion(systemPrompt, prompt);
    if (!aiResponse) {
      return null;
    }

    // Parse the response to extract the workout plan
    try {
      return JSON.parse(aiResponse.choices[0].message.content) as AIWorkoutResponse;
    } catch (error) {
      console.error("Failed to parse AI response:", error);
      return null;
    }
  } catch (error) {
    console.error("Error creating AI workout plan:", error);
    return null;
  }
}

/**
 * Save AI-generated workout plan to database
 */
async function saveAIWorkoutPlan(
  aiWorkoutPlan: AIWorkoutResponse,
  userProfile: UserProfile
): Promise<WorkoutPlan | null> {
  try {
    // Process exercises to match our workout plan format
    const processedExercises = await processExercises(aiWorkoutPlan.exercises, await fetchAvailableExercises() || []);

    // Create workout plan object
    const processedPlan: Omit<WorkoutPlan, "id"> = {
      title: aiWorkoutPlan.title || getPlanTitleFallback(userProfile.fitness_goal),
      description: aiWorkoutPlan.description || `AI-generated workout plan for ${userProfile.fitness_goal} goal`,
      fitness_goal: userProfile.fitness_goal,
      weekly_structure: aiWorkoutPlan.weekly_structure,
      exercises: processedExercises,
      ai_generated: true
    };

    // Store in database
    const { data: insertedPlan, error } = await supabase
      .from('workout_plans')
      .insert({
        title: processedPlan.title,
        description: processedPlan.description,
        fitness_goal: processedPlan.fitness_goal,
        weekly_structure: processedPlan.weekly_structure as any,
        exercises: processedPlan.exercises as any,
        user_id: userProfile.id,
        ai_generated: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing AI-generated plan:", error);
      return processedPlan as WorkoutPlan;
    }

    return {
      ...processedPlan,
      id: insertedPlan.id
    };
  } catch (error) {
    console.error("Error saving AI workout plan:", error);
    return null;
  }
}

/**
 * Create a detailed prompt for the AI based on user info and available exercises
 */
function createWorkoutPrompt(userInfo: UserFitnessInfo, exercises: AvailableExercise[]): string {
  // Group exercises by muscle group for easier reference
  const exercisesByMuscle: Record<string, AvailableExercise[]> = {};
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
}

/**
 * Process the exercises from AI response and match them with database exercises
 */
async function processExercises(
  aiExercises: AIExerciseResponse[],
  availableExercises: AvailableExercise[]
): Promise<WorkoutExercise[]> {
  // Create a map for quick lookup of exercise details
  const exerciseMap: Record<string, AvailableExercise> = {};
  availableExercises.forEach(ex => {
    exerciseMap[ex.id] = ex;
  });

  // Process each exercise
  return aiExercises.map((ex, index) => {
    // Check if the exercise ID exists in our database
    const exerciseDetails = exerciseMap[ex.exercise_id];
    
    // If we can't find the exercise, try to find a similar one or use a default
    let exerciseId = ex.exercise_id;
    let exerciseName = "Unknown Exercise";
    let muscleName = "General";
    
    if (exerciseDetails) {
      exerciseId = exerciseDetails.id;
      exerciseName = exerciseDetails.name;
      muscleName = exerciseDetails.muscle_group;
    } else if (availableExercises.length > 0) {
      // Find a fallback exercise
      const fallbackExercise = availableExercises[index % availableExercises.length];
      exerciseId = fallbackExercise.id;
      exerciseName = fallbackExercise.name;
      muscleName = fallbackExercise.muscle_group;
    }
    
    return {
      name: exerciseName,
      sets: ex.sets || 3,
      reps: ex.reps || "10",
      muscle: muscleName
    };
  });
}

/**
 * Determine user's fitness level based on profile data
 */
function getFitnessLevel(userProfile: UserProfile): string {
  // Simple calculation based on profile data
  if (userProfile.age > 50) {
    return "beginner";
  } else {
    return "intermediate";
  }
}

/**
 * Fallback title generator if AI doesn't provide one
 */
function getPlanTitleFallback(fitnessGoal: string): string {
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
}

/**
 * Regenerate a workout plan for a user
 * @param userId User ID to regenerate workout plan for
 * @param onProgress Optional callback for progress updates
 * @returns True if regeneration was successful
 */
export async function regenerateWorkoutPlan(
  userId: string, 
  onProgress?: (message: string, progress: number) => void
): Promise<boolean> {
  try {
    // Report progress
    onProgress?.("Preparing workout regeneration...", 0);
    
    // 1. Fetch user profile
    onProgress?.("Fetching user profile...", 10);
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError || !profile) {
      console.error("Failed to fetch user profile:", profileError);
      return false;
    }
    
    // 2. Delete existing workout plans
    onProgress?.("Removing old workout plans...", 30);
    const { error: deleteError } = await supabase
      .from('workout_plans')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      console.error("Failed to delete existing workout plans:", deleteError);
      // Continue anyway - this is not a critical error
    }
    
    // 3. Generate new workout plan
    onProgress?.("Generating AI workout plan...", 50);
    const workoutPlan = await generateAIWorkoutPlan(profile);
    
    if (!workoutPlan) {
      console.error("Failed to generate new workout plan");
      return false;
    }
    
    onProgress?.("Workout plan generated successfully!", 100);
    return true;
  } catch (error) {
    console.error("Error regenerating workout plan:", error);
    return false;
  }
}
