// Test script to validate AI workout generation
// Run with: node debug_ai_workout.mjs
import 'dotenv/config';
import fetch from 'node-fetch';

const API_KEY = process.env.VITE_OPENAI_API_KEY;
const API_ENDPOINT = process.env.VITE_OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.VITE_OPENAI_MODEL || "gpt-4o";

if (!API_KEY) {
  console.error("❌ VITE_OPENAI_API_KEY environment variable is required");
  process.exit(1);
}

async function testAIWorkoutGeneration() {
  console.log("=== Testing AI Workout Generation ===");
  console.log("API Key:", API_KEY ? "Present" : "Missing");
  console.log("API Endpoint:", API_ENDPOINT);
  console.log("Model:", MODEL);
  
  const userProfile = {
    id: "test-user-id",
    age: 30,
    sex: "male",
    height: 180,
    weight: 75,
    fitness_goal: "muscle-gain",
    fitness_level: "intermediate",
    available_equipment: ["dumbbells", "pull-up-bar", "resistance-bands"],
    workout_frequency: 4
  };
  
  // Validate user profile
  if (!userProfile.age || userProfile.age < 1 || userProfile.age > 120) {
    throw new Error('Invalid age provided');
  }
  if (userProfile.height && (userProfile.height < 50 || userProfile.height > 300)) {
    throw new Error('Invalid height provided');
  }
  if (userProfile.weight && (userProfile.weight < 10 || userProfile.weight > 500)) {
    throw new Error('Invalid weight provided');
  }
  
  try {
    // Create prompt
    const prompt = createTestPrompt(userProfile);
    console.log("\nPrompt created successfully.");
    
    // Call OpenAI API
    console.log("\nCalling OpenAI API...");
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert personal trainer who creates personalized workout plans. Respond only with a JSON object that follows the structure shown in the user\'s message. Do not include any explanations or text outside of the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        response_format: { type: "json_object" }
      })
    });
    
    console.log("OpenAI API Response Status:", response.status);
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = await response.text();
      }
      console.error(`OpenAI API Error (${response.status} ${response.statusText}):`, errorData);
      return;
    }
    
    // Parse response
    const data = await response.json();
    console.log("\nResponse received from OpenAI API.");
    
    try {
      const workoutPlan = JSON.parse(data.choices[0].message.content);
      console.log("\nWorkout plan parsed successfully!");
      console.log("Title:", workoutPlan.title);
      console.log("Description:", workoutPlan.description);
      console.log("Target muscle groups:", workoutPlan.target_muscle_groups?.join(", "));
      console.log("Days in plan:", Object.keys(workoutPlan.weekly_structure?.days || {}).length);
      
      // Print the first exercise as a sample
      const days = workoutPlan.weekly_structure?.days;
      if (days && Object.keys(days).length > 0 && Array.isArray(workoutPlan.exercises)) {
        const firstDayKey = Object.keys(days)[0];
        const firstDayExercises = workoutPlan.exercises.find(day => day.day === firstDayKey);
        if (firstDayExercises && Array.isArray(firstDayExercises.exercises) && firstDayExercises.exercises.length > 0) {
          console.log("\nSample exercise from", firstDayKey, ":");
          console.log(JSON.stringify(firstDayExercises.exercises[0], null, 2));
        }
      }
      
      console.log("\n✅ TEST SUCCESSFUL: AI workout plan generation is working properly!");
    } catch (parseError) {
      console.error("\n❌ Failed to parse workout plan JSON:", parseError);
      console.log("Raw content:", data.choices[0].message.content);
    }
  } catch (error) {
    console.error("\n❌ Error in test:", error);
  }
}

function createTestPrompt(userProfile) {
  const { 
    age, 
    sex, 
    height, 
    weight, 
    fitness_goal, 
    fitness_level,
    available_equipment,
    workout_frequency  } = userProfile;
    // Calculate BMI if height and weight are available and valid
  const bmi = (height && weight && height > 0 && weight > 0) ? 
    weight / ((height / 100) * (height / 100)) : null;
  
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
- Workout Frequency: ${workout_frequency || '3-4'} times per week`;

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

  Provide 3-6 exercises per workout day based on fitness level. Include at least 1-2 rest days per week.`;

  return prompt;
}

testAIWorkoutGeneration();
