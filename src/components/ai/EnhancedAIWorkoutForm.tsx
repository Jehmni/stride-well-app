import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Dumbbell, Loader2, User, Clock, Target, Settings, Lightbulb, Star, CheckCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/integrations/supabase/aiConfig";
import { clearExistingAIPlans } from "@/services/workoutService";
import { useNavigate } from "react-router-dom";

interface FormData {
  fitnessGoal: string;
  workoutDaysPerWeek: number;
  workoutDuration: number;
  equipment: string[];
  fitnessFocus: string[];
  specificGoals: string;
  includeMeasurements: boolean;
}

interface UserMeasurements {
  chest: number | null;
  waist: number | null;
  hips: number | null;
  arms: number | null;
  thighs: number | null;
  lastMeasuredDate: string | null;
}

const fitnessGoalOptions = [
  { value: "weight-loss", label: "Weight Loss", icon: "🔥", color: "from-red-500 to-orange-500" },
  { value: "muscle-gain", label: "Muscle Gain", icon: "💪", color: "from-blue-500 to-purple-500" },
  { value: "general-fitness", label: "General Fitness", icon: "⚡", color: "from-green-500 to-blue-500" },
  { value: "endurance", label: "Endurance", icon: "🏃", color: "from-cyan-500 to-blue-500" },
  { value: "strength", label: "Strength", icon: "🏋️", color: "from-purple-500 to-pink-500" },
  { value: "flexibility", label: "Flexibility", icon: "🧘", color: "from-pink-500 to-rose-500" },
];

const equipmentOptions = [
  { id: "none", label: "None / Bodyweight Only", icon: "🤸", popular: true },
  { id: "dumbbells", label: "Dumbbells", icon: "🏋️", popular: true },
  { id: "barbells", label: "Barbells", icon: "💪", popular: false },
  { id: "kettlebells", label: "Kettlebells", icon: "⚡", popular: false },
  { id: "resistance-bands", label: "Resistance Bands", icon: "🎯", popular: true },
  { id: "trx", label: "TRX / Suspension Trainer", icon: "🔗", popular: false },
  { id: "gym-machines", label: "Gym Machines", icon: "🏢", popular: false },
  { id: "pull-up-bar", label: "Pull-up Bar", icon: "📏", popular: true },
  { id: "bench", label: "Bench", icon: "🪑", popular: false },
  { id: "box", label: "Plyo Box", icon: "📦", popular: false },
];

const focusAreaOptions = [
  { id: "upper-body", label: "Upper Body", icon: "💪", gradient: "from-blue-500 to-purple-500" },
  { id: "lower-body", label: "Lower Body", icon: "🦵", gradient: "from-green-500 to-blue-500" },
  { id: "core", label: "Core/Abs", icon: "⚡", gradient: "from-yellow-500 to-orange-500" },
  { id: "back", label: "Back", icon: "🔄", gradient: "from-indigo-500 to-purple-500" },
  { id: "chest", label: "Chest", icon: "🎯", gradient: "from-red-500 to-pink-500" },
  { id: "arms", label: "Arms", icon: "💪", gradient: "from-purple-500 to-pink-500" },
  { id: "shoulders", label: "Shoulders", icon: "🏔️", gradient: "from-cyan-500 to-blue-500" },
  { id: "legs", label: "Legs", icon: "🦵", gradient: "from-green-500 to-emerald-500" },
  { id: "glutes", label: "Glutes", icon: "🍑", gradient: "from-pink-500 to-rose-500" },
  { id: "cardio", label: "Cardiovascular", icon: "❤️", gradient: "from-red-500 to-orange-500" },
];

