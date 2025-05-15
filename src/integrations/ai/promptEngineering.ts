import { UserProfile } from "@/models/models";

// Define the expected response format for OpenAI
export interface AIWorkoutResponseFormat {
  title: string;
  description: string;
  weekly_structure: {
    day: string;
    focus: string;
    duration: number;
  }[];
  exercises: {
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    rest_time?: number;
    difficulty: string;
    equipment_required?: string;
    instructions?: string;
  }[];
}

/**
 * Creates a comprehensive workout generation prompt for OpenAI
 * @param userProfile The user's profile data with preferences
 * @returns A formatted prompt string
 */
export const createWorkoutGenerationPrompt = (userProfile: UserProfile & Record<string, any>): string => {
  // Extract relevant user information
  const {
    age,
    sex,
    height,
    weight,
    fitness_goal,
    equipment_available = "minimal",
    experience_level = "beginner",
    preferred_workout_duration = 45,
    preferred_workout_days = 4,
    focus_areas = "full-body",
    health_conditions = "",
  } = userProfile;
  
  // Calculate BMI for reference
  const bmi = weight / ((height / 100) ** 2);
  const bmiCategory = getBMICategory(bmi);
  
  // Format the prompt
  return `
Generate a personalized workout plan for the following user:

USER PROFILE:
- Age: ${age}
- Sex: ${sex}
- Height: ${height}cm
- Weight: ${weight}kg
- BMI: ${bmi.toFixed(1)} (${bmiCategory})
- Fitness Goal: ${formatGoal(fitness_goal)}
- Equipment Available: ${formatEquipment(equipment_available)}
- Experience Level: ${capitalizeFirstLetter(experience_level)}
- Preferred Workout Duration: ${preferred_workout_duration} minutes per session
- Preferred Workout Days: ${preferred_workout_days} days per week
- Focus Areas: ${formatFocusArea(focus_areas)}
${health_conditions ? `- Health Considerations: ${health_conditions}` : ''}

REQUIREMENTS:
1. Create a personalized workout plan that aligns with the user's fitness goals and considers their profile data.
2. Design a structured weekly plan with appropriate exercises, sets, and reps.
3. Include appropriate rest days based on experience level and goals.
4. Only include exercises that can be performed with the available equipment.
5. Adjust difficulty level based on the user's experience.
6. Ensure exercises are safe considering any health conditions mentioned.

Your response must be a valid JSON object with the following structure:

{
  "title": "Name of the workout plan",
  "description": "Brief description of the workout plan",
  "weekly_structure": [
    {
      "day": "Monday",
      "focus": "The focus of this day's workout (e.g., Upper Body, Cardio)",
      "duration": 45
    },
    ...additional days
  ],
  "exercises": [
    {
      "name": "Exercise name",
      "muscle": "Primary muscle group targeted",
      "sets": 3,
      "reps": "8-12",
      "difficulty": "beginner|intermediate|advanced",
      "equipment_required": "Equipment needed",
      "instructions": "Brief instructions on how to perform"
    },
    ...additional exercises
  ]
}

Include at least 4-6 exercises for each workout day, and ensure the total number of exercises is sufficient for the workout duration. Only respond with valid JSON that matches this structure.
`;
};

/**
 * Formats fitness goal for more specificity in the prompt
 */
const formatGoal = (goal: string): string => {
  switch (goal) {
    case "weight-loss":
      return "Weight Loss (Fat Reduction)";
    case "muscle-gain":
      return "Muscle Gain (Hypertrophy)";
    case "strength":
      return "Strength Improvement";
    case "endurance":
      return "Endurance Building";
    case "general-fitness":
      return "General Fitness & Conditioning";
    default:
      return capitalizeFirstLetter(goal.replace(/-/g, ' '));
  }
};

/**
 * Formats equipment availability for more context
 */
const formatEquipment = (equipment: string): string => {
  switch (equipment) {
    case "none":
      return "No Equipment (Bodyweight Only)";
    case "minimal":
      return "Minimal Equipment (Dumbbells, Resistance Bands)";
    case "home-gym":
      return "Home Gym Setup (Various Equipment)";
    case "full-gym":
      return "Full Gym Access";
    default:
      return capitalizeFirstLetter(equipment.replace(/-/g, ' '));
  }
};

/**
 * Formats focus area for the prompt
 */
const formatFocusArea = (focus: string): string => {
  switch (focus) {
    case "full-body":
      return "Full Body Conditioning";
    case "upper-body":
      return "Upper Body Focus (Chest, Back, Arms, Shoulders)";
    case "lower-body":
      return "Lower Body Focus (Legs, Glutes)";
    case "core":
      return "Core Strength & Stability";
    case "cardio":
      return "Cardiovascular Endurance";
    case "flexibility":
      return "Flexibility & Mobility";
    default:
      return capitalizeFirstLetter(focus.replace(/-/g, ' '));
  }
};

