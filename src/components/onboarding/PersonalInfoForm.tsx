
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OnboardingLayout from "./OnboardingLayout";

const PersonalInfoForm: React.FC = () => {
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const navigate = useNavigate();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage for demo purposes
    localStorage.setItem("userProfile", JSON.stringify({
      age,
      sex,
      height,
      weight
    }));
    
    navigate("/onboarding/goals");
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
              value={age}
              onChange={(e) => setAge(e.target.value)}
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
            <Select value={sex} onValueChange={setSex} required>
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
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="fitness-input"
              placeholder="Your height in cm"
              min="100"
              max="250"
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
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
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
          >
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </form>
    </OnboardingLayout>
  );
};

export default PersonalInfoForm;
