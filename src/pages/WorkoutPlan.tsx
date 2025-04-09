
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Dumbbell, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";

const WorkoutPlan: React.FC = () => {
  const navigate = useNavigate();
  // Get user profile from localStorage
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const fitnessGoal = userProfile.fitnessGoal || "general-fitness";

  // Workout plans based on fitness goals
  const workoutPlans = {
    "weight-loss": {
      title: "Fat Burning Program",
      description: "High-intensity workouts focused on calorie burn and fat loss",
      weeklyStructure: [
        { day: "Monday", focus: "HIIT Cardio", duration: 45 },
        { day: "Tuesday", focus: "Lower Body Circuit", duration: 40 },
        { day: "Wednesday", focus: "Active Recovery", duration: 30 },
        { day: "Thursday", focus: "Upper Body & Core", duration: 40 },
        { day: "Friday", focus: "HIIT & Cardio", duration: 45 },
        { day: "Saturday", focus: "Full Body Circuit", duration: 50 },
        { day: "Sunday", focus: "Rest Day", duration: 0 }
      ],
      exercises: [
        { name: "Burpees", sets: 4, reps: "15", muscle: "Full Body" },
        { name: "Mountain Climbers", sets: 3, reps: "30 seconds", muscle: "Core" },
        { name: "Jumping Jacks", sets: 4, reps: "45 seconds", muscle: "Cardio" },
        { name: "Squat Jumps", sets: 4, reps: "15", muscle: "Lower Body" },
        { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
        { name: "Bicycle Crunches", sets: 3, reps: "20 each side", muscle: "Core" }
      ]
    },
    "muscle-gain": {
      title: "Muscle Building Program",
      description: "Progressive overload focused on hypertrophy and strength",
      weeklyStructure: [
        { day: "Monday", focus: "Chest & Triceps", duration: 60 },
        { day: "Tuesday", focus: "Back & Biceps", duration: 60 },
        { day: "Wednesday", focus: "Rest & Recovery", duration: 0 },
        { day: "Thursday", focus: "Legs & Calves", duration: 60 },
        { day: "Friday", focus: "Shoulders & Arms", duration: 60 },
        { day: "Saturday", focus: "Core & Cardio", duration: 40 },
        { day: "Sunday", focus: "Rest Day", duration: 0 }
      ],
      exercises: [
        { name: "Barbell Bench Press", sets: 4, reps: "8-10", muscle: "Chest" },
        { name: "Deadlift", sets: 4, reps: "6-8", muscle: "Back" },
        { name: "Squats", sets: 4, reps: "8-10", muscle: "Legs" },
        { name: "Overhead Press", sets: 3, reps: "8-10", muscle: "Shoulders" },
        { name: "Barbell Row", sets: 3, reps: "8-12", muscle: "Back" },
        { name: "Dumbbell Curl", sets: 3, reps: "10-12", muscle: "Biceps" }
      ]
    },
    "general-fitness": {
      title: "Balanced Fitness Program",
      description: "Well-rounded approach to improve overall fitness and health",
      weeklyStructure: [
        { day: "Monday", focus: "Full Body Strength", duration: 45 },
        { day: "Tuesday", focus: "Cardio & Mobility", duration: 40 },
        { day: "Wednesday", focus: "Core & Balance", duration: 30 },
        { day: "Thursday", focus: "Rest or Light Activity", duration: 20 },
        { day: "Friday", focus: "Full Body Circuit", duration: 45 },
        { day: "Saturday", focus: "Cardio & Flexibility", duration: 40 },
        { day: "Sunday", focus: "Rest Day", duration: 0 }
      ],
      exercises: [
        { name: "Dumbbell Squat", sets: 3, reps: "12-15", muscle: "Legs" },
        { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
        { name: "Dumbbell Row", sets: 3, reps: "12 each arm", muscle: "Back" },
        { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" },
        { name: "Walking Lunges", sets: 2, reps: "10 each leg", muscle: "Legs" },
        { name: "Jumping Jacks", sets: 3, reps: "45 seconds", muscle: "Cardio" }
      ]
    },
    "endurance": {
      title: "Endurance Building Program",
      description: "Focus on improving stamina, cardiovascular health and muscular endurance",
      weeklyStructure: [
        { day: "Monday", focus: "Long Distance Cardio", duration: 60 },
        { day: "Tuesday", focus: "Upper Body Endurance", duration: 45 },
        { day: "Wednesday", focus: "Interval Training", duration: 30 },
        { day: "Thursday", focus: "Lower Body Endurance", duration: 45 },
        { day: "Friday", focus: "HIIT", duration: 30 },
        { day: "Saturday", focus: "Long Distance Cardio", duration: 60 },
        { day: "Sunday", focus: "Active Recovery", duration: 30 }
      ],
      exercises: [
        { name: "Running", sets: 1, reps: "30-45 minutes", muscle: "Cardio" },
        { name: "Bodyweight Squats", sets: 4, reps: "25", muscle: "Legs" },
        { name: "Push-ups", sets: 4, reps: "20", muscle: "Chest" },
        { name: "Mountain Climbers", sets: 4, reps: "60 seconds", muscle: "Core" },
        { name: "Cycling", sets: 1, reps: "45 minutes", muscle: "Cardio" },
        { name: "Jumping Rope", sets: 5, reps: "3 minutes", muscle: "Cardio" }
      ]
    }
  };

  const selectedPlan = workoutPlans[fitnessGoal as keyof typeof workoutPlans] || workoutPlans["general-fitness"];
  
  // Mock data for suggested workouts
  const todayWorkout = {
    title: selectedPlan.weeklyStructure[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].focus,
    description: `Focus on ${selectedPlan.weeklyStructure[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].focus.toLowerCase()} exercises for optimal results`,
    duration: selectedPlan.weeklyStructure[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].duration,
    exercises: Math.floor(Math.random() * 3) + 4, // Random number between 4-6
    date: "Today",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
  };

  return (
    <DashboardLayout title="Workout Plans">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{selectedPlan.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {selectedPlan.description}
        </p>
        
        <div className="bg-fitness-primary bg-opacity-10 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Weekly Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {selectedPlan.weeklyStructure.map((day, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  new Date().getDay() === (index + 1) % 7 ? 
                  'border-fitness-primary bg-fitness-primary bg-opacity-5' : 
                  'border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="font-medium">{day.day}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{day.focus}</p>
                {day.duration > 0 ? (
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{day.duration} mins</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">Rest Day</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Dumbbell className="mr-2 h-5 w-5" />
            Key Exercises
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Exercise</th>
                  <th className="py-3 px-4 text-left">Sets</th>
                  <th className="py-3 px-4 text-left">Reps</th>
                  <th className="py-3 px-4 text-left">Target Muscle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {selectedPlan.exercises.map((exercise, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">{exercise.name}</td>
                    <td className="py-3 px-4">{exercise.sets}</td>
                    <td className="py-3 px-4">{exercise.reps}</td>
                    <td className="py-3 px-4">{exercise.muscle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Today's Workout
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WorkoutCard
            title={todayWorkout.title}
            description={todayWorkout.description}
            duration={todayWorkout.duration}
            exercises={todayWorkout.exercises}
            date={todayWorkout.date}
            image={todayWorkout.image}
          />

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h4 className="text-lg font-medium mb-4">Ready to start?</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your personalized workout is ready for today. Follow the plan to reach your fitness goals faster.
            </p>
            <Button className="w-full fitness-button-primary">
              Start Workout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WorkoutPlan;
