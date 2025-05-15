import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Brain, Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getAIConfig } from "@/integrations/supabase/aiConfig";
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
  { value: "weight-loss", label: "Weight Loss" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "general-fitness", label: "General Fitness" },
  { value: "endurance", label: "Endurance" },
  { value: "strength", label: "Strength" },
  { value: "flexibility", label: "Flexibility" },
];

const equipmentOptions = [
  { id: "none", label: "None / Bodyweight Only" },
  { id: "dumbbells", label: "Dumbbells" },
  { id: "barbells", label: "Barbells" },
  { id: "kettlebells", label: "Kettlebells" },
  { id: "resistance-bands", label: "Resistance Bands" },
  { id: "trx", label: "TRX / Suspension Trainer" },
  { id: "gym-machines", label: "Gym Machines" },
  { id: "pull-up-bar", label: "Pull-up Bar" },
  { id: "bench", label: "Bench" },
  { id: "box", label: "Plyo Box" },
];

const focusAreaOptions = [
  { id: "upper-body", label: "Upper Body" },
  { id: "lower-body", label: "Lower Body" },
  { id: "core", label: "Core/Abs" },
  { id: "back", label: "Back" },
  { id: "chest", label: "Chest" },
  { id: "arms", label: "Arms" },
  { id: "shoulders", label: "Shoulders" },
  { id: "legs", label: "Legs" },
  { id: "glutes", label: "Glutes" },
  { id: "cardio", label: "Cardiovascular" },
];

const EnhancedAIWorkoutForm: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
          lastMeasuredDate: latestMeasurement.recorded_at,
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
    if (!user || !profile) {
      toast.error("You must be logged in to generate a workout");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get OpenAI configuration
      const aiConfig = await getAIConfig("openai");
      if (!aiConfig || !aiConfig.api_key || !aiConfig.is_enabled) {
        toast.error("AI workout generation is not configured");
        return;
      }

      // 2. Create prompt with all user data
      const prompt = createEnhancedPrompt(profile, formData, measurements);

      // 3. Call OpenAI API
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
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        toast.error("Failed to generate AI workout");
        return;
      }

      // 4. Parse response and save to database
      const data = await response.json();
      const workoutPlan = JSON.parse(data.choices[0].message.content);
      
      const { data: savedWorkout, error } = await supabase
        .from("workout_plans")
        .insert({
          title: workoutPlan.title,
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
        throw error;
      }

      toast.success("AI workout generated successfully!");
      navigate(`/workout-plan/${savedWorkout.id}`);
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
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" /> Enhanced AI Workout Generator
        </CardTitle>
        <CardDescription>
          Generate a personalized workout plan with our AI trainer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="fitnessGoal">Primary Fitness Goal</Label>
              <Select
                value={formData.fitnessGoal}
                onValueChange={(value) => handleInputChange("fitnessGoal", value)}
              >
                <SelectTrigger id="fitnessGoal">
                  <SelectValue placeholder="Select your main goal" />
                </SelectTrigger>
                <SelectContent>
                  {fitnessGoalOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workoutDaysPerWeek">Days Per Week</Label>
                <Select
                  value={formData.workoutDaysPerWeek.toString()}
                  onValueChange={(value) =>
                    handleInputChange("workoutDaysPerWeek", parseInt(value))
                  }
                >
                  <SelectTrigger id="workoutDaysPerWeek">
                    <SelectValue placeholder="Select days per week" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? "day" : "days"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="workoutDuration">
                  Workout Duration (minutes)
                </Label>
                <Select
                  value={formData.workoutDuration.toString()}
                  onValueChange={(value) =>
                    handleInputChange("workoutDuration", parseInt(value))
                  }
                >
                  <SelectTrigger id="workoutDuration">
                    <SelectValue placeholder="Select workout duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {[15, 30, 45, 60, 75, 90].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} minutes
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Available Equipment</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {equipmentOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equipment-${option.id}`}
                      checked={formData.equipment.includes(option.id)}
                      onCheckedChange={(checked) =>
                        handleEquipmentChange(option.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`equipment-${option.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Focus Areas</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {focusAreaOptions.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${option.id}`}
                      checked={formData.fitnessFocus.includes(option.id)}
                      onCheckedChange={(checked) =>
                        handleFocusAreaChange(option.id, checked === true)
                      }
                    />
                    <label
                      htmlFor={`focus-${option.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="specificGoals">Specific Goals (Optional)</Label>
              <Textarea
                id="specificGoals"
                placeholder="E.g., I want to be able to do 10 pull-ups, or I want to tone my abs"
                value={formData.specificGoals}
                onChange={(e) =>
                  handleInputChange("specificGoals", e.target.value)
                }
                className="h-24"
              />
            </div>

            {Object.values(measurements).some(
              (m) => m !== null && m !== measurements.lastMeasuredDate
            ) && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="includeMeasurements"
                  checked={formData.includeMeasurements}
                  onCheckedChange={(checked) =>
                    handleInputChange("includeMeasurements", checked)
                  }
                />
                <Label htmlFor="includeMeasurements">
                  Include my body measurements in the workout plan
                </Label>
              </div>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Generate Workout Plan
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default EnhancedAIWorkoutForm; 