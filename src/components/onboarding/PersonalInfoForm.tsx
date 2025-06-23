
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OnboardingLayout from "./OnboardingLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PersonalInfoForm: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    age: "",
    sex: "",
    height: "",
    weight: ""
  });
  const navigate = useNavigate();  useEffect(() => {
    // Pre-fill form with existing profile data if available
    if (profile) {
      // Calculate age from date_of_birth if available
      let calculatedAge = "";
      if (profile.date_of_birth) {
        const birthDate = new Date(profile.date_of_birth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        calculatedAge = age.toString();
      }
      
      setFormData({
        age: calculatedAge,
        sex: profile.gender || "", // Map 'gender' to 'sex' field
        height: profile.height ? profile.height.toString() : "",
        weight: profile.weight ? profile.weight.toString() : ""
      });
    }
  }, [profile]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {      if (!user) {
        toast.error("You must be logged in to continue");
        return;
      }
      
      console.log("Updating profile for user:", user.id);
      console.log("Form data:", formData);
      
      // Update user profile in database
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          gender: formData.sex, // Map 'sex' to 'gender' field
          height: parseFloat(formData.height),
          weight: parseFloat(formData.weight),
          // Calculate date_of_birth from age if provided
          ...(formData.age && {
            date_of_birth: new Date(new Date().getFullYear() - parseInt(formData.age), 0, 1).toISOString().split('T')[0]
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select();
      
      if (error) {
        console.error("Profile update error:", error);
        throw new Error(`Profile update failed: ${error.message} (Code: ${error.code})`);
      }
      
      console.log("Profile updated successfully:", data);
      
      // Refresh profile data in context
      await refreshProfile();
      
      toast.success("Personal information saved successfully");
      navigate("/onboarding/goals");
    } catch (error: any) {
      console.error("Error saving personal info:", error);
      toast.error(error.message || "Failed to save personal information");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingLayout
      title="Personal Information"
      subtitle="Help us get to know you better"
      step={1}
      totalSteps={2}
    >
      <form onSubmit={handleNext} className="space-y-6">
        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Age
          </label>
          <div className="mt-1">
            <Input
              id="age"
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({...formData, age: e.target.value})}
              className="fitness-input"
              placeholder="Your age"
              min="16"
              max="100"
            />
          </div>
        </div>

        <div>
          <label htmlFor="sex" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sex
          </label>
          <div className="mt-1">
            <Select 
              value={formData.sex} 
              onValueChange={(value) => setFormData({...formData, sex: value})} 
              required
            >
              <SelectTrigger className="fitness-input">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Height (cm)
          </label>
          <div className="mt-1">
            <Input
              id="height"
              type="number"
              required
              value={formData.height}
              onChange={(e) => setFormData({...formData, height: e.target.value})}
              className="fitness-input"
              placeholder="Your height in cm"
              min="100"
              max="250"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Weight (kg)
          </label>
          <div className="mt-1">
            <Input
              id="weight"
              type="number"
              required
              value={formData.weight}
              onChange={(e) => setFormData({...formData, weight: e.target.value})}
              className="fitness-input"
              placeholder="Your weight in kg"
              min="30"
              max="300"
              step="0.1"
            />
          </div>
        </div>

        <div>
          <Button
            type="submit"
            className="w-full fitness-button-primary"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Next"}
            {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default PersonalInfoForm;
