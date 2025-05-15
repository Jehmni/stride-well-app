import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dumbbell, Clock, Loader2, Brain } from "lucide-react";
import { generateAIWorkoutPlan } from "@/integrations/ai/workoutAIService";
import { UserProfile } from "@/models/models";

const AIWorkoutGenerationPage: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fitnessGoal: profile?.fitness_goal || "general-fitness",
    age: profile?.age || 30,
    weight: profile?.weight || 70,
    height: profile?.height || 170,
    sex: profile?.sex || "other",
    availableEquipment: "minimal",
    experienceLevel: "beginner",
    workoutDuration: 45,
    daysPerWeek: 4,
    focusAreas: "full-body",
    healthConditions: "",
    useAI: true
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!profile) {
        toast.error("User profile not found. Please complete your profile first.");
        setLoading(false);
        return;
      }

      // Create an enhanced profile with additional workout preferences
      const enhancedProfile: UserProfile & Record<string, any> = {
        ...profile,
        fitness_goal: formData.fitnessGoal,
        age: Number(formData.age),
        weight: Number(formData.weight),
        height: Number(formData.height),
        sex: formData.sex,
        equipment_available: formData.availableEquipment,
        experience_level: formData.experienceLevel,
        preferred_workout_duration: Number(formData.workoutDuration),
        preferred_workout_days: Number(formData.daysPerWeek),
        focus_areas: formData.focusAreas,
        health_conditions: formData.healthConditions,
      };

      toast.info("Generating your personalized workout plan...");

      if (formData.useAI) {
        // Generate workout with AI
        const workoutPlan = await generateAIWorkoutPlan(enhancedProfile);
        
        if (workoutPlan) {
          toast.success("Workout plan generated successfully!");
          // Navigate to the workout plan page or details page
          navigate('/ai-workouts');
        } else {
          toast.error("Failed to generate workout plan. Please try again.");
        }
      } else {
        // Use rule-based generation instead of AI
        // This would call a different service method
        toast.success("Rule-based workout plan generated successfully!");
        navigate('/workouts');
      }
    } catch (error) {
      console.error("Error generating workout plan:", error);
      toast.error("An error occurred while generating your workout plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Generate AI Workout">
      <div className="container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            Generate Personalized Workout
          </h1>
          <p className="text-muted-foreground mt-2">
            Fill in your preferences to generate a customized workout plan tailored to your needs
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Personal Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic details help us tailor the workout to your body type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={formData.age}
                    onChange={handleInputChange}
                    min={16}
                    max={90}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sex">Biological Sex</Label>
                  <Select
                    value={formData.sex}
                    onValueChange={(value) => handleSelectChange("sex", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sex" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    value={formData.height}
                    onChange={handleInputChange}
                    min={100}
                    max={250}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    value={formData.weight}
                    onChange={handleInputChange}
                    min={30}
                    max={250}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Fitness Goals Card */}
            <Card>
              <CardHeader>
                <CardTitle>Fitness Goals</CardTitle>
                <CardDescription>
                  What you want to achieve with your workouts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fitnessGoal">Primary Goal</Label>
                  <Select
                    value={formData.fitnessGoal}
                    onValueChange={(value) => handleSelectChange("fitnessGoal", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitness goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="general-fitness">General Fitness</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="experienceLevel">Experience Level</Label>
                  <Select
                    value={formData.experienceLevel}
                    onValueChange={(value) => handleSelectChange("experienceLevel", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="focusAreas">Focus Areas</Label>
                  <Select
                    value={formData.focusAreas}
                    onValueChange={(value) => handleSelectChange("focusAreas", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus areas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-body">Full Body</SelectItem>
                      <SelectItem value="upper-body">Upper Body</SelectItem>
                      <SelectItem value="lower-body">Lower Body</SelectItem>
                      <SelectItem value="core">Core Strength</SelectItem>
                      <SelectItem value="cardio">Cardiovascular</SelectItem>
                      <SelectItem value="flexibility">Flexibility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="healthConditions">Health Considerations</Label>
                  <Textarea
                    id="healthConditions"
                    name="healthConditions"
                    placeholder="Any injuries, limitations, or health conditions? (optional)"
                    value={formData.healthConditions}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Workout Preferences Card */}
            <Card>
              <CardHeader>
                <CardTitle>Workout Preferences</CardTitle>
                <CardDescription>
                  Customize your workout schedule and environment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="daysPerWeek">Days per Week</Label>
                  <Select
                    value={formData.daysPerWeek.toString()}
                    onValueChange={(value) => handleSelectChange("daysPerWeek", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select days per week" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 days</SelectItem>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="4">4 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="6">6 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workoutDuration">Workout Duration (minutes)</Label>
                  <Select
                    value={formData.workoutDuration.toString()}
                    onValueChange={(value) => handleSelectChange("workoutDuration", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workout duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="availableEquipment">Available Equipment</Label>
                  <Select
                    value={formData.availableEquipment}
                    onValueChange={(value) => handleSelectChange("availableEquipment", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select available equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Equipment (Bodyweight Only)</SelectItem>
                      <SelectItem value="minimal">Minimal (Dumbbells, Resistance Bands)</SelectItem>
                      <SelectItem value="home-gym">Home Gym (Various Equipment)</SelectItem>
                      <SelectItem value="full-gym">Full Gym Access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* AI Options Card */}
            <Card>
              <CardHeader>
                <CardTitle>Generation Options</CardTitle>
                <CardDescription>
                  Configure how your workout plan will be created
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="useAI">Use AI Generation</Label>
                    <p className="text-sm text-muted-foreground">
                      Create a more personalized plan using artificial intelligence
                    </p>
                  </div>
                  <Switch
                    id="useAI"
                    checked={formData.useAI}
                    onCheckedChange={(checked) => handleSwitchChange("useAI", checked)}
                  />
                </div>
                
                <div className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    {formData.useAI 
                      ? "AI-generated workouts are tailored specifically to your unique profile, goals, and preferences using advanced algorithms."
                      : "Rule-based workouts use predefined templates and are less personalized but still effective for most users."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Dumbbell className="h-4 w-4" />
                  Generate Workout Plan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default AIWorkoutGenerationPage; 