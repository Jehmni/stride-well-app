import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/models/models";
import { WorkoutDay, WorkoutExercise, WorkoutPlan } from "@/components/workout/types";
import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { createOpenAIClient } from "./openAIClient";
import { getMockWorkoutData } from "./mockWorkoutData";

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
    console.log("========== AI WORKOUT PLAN GENERATION STARTED ==========");
    console.log(`Generating workout plan for user: ${userProfile.id}`);
    console.log(`Fitness goal: ${userProfile.fitness_goal}`);
      // Get AI configuration
    const aiConfig = await getAIConfig('openai');
    
    // Validate AI configuration
    const hasValidApiKey = aiConfig && aiConfig.api_key && aiConfig.api_key.trim().length > 0;
    const isEnabled = aiConfig && aiConfig.is_enabled !== false; // Default to true if undefined
    
    if (!aiConfig || !hasValidApiKey || !isEnabled) {
      console.log("AI service not properly configured. Falling back to mock workout plan.");
      console.log("AI Config Status:", {
        configExists: !!aiConfig,
        apiKeyExists: hasValidApiKey,
        apiKeyLength: aiConfig?.api_key?.length || 0,
        isEnabled: isEnabled
      });
      
      // Fall back to mock workout plan
      return await generateMockWorkoutPlan(userProfile);
    }
    
    console.log("✓ AI service properly configured with valid API key");
    
    // Create OpenAI client
    const openAIClient = createOpenAIClient(aiConfig);

    // Fetch available exercises from the database
    const availableExercises = await fetchAvailableExercises();
    if (!availableExercises || availableExercises.length === 0) {
      console.error("❌ Failed to fetch exercises for AI workout plan");
      throw new Error("No exercises available for workout generation");
    }
    console.log(`✓ Successfully fetched ${availableExercises.length} exercises from database`);

    // Prepare user info for the prompt
    const userInfo = createUserInfoFromProfile(userProfile);
    console.log("✓ User info prepared for AI prompt");

    // Create the workout plan
    console.log("Generating workout plan using AI...");
    const workoutPlan = await createAIWorkoutPlan(openAIClient, userInfo, availableExercises, (userProfile as any).generation_context);
    if (!workoutPlan) {
      console.error("❌ Failed to generate AI workout plan");
      throw new Error("Failed to generate AI workout plan");
    }
    
    console.log("✓ Successfully generated AI workout plan:", workoutPlan.title);
    
    // Process and save the workout plan
    return await saveAIWorkoutPlan(workoutPlan, userProfile);
  } catch (error) {
    console.error("Error generating AI workout plan:", error);
    throw error;
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
  availableExercises: AvailableExercise[],
  generationContext?: string
): Promise<AIWorkoutResponse | null> {
  try {
    // Create prompt for AI
    const prompt = createWorkoutPrompt(userInfo, availableExercises, generationContext);
    
    // Set user info in client for mock responses if needed
    if (openAIClient.setUserInfo) {
      openAIClient.setUserInfo(userInfo);
    }
    
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
 * Save the AI-generated workout plan to the database
 */
async function saveAIWorkoutPlan(
  aiWorkoutPlan: AIWorkoutResponse,
  userProfile: UserProfile
): Promise<WorkoutPlan | null> {
  try {
    console.log("Saving AI workout plan to database...");
    
    // Get the weekly structure from the AI response or use defaults
    const weeklyStructure = Array.isArray(aiWorkoutPlan.weekly_structure) && aiWorkoutPlan.weekly_structure.length > 0
      ? aiWorkoutPlan.weekly_structure
      : generateDefaultWeeklyStructure(userProfile.fitness_goal);
    
    // Process exercises from the AI response
    let processedExercises: WorkoutExercise[] = [];
    
    if (Array.isArray(aiWorkoutPlan.exercises) && aiWorkoutPlan.exercises.length > 0) {
      // Process the AI-selected exercises
      const availableExercises = await fetchAvailableExercises();
      if (!availableExercises) {
        console.error("❌ Failed to fetch exercises for workout plan processing");
        throw new Error("Failed to fetch exercises");
      }
      
      processedExercises = await processExercises(aiWorkoutPlan.exercises, availableExercises);
    } else {
      console.warn("No exercises in AI response, using defaults");
      processedExercises = generateDefaultExercises(userProfile.fitness_goal);
    }

    // Create the workout plan object
    const processedPlan: Omit<WorkoutPlan, "id"> = {
      title: aiWorkoutPlan.title || getPlanTitleFallback(userProfile.fitness_goal),
      description: aiWorkoutPlan.description || `AI-generated workout plan for ${userProfile.fitness_goal} goal`,
      fitness_goal: userProfile.fitness_goal,
      weekly_structure: weeklyStructure,
      exercises: processedExercises,
      ai_generated: true
    };
    
    console.log("✓ Workout plan prepared:", processedPlan.title);    // Store in database
    console.log("Inserting AI workout plan into database...");    const { data: insertedPlan, error } = await supabase
      .from('workout_plans')
      .insert({
        name: processedPlan.title, // Add the required name field
        title: processedPlan.title,
        description: processedPlan.description,
        fitness_goal: processedPlan.fitness_goal,
        weekly_structure: processedPlan.weekly_structure as any,
        exercises: processedPlan.exercises as any,
        user_id: userProfile.id,
        ai_generated: true,
        generation_context: (userProfile as any).generation_context || null,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();

    if (error) {
      console.error("❌ Error storing AI-generated plan:", error);
      throw error;
    }

    console.log(`✓ AI workout plan saved successfully with ID: ${insertedPlan.id}`);
    console.log("========== AI WORKOUT PLAN SAVED ==========");
    
    return {
      ...processedPlan,
      id: insertedPlan.id
    };
  } catch (error) {
    console.error("Error saving AI workout plan:", error);
    throw error;
  }
}

/**
 * Create a detailed prompt for the AI based on user info and available exercises
 */
function createWorkoutPrompt(userInfo: UserFitnessInfo, exercises: AvailableExercise[], generationContext?: string): string {
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
    
    ${generationContext ? `
    Additional user context/preferences:
    """
    ${generationContext}
    """
    ` : ''}

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
 * Generate default weekly workout structure based on fitness goal
 * Used as fallback when AI response is missing or invalid
 * @param fitnessGoal User's fitness goal
 * @returns Default weekly workout structure
 */
function generateDefaultWeeklyStructure(fitnessGoal: string): WorkoutDay[] {
  switch (fitnessGoal) {
    case 'weight-loss':
      return [
        { day: "Monday", focus: "HIIT & Upper Body", duration: 45 },
        { day: "Tuesday", focus: "Lower Body & Core", duration: 45 },
        { day: "Wednesday", focus: "Cardio", duration: 30 },
        { day: "Thursday", focus: "Full Body Circuit", duration: 45 },
        { day: "Friday", focus: "HIIT & Core", duration: 30 },
        { day: "Saturday", focus: "Light Cardio", duration: 30 },
        { day: "Sunday", focus: "Rest & Recovery", duration: 0 }
      ];
    case 'muscle-gain':
      return [
        { day: "Monday", focus: "Chest & Triceps", duration: 60 },
        { day: "Tuesday", focus: "Back & Biceps", duration: 60 },
        { day: "Wednesday", focus: "Rest & Recovery", duration: 0 },
        { day: "Thursday", focus: "Legs & Core", duration: 60 },
        { day: "Friday", focus: "Shoulders & Arms", duration: 45 },
        { day: "Saturday", focus: "Full Body", duration: 45 },
        { day: "Sunday", focus: "Rest & Recovery", duration: 0 }
      ];
    case 'general-fitness':
      return [
        { day: "Monday", focus: "Upper Body", duration: 45 },
        { day: "Tuesday", focus: "Lower Body", duration: 45 },
        { day: "Wednesday", focus: "Cardio", duration: 30 },
        { day: "Thursday", focus: "Core", duration: 30 },
        { day: "Friday", focus: "Full Body", duration: 45 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
    default:
      return [
        { day: "Monday", focus: "Full Body", duration: 45 },
        { day: "Tuesday", focus: "Cardio", duration: 30 },
        { day: "Wednesday", focus: "Core & Flexibility", duration: 30 },
        { day: "Thursday", focus: "Full Body", duration: 45 },
        { day: "Friday", focus: "HIIT", duration: 30 },
        { day: "Saturday", focus: "Active Recovery", duration: 30 },
        { day: "Sunday", focus: "Rest", duration: 0 }
      ];
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
      .eq('user_id', userId)
      .eq('ai_generated', true);
      
    if (deleteError) {
      console.error("Failed to delete existing workout plans:", deleteError);
      // Continue anyway - this is not a critical error
    }
    
    // 3. Generate new workout plan using force regenerate
    onProgress?.("Generating AI workout plan...", 50);
    
    // Import the generatePersonalizedWorkoutPlan function from the workoutService
    const { generatePersonalizedWorkoutPlan } = await import('@/services/workoutService');
    
    // Generate a new plan, forcing regeneration
    const workoutPlan = await generatePersonalizedWorkoutPlan(profile, true);
    
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

/**
 * Generate a mock workout plan when AI is not available
 */
async function generateMockWorkoutPlan(userProfile: UserProfile): Promise<WorkoutPlan> {
  console.log("Generating mock workout plan for user:", userProfile.id);
  
  // Get mock workout data
  const mockData = getMockWorkoutData(userProfile.fitness_goal || 'general-fitness');
  
  // Convert mock data to AIWorkoutResponse format for processing
  const aiResponse: AIWorkoutResponse = {
    title: mockData.title,
    description: mockData.description,
    weekly_structure: mockData.weekly_structure,
    exercises: mockData.exercises.map(exercise => ({
      exercise_id: exercise.exercise_id,
      sets: exercise.sets,
      reps: exercise.reps,
      rest_time: exercise.rest_time
    }))
  };
  
  // Save the mock workout plan to database using the same function as AI
  console.log("Saving mock workout plan to database...");
  return await saveAIWorkoutPlan(aiResponse, userProfile);
}

/**
 * Generate default exercises based on fitness goal
 * Used when AI response is missing exercise data
 */
function generateDefaultExercises(fitnessGoal: string): WorkoutExercise[] {
  const defaultExercises: WorkoutExercise[] = [];
  
  switch (fitnessGoal) {
    case 'weight-loss':
      defaultExercises.push(
        { name: "Jumping Jacks", sets: 3, reps: "30 seconds", muscle: "Full Body" },
        { name: "Mountain Climbers", sets: 3, reps: "30 seconds", muscle: "Core" },
        { name: "Burpees", sets: 3, reps: "10", muscle: "Full Body" },
        { name: "Squat Jumps", sets: 3, reps: "15", muscle: "Legs" },
        { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
        { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" }
      );
      break;
      
    case 'muscle-gain':
      defaultExercises.push(
        { name: "Bench Press", sets: 4, reps: "8-10", muscle: "Chest" },
        { name: "Squats", sets: 4, reps: "8-10", muscle: "Legs" },
        { name: "Deadlifts", sets: 4, reps: "6-8", muscle: "Back" },
        { name: "Shoulder Press", sets: 3, reps: "8-10", muscle: "Shoulders" },
        { name: "Bent-over Rows", sets: 3, reps: "8-10", muscle: "Back" },
        { name: "Bicep Curls", sets: 3, reps: "10-12", muscle: "Arms" }
      );
      break;
      
    case 'endurance':
      defaultExercises.push(
        { name: "Running", sets: 1, reps: "30 minutes", muscle: "Full Body" },
        { name: "Cycling", sets: 1, reps: "45 minutes", muscle: "Legs" },
        { name: "Jump Rope", sets: 3, reps: "5 minutes", muscle: "Full Body" },
        { name: "Bodyweight Lunges", sets: 3, reps: "20 each leg", muscle: "Legs" },
        { name: "Push-ups", sets: 3, reps: "15-20", muscle: "Chest" }
      );
      break;
      
    case 'general-fitness':
    default:
      defaultExercises.push(
        { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
        { name: "Bodyweight Squats", sets: 3, reps: "15-20", muscle: "Legs" },
        { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" },
        { name: "Mountain Climbers", sets: 3, reps: "30 seconds", muscle: "Core" },
        { name: "Lunges", sets: 3, reps: "10 each leg", muscle: "Legs" },
        { name: "Glute Bridges", sets: 3, reps: "15", muscle: "Glutes" }
      );
  }
  
  return defaultExercises;
}