/**
 * Helper to capitalize first letter of string
 */
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 * Calculates BMI category
 */
const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
};

/**
 * Creates a prompt for generating a single workout
 * @param userProfile User profile data
 * @param focusArea The focus area for this workout
 * @param duration Workout duration in minutes
 * @returns Formatted prompt
 */
export const createSingleWorkoutPrompt = (
  userProfile: UserProfile & Record<string, any>,
  focusArea: string,
  duration: number
): string => {
  // Extract relevant user information
  const { 
    age, 
    sex, 
    height, 
    weight, 
    fitness_goal, 
    experience_level = "beginner" 
  } = userProfile;
  
  return `
Generate a single workout session for the following user:

USER PROFILE:
- Age: ${age}
- Sex: ${sex}
- Height: ${height}cm
- Weight: ${weight}kg
- Fitness Goal: ${formatGoal(fitness_goal)}
- Experience Level: ${capitalizeFirstLetter(experience_level)}

WORKOUT SPECIFICATIONS:
- Focus Area: ${formatFocusArea(focusArea)}
- Duration: ${duration} minutes

Create a workout with appropriate exercises, sets, and reps that can be completed within the specified duration.
Include warm-up and cool-down suggestions.

Your response should be in valid JSON format:
{
  "title": "Workout name",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "8-12",
      "rest": 60,
      "instructions": "Brief instructions"
    }
  ],
  "warmup": "Warmup instructions",
  "cooldown": "Cooldown instructions"
}
`;
};

/**
 * Creates a system message for ChatGPT that sets context for workout generation
 * @returns System message string
 */
export const getWorkoutSystemMessage = (): string => {
  return `You are an expert personal trainer with over 10 years of experience helping clients achieve their fitness goals. 
You have certifications in exercise physiology, strength training, and nutrition. 
You specialize in creating evidence-based workout plans tailored to individual needs and goals.
Your responses should be scientifically accurate, prioritize safety, and follow proper exercise progression principles.
When designing workouts, consider the following:
1. Progressive overload principles
2. Appropriate rest periods between sets and workout days
3. Balanced muscle group targeting to prevent imbalances
4. Variety to prevent plateaus
5. Proper exercise selection based on available equipment
6. Exercise modifications for any health considerations

Provide detailed, practical workout plans that users can immediately implement.`;
};

/**
 * Processes and cleans an AI response to ensure it matches our expected format
 * @param aiResponse The raw response from OpenAI
 * @returns Cleaned and validated response object
 */
export const processAIWorkoutResponse = (aiResponse: any): AIWorkoutResponseFormat => {
  try {
    // Ensure the response has the required structure
    const processed: AIWorkoutResponseFormat = {
      title: aiResponse.title || "Custom Workout Plan",
      description: aiResponse.description || "AI-generated workout plan",
      weekly_structure: Array.isArray(aiResponse.weekly_structure) 
        ? aiResponse.weekly_structure.map((day: any) => ({
            day: day.day || "Unknown",
            focus: day.focus || "General workout",
            duration: Number(day.duration) || 45
          }))
        : [],
      exercises: Array.isArray(aiResponse.exercises)
        ? aiResponse.exercises.map((exercise: any) => ({
            name: exercise.name || "Unknown exercise",
            muscle: exercise.muscle || "Multiple muscles",
            sets: Number(exercise.sets) || 3,
            reps: exercise.reps || "10-12",
            rest_time: Number(exercise.rest_time) || 60,
            difficulty: exercise.difficulty || "intermediate",
            equipment_required: exercise.equipment_required || "bodyweight",
            instructions: exercise.instructions || ""
          }))
        : []
    };
    
    return processed;
  } catch (error) {
    console.error("Error processing AI workout response:", error);
    // Return a minimal valid structure
    return {
      title: "Custom Workout Plan",
      description: "An error occurred processing the AI response. This is a fallback plan.",
      weekly_structure: [
        { day: "Monday", focus: "Full Body", duration: 45 },
        { day: "Wednesday", focus: "Full Body", duration: 45 },
        { day: "Friday", focus: "Full Body", duration: 45 }
      ],
      exercises: [
        { 
          name: "Push-ups", 
          muscle: "Chest", 
          sets: 3, 
          reps: "10-12",
          difficulty: "beginner",
          equipment_required: "bodyweight",
          instructions: "Start in a plank position and lower your chest to the ground, then push back up."
        },
        { 
          name: "Bodyweight Squats", 
          muscle: "Legs", 
          sets: 3, 
          reps: "15-20",
          difficulty: "beginner",
          equipment_required: "bodyweight",
          instructions: "Stand with feet shoulder-width apart, lower by bending knees, then stand back up."
        }
      ]
    };
  }
}; 