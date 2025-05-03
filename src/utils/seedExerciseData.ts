import { supabase } from "@/integrations/supabase/client";

interface Exercise {
  name: string;
  description: string;
  muscle_group: string;
  difficulty: string;
  exercise_type: string;
}

// Seed the database with exercise data
export const seedExerciseData = async () => {
  try {
    // Check if exercises already exist
    const { count, error: countError } = await supabase
      .from('exercises')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    
    // If we already have exercises, don't seed again
    if (count && count > 0) {
      console.log(`Database already has ${count} exercises. Skipping seed.`);
      return;
    }

    // Insert exercises in batches to avoid payload size limits
    const exercises = getExerciseData();
    const batchSize = 50;

    for (let i = 0; i < exercises.length; i += batchSize) {
      const batch = exercises.slice(i, i + batchSize);
      const { error } = await supabase
        .from('exercises')
        .insert(batch);

      if (error) throw error;
    }

    console.log(`Successfully seeded ${exercises.length} exercises`);
  } catch (error) {
    console.error("Error seeding exercise data:", error);
  }
};

// List of exercises for different muscle groups and fitness goals
const getExerciseData = (): Exercise[] => {
  return [
    // Chest exercises
    {
      name: "Push-ups",
      description: "A bodyweight exercise that works the chest, shoulders, and triceps",
      muscle_group: "chest",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Bench Press",
      description: "A barbell exercise that targets the chest, shoulders, and triceps",
      muscle_group: "chest",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Dumbbell Flyes",
      description: "An isolation exercise that focuses on chest development",
      muscle_group: "chest",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Incline Press",
      description: "A variation of the bench press that targets the upper chest",
      muscle_group: "chest",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Cable Crossovers",
      description: "A cable exercise that isolates the chest muscles",
      muscle_group: "chest",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    
    // Back exercises
    {
      name: "Pull-ups",
      description: "A bodyweight exercise that works the back and biceps",
      muscle_group: "back",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Lat Pulldowns",
      description: "A cable exercise that targets the latissimus dorsi muscles",
      muscle_group: "back",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Bent Over Rows",
      description: "A barbell exercise that works the middle back and lats",
      muscle_group: "back",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Deadlifts",
      description: "A compound exercise that works multiple muscle groups, primarily the back",
      muscle_group: "back",
      difficulty: "advanced",
      exercise_type: "strength"
    },
    {
      name: "Seated Cable Rows",
      description: "A cable exercise that targets the middle back",
      muscle_group: "back",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    
    // Legs exercises
    {
      name: "Squats",
      description: "A compound exercise that works the quadriceps, hamstrings, and glutes",
      muscle_group: "legs",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Lunges",
      description: "A unilateral exercise that targets the quadriceps, hamstrings, and glutes",
      muscle_group: "legs",
      difficulty: "beginner",
      exercise_type: "functional"
    },
    {
      name: "Leg Press",
      description: "A machine exercise that works the quadriceps, hamstrings, and glutes",
      muscle_group: "legs",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Romanian Deadlifts",
      description: "A variation of deadlifts that focuses on hamstrings and glutes",
      muscle_group: "legs",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Leg Extensions",
      description: "An isolation exercise that targets the quadriceps",
      muscle_group: "legs",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    
    // Shoulders exercises
    {
      name: "Overhead Press",
      description: "A compound exercise that works the shoulders and triceps",
      muscle_group: "shoulders",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Lateral Raises",
      description: "An isolation exercise that targets the lateral deltoids",
      muscle_group: "shoulders",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Front Raises",
      description: "An isolation exercise that targets the anterior deltoids",
      muscle_group: "shoulders",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Face Pulls",
      description: "A cable exercise that works the rear deltoids and upper back",
      muscle_group: "shoulders",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    
    // Arms exercises
    {
      name: "Bicep Curls",
      description: "An isolation exercise that targets the biceps",
      muscle_group: "arms",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Tricep Dips",
      description: "A bodyweight exercise that works the triceps",
      muscle_group: "arms",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Skull Crushers",
      description: "A lying tricep extension exercise that targets the triceps",
      muscle_group: "arms",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Hammer Curls",
      description: "A variation of bicep curls that also targets the forearms",
      muscle_group: "arms",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    
    // Core exercises
    {
      name: "Plank",
      description: "An isometric core exercise that builds endurance in the abdominals",
      muscle_group: "core",
      difficulty: "beginner",
      exercise_type: "functional"
    },
    {
      name: "Russian Twists",
      description: "A rotational exercise that targets the obliques",
      muscle_group: "core",
      difficulty: "beginner",
      exercise_type: "functional"
    },
    {
      name: "Crunches",
      description: "A classic abdominal exercise that targets the rectus abdominis",
      muscle_group: "core",
      difficulty: "beginner",
      exercise_type: "strength"
    },
    {
      name: "Leg Raises",
      description: "A lower abdominal exercise that targets the lower rectus abdominis",
      muscle_group: "core",
      difficulty: "intermediate",
      exercise_type: "strength"
    },
    {
      name: "Mountain Climbers",
      description: "A dynamic exercise that works the core, shoulders, and hip flexors",
      muscle_group: "core",
      difficulty: "beginner",
      exercise_type: "hiit"
    },
    
    // Cardio exercises
    {
      name: "Running",
      description: "A cardiovascular exercise that improves endurance and burns calories",
      muscle_group: "full-body",
      difficulty: "beginner",
      exercise_type: "cardio"
    },
    {
      name: "Jumping Jacks",
      description: "A full-body exercise that raises heart rate and improves coordination",
      muscle_group: "full-body",
      difficulty: "beginner",
      exercise_type: "cardio"
    },
    {
      name: "Burpees",
      description: "A full-body exercise that combines a push-up, jump, and squat",
      muscle_group: "full-body",
      difficulty: "intermediate",
      exercise_type: "hiit"
    },
    {
      name: "Jump Rope",
      description: "A cardiovascular exercise that improves coordination and burns calories",
      muscle_group: "full-body",
      difficulty: "beginner",
      exercise_type: "cardio"
    },
    {
      name: "High Knees",
      description: "A cardio exercise that works the legs and core",
      muscle_group: "full-body",
      difficulty: "beginner",
      exercise_type: "hiit"
    },
    
    // HIIT specific exercises
    {
      name: "Box Jumps",
      description: "A plyometric exercise that works the legs and improves power",
      muscle_group: "legs",
      difficulty: "intermediate",
      exercise_type: "hiit"
    },
    {
      name: "Battle Ropes",
      description: "A high-intensity exercise that works the upper body and core",
      muscle_group: "full-body",
      difficulty: "intermediate",
      exercise_type: "hiit"
    },
    {
      name: "Kettlebell Swings",
      description: "A dynamic exercise that works the posterior chain and cardiovascular system",
      muscle_group: "full-body",
      difficulty: "intermediate",
      exercise_type: "hiit"
    },
    
    // Endurance specific exercises
    {
      name: "Cycling",
      description: "A low-impact cardiovascular exercise that improves leg endurance",
      muscle_group: "legs",
      difficulty: "beginner",
      exercise_type: "endurance"
    },
    {
      name: "Swimming",
      description: "A full-body, low-impact exercise that improves cardiovascular endurance",
      muscle_group: "full-body",
      difficulty: "intermediate",
      exercise_type: "endurance"
    },
    {
      name: "Rowing",
      description: "A full-body exercise that improves cardiovascular and muscular endurance",
      muscle_group: "full-body",
      difficulty: "intermediate",
      exercise_type: "endurance"
    },
    
    // Mobility exercises
    {
      name: "Hip Flexor Stretch",
      description: "A stretching exercise that improves hip mobility",
      muscle_group: "legs",
      difficulty: "beginner",
      exercise_type: "mobility"
    },
    {
      name: "Cat-Cow Stretch",
      description: "A yoga movement that improves spine mobility",
      muscle_group: "back",
      difficulty: "beginner",
      exercise_type: "mobility"
    },
    {
      name: "Shoulder Dislocates",
      description: "A mobility exercise that improves shoulder range of motion",
      muscle_group: "shoulders",
      difficulty: "beginner",
      exercise_type: "mobility"
    }
  ];
};