const EnhancedAIWorkoutForm: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [measurements, setMeasurements] = useState<UserMeasurements>({
    chest: null,
    waist: null,
    hips: null,
    arms: null,
    thighs: null,
    lastMeasuredDate: null,
  });
  
  const [formData, setFormData] = useState<FormData>({
    fitnessGoal: profile?.fitness_goal || "general-fitness",
    workoutDaysPerWeek: 3,
    workoutDuration: 45,
    equipment: [],
    fitnessFocus: [],
    specificGoals: "",
    includeMeasurements: true,
  });

  useEffect(() => {
    if (user) {
      fetchMeasurements();
    }
  }, [user]);

  const fetchMeasurements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (data && data.length > 0) {
        const latestMeasurement = data[0];
        setMeasurements({
          chest: latestMeasurement.chest,
          waist: latestMeasurement.waist,
          hips: latestMeasurement.hips,
          arms: latestMeasurement.arms,
          thighs: latestMeasurement.thighs,
          lastMeasuredDate: latestMeasurement.measured_at,
        });
      }
    } catch (error) {
      console.error("Error fetching measurements:", error);
      toast.error("Failed to load your measurements data");
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEquipmentChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      equipment: checked
        ? [...prev.equipment, id]
        : prev.equipment.filter((item) => item !== id),
    }));
  };

  const handleFocusAreaChange = (id: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      fitnessFocus: checked
        ? [...prev.fitnessFocus, id]
        : prev.fitnessFocus.filter((item) => item !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("== AI Workout Generation: Starting workflow ==");
    if (!user || !profile) {
      console.error("AI Workout Generation: Missing user or profile data");
      toast.error("You must be logged in to generate a workout");
      return;
    }

    setIsLoading(true);
    try {
      // 0. Clear existing AI plans to ensure fresh generation
      console.log("AI Workout Generation: Clearing existing AI workout plans...");
      const cleared = await clearExistingAIPlans(user.id);
      console.log("AI Workout Generation: Cleared existing plans:", cleared);
      
      // 1. Get OpenAI configuration
      console.log("AI Workout Generation: Getting OpenAI configuration...");
      const aiConfig = await getAIConfig("openai");
      console.log("AI Workout Generation: OpenAI config:", aiConfig ? "Found" : "Not found", 
                  aiConfig ? `API key: ${aiConfig.api_key ? "Present" : "Missing"}, Enabled: ${aiConfig.is_enabled}` : "");
      
      if (!aiConfig || !aiConfig.api_key || !aiConfig.is_enabled) {
        console.error("AI Workout Generation: OpenAI not configured correctly");
        toast.error("AI workout generation is not configured");
        return;
      }

      // 2. Create prompt with all user data
      console.log("AI Workout Generation: Creating enhanced prompt...");
      const prompt = createEnhancedPrompt(profile, formData, measurements);
      console.log("AI Workout Generation: Prompt created successfully");

      // 3. Call OpenAI API
      console.log("AI Workout Generation: Calling OpenAI API...");
      console.log(`API Endpoint: ${aiConfig.api_endpoint}`);
      console.log(`Model: ${aiConfig.model_name || "gpt-4o"}`);
      
      try {
        const response = await fetch(aiConfig.api_endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${aiConfig.api_key}`,
          },
          body: JSON.stringify({
            model: aiConfig.model_name || "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "You are a professional fitness trainer who creates personalized workout plans. Respond only with a JSON object that follows the structure shown in the user's message. Do not include any explanations or text outside of the JSON structure.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),        });

        console.log("AI Workout Generation: OpenAI API response status:", response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error("AI Workout Generation: OpenAI API error:", errorData);
          toast.error("Failed to generate AI workout");
          return;
        }

        // 4. Parse response and save to database
        const data = await response.json();
        console.log("AI Workout Generation: Got response from OpenAI API");
        
        // Verify that we have a valid response
        if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
          console.error("AI Workout Generation: Invalid OpenAI response format:", data);
          toast.error("Received invalid response from AI service");
          return;
        }
        
        const workoutPlanJson = data.choices[0].message.content;
        console.log("AI Workout Generation: Parsing workout plan JSON");
        
        // Parse the workout plan
        const workoutPlan = JSON.parse(workoutPlanJson);
        console.log("AI Workout Generation: Workout plan parsed successfully");
        
        console.log("AI Workout Generation: Saving workout plan to database");
        const { data: savedWorkout, error } = await supabase
          .from("workout_plans")
          .insert({
            name: workoutPlan.title,
            description: workoutPlan.description,
            fitness_goal: formData.fitnessGoal,
            weekly_structure: workoutPlan.weekly_structure,
            exercises: workoutPlan.exercises,
            ai_generated: true,
            user_id: user.id,
          })
          .select("id")
          .single();

        if (error) {
          console.error("AI Workout Generation: Error saving to database:", error);
          throw error;
        }
        
        console.log("AI Workout Generation: Workout plan saved successfully with ID:", savedWorkout.id);
        
        toast.success("AI workout generated successfully!");
        navigate(`/ai-workouts/${savedWorkout.id}`);
        
      } catch (error) {
        console.error("Error in OpenAI API call or data processing:", error);
        toast.error("Failed to generate AI workout. Please try again.");
      }
    } catch (error) {
      console.error("Error generating AI workout:", error);
      toast.error("Failed to generate and save workout plan");
    } finally {
      setIsLoading(false);
    }
  };

  const createEnhancedPrompt = (
    profile: any,
    formData: FormData,
    measurements: UserMeasurements
  ): string => {
    const { age, sex, height, weight, fitness_goal } = profile;
    const bmi = weight / ((height / 100) * (height / 100));

    let prompt = `Create a personalized workout plan for a ${age}-year-old ${sex} with a height of ${height}cm, weight of ${weight}kg, and a BMI of ${bmi.toFixed(
      1
    )}. Their fitness goal is: ${formData.fitnessGoal.replace("-", " ")}.`;

    // Add details on workout preferences
    prompt += `\n\nWORKOUT PREFERENCES:`;
    prompt += `\n- Days per week: ${formData.workoutDaysPerWeek}`;
    prompt += `\n- Session duration: ${formData.workoutDuration} minutes`;
    
    // Add equipment available
    if (formData.equipment.length > 0) {
      prompt += `\n\nAVAILABLE EQUIPMENT:`;
      formData.equipment.forEach((eq) => {
        prompt += `\n- ${eq.replace("-", " ")}`;
      });
    } else {
      prompt += `\n\nNo equipment available (bodyweight exercises only).`;
    }

    // Add focus areas
    if (formData.fitnessFocus.length > 0) {
      prompt += `\n\nFOCUS AREAS:`;
      formData.fitnessFocus.forEach((focus) => {
        prompt += `\n- ${focus.replace("-", " ")}`;
      });
    }

    // Add specific goals if provided
    if (formData.specificGoals.trim()) {
      prompt += `\n\nSPECIFIC GOALS: ${formData.specificGoals}`;
    }

    // Add measurements if available and user opted to include them
    if (
      formData.includeMeasurements &&
      measurements.lastMeasuredDate &&
      Object.values(measurements).some(
        (m) => m !== null && m !== measurements.lastMeasuredDate
      )
    ) {
      prompt += `\n\nBODY MEASUREMENTS:`;
      if (measurements.chest) prompt += `\n- Chest: ${measurements.chest}cm`;
      if (measurements.waist) prompt += `\n- Waist: ${measurements.waist}cm`;
      if (measurements.hips) prompt += `\n- Hips: ${measurements.hips}cm`;
      if (measurements.arms) prompt += `\n- Arms: ${measurements.arms}cm`;
      if (measurements.thighs) prompt += `\n- Thighs: ${measurements.thighs}cm`;
    }

    // Request JSON format
    prompt += `\n\nPlease provide the workout plan as a JSON object with the following structure:
    {
      "title": "Name of the workout plan",
      "description": "Brief overview of the workout plan and expected results",
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
    
    For each workout day, include ${formData.workoutDaysPerWeek === 1 ? '5-8' : '3-6'} exercises. Be specific with exercise names, sets, reps, and rest times. Include ${formData.workoutDaysPerWeek < 4 ? 'at least 1-2' : 'appropriate'} rest days per week.`;

    return prompt;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Progress Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div className={`relative w-12 h-12 rounded-full border-2 transition-all duration-500 ${
                step <= currentStep 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white shadow-lg' 
                  : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
              }`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {step < currentStep ? (
                    <CheckCircle className="h-6 w-6 text-white" />
                  ) : (
                    <span className="text-lg font-semibold">{step}</span>
                  )}
                </div>
                {step <= currentStep && (
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse opacity-25"></div>
                )}
              </div>
              <div className={`mt-3 text-sm font-medium transition-colors duration-300 ${
                step <= currentStep ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {step === 1 && 'Goals'}
                {step === 2 && 'Schedule'}
                {step === 3 && 'Equipment'}
                {step === 4 && 'Focus Areas'}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Bar */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200 dark:bg-gray-700 -z-10">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-700 ease-out"
            style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Form Content */}
      <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-pink-600/10 border-b border-gradient-to-r from-indigo-200 to-purple-200 dark:from-indigo-800 dark:to-purple-800">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                AI Workout Generator
              </CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-400">
                Step {currentStep} of 4: {currentStep === 1 && 'Set Your Fitness Goals'}
                {currentStep === 2 && 'Plan Your Schedule'}
                {currentStep === 3 && 'Choose Equipment'}
                {currentStep === 4 && 'Select Focus Areas'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Step 1: Goals */}
            {currentStep === 1 && (
              <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 rounded-full px-6 py-3 mb-4">
                    <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <span className="text-indigo-700 dark:text-indigo-300 font-medium">Define Your Journey</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">What's Your Primary Goal?</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose the goal that best represents your fitness aspirations</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {fitnessGoalOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange("fitnessGoal", option.value)}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        formData.fitnessGoal === option.value
                          ? 'border-transparent bg-gradient-to-br ' + option.color + ' text-white shadow-2xl'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 bg-white dark:bg-gray-800 hover:shadow-lg'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3">{option.icon}</div>
                        <h4 className="font-semibold text-lg mb-2">{option.label}</h4>
                        {formData.fitnessGoal === option.value && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Schedule */}
            {currentStep === 2 && (
              <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/50 dark:to-blue-900/50 rounded-full px-6 py-3 mb-4">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-300 font-medium">Time Investment</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plan Your Schedule</h3>
                  <p className="text-gray-600 dark:text-gray-400">How much time can you dedicate to your fitness journey?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold text-gray-900 dark:text-white mb-4 block">Days Per Week</Label>
                      <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleInputChange("workoutDaysPerWeek", num)}
                            className={`aspect-square rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                              formData.workoutDaysPerWeek === num
                                ? 'border-transparent bg-gradient-to-br from-green-500 to-blue-500 text-white shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center h-full">
                              <span className="text-2xl font-bold">{num}</span>
                              <span className="text-xs">{num === 1 ? 'day' : 'days'}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Label className="text-lg font-semibold text-gray-900 dark:text-white mb-4 block">Session Duration</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {[15, 30, 45, 60, 75, 90].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleInputChange("workoutDuration", num)}
                            className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                              formData.workoutDuration === num
                                ? 'border-transparent bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
                                : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            <div className="text-center">
                              <div className="text-xl font-bold">{num}</div>
                              <div className="text-sm">minutes</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Equipment */}
            {currentStep === 3 && (
              <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 rounded-full px-6 py-3 mb-4">
                    <Dumbbell className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <span className="text-orange-700 dark:text-orange-300 font-medium">Your Arsenal</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Available Equipment</h3>
                  <p className="text-gray-600 dark:text-gray-400">Select all equipment you have access to</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <Label className="text-lg font-semibold text-gray-900 dark:text-white">Popular Choices</Label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {equipmentOptions.filter(option => option.popular).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleEquipmentChange(option.id, !formData.equipment.includes(option.id))}
                          className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                            formData.equipment.includes(option.id)
                              ? 'border-transparent bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-2xl'
                              : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 bg-white dark:bg-gray-800 hover:shadow-lg'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-3">{option.icon}</div>
                            <h4 className="font-medium text-sm">{option.label}</h4>
                            {formData.equipment.includes(option.id) && (
                              <div className="absolute top-3 right-3">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-lg font-semibold text-gray-900 dark:text-white mb-4 block">All Equipment</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {equipmentOptions.filter(option => !option.popular).map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleEquipmentChange(option.id, !formData.equipment.includes(option.id))}
                          className={`p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                            formData.equipment.includes(option.id)
                              ? 'border-transparent bg-gradient-to-br from-gray-600 to-gray-700 text-white shadow-lg'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-2xl mb-2">{option.icon}</div>
                            <div className="text-xs font-medium">{option.label}</div>
                            {formData.equipment.includes(option.id) && (
                              <CheckCircle className="h-4 w-4 text-white mt-2 mx-auto" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Focus Areas */}
            {currentStep === 4 && (
              <div className="space-y-8 animate-in fade-in-0 slide-in-from-right-5 duration-500">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-full px-6 py-3 mb-4">
                    <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <span className="text-purple-700 dark:text-purple-300 font-medium">Target Areas</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Focus Areas</h3>
                  <p className="text-gray-600 dark:text-gray-400">Which muscle groups do you want to prioritize?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  {focusAreaOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleFocusAreaChange(option.id, !formData.fitnessFocus.includes(option.id))}
                      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 hover:scale-105 ${
                        formData.fitnessFocus.includes(option.id)
                          ? `border-transparent bg-gradient-to-br ${option.gradient} text-white shadow-2xl`
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 bg-white dark:bg-gray-800 hover:shadow-lg'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-3">{option.icon}</div>
                        <h4 className="font-medium text-sm">{option.label}</h4>
                        {formData.fitnessFocus.includes(option.id) && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="space-y-6">
                  <div>
                    <Label htmlFor="specificGoals" className="text-lg font-semibold text-gray-900 dark:text-white mb-3 block">
                      <div className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5 text-yellow-500" />
                        <span>Specific Goals (Optional)</span>
                      </div>
                    </Label>
                    <Textarea
                      id="specificGoals"
                      placeholder="E.g., I want to be able to do 10 pull-ups, lose 15 pounds, or tone my abs for summer..."
                      value={formData.specificGoals}
                      onChange={(e) => handleInputChange("specificGoals", e.target.value)}
                      className="h-32 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 transition-colors duration-300"
                    />
                  </div>

                  {Object.values(measurements).some((m) => m !== null && m !== measurements.lastMeasuredDate) && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Settings className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <Label htmlFor="includeMeasurements" className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                              Include Body Measurements
                            </Label>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Use your recorded measurements for more precise recommendations
                            </p>
                          </div>
                        </div>
                        <Switch
                          id="includeMeasurements"
                          checked={formData.includeMeasurements}
                          onCheckedChange={(checked) => handleInputChange("includeMeasurements", checked)}
                          className="data-[state=checked]:bg-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 p-8">
          <div className="flex justify-between w-full">
            <Button 
              variant="outline" 
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
              className="px-8 py-3 border-2 hover:scale-105 transition-all duration-300"
              disabled={isLoading}
            >
              {currentStep > 1 ? 'Previous' : 'Cancel'}
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:scale-105 transition-all duration-300"
                disabled={isLoading}
              >
                Next Step
                <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white shadow-2xl hover:scale-105 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span className="animate-pulse">Generating Magic...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate My Workout Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 w-20 h-20 mx-auto bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-ping opacity-25"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Creating Your Perfect Workout</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Our AI is analyzing your preferences and crafting a personalized plan...</p>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIWorkoutForm;