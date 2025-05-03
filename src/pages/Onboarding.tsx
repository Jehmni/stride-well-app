
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PersonalInfoForm from "@/components/onboarding/PersonalInfoForm";
import FitnessGoalsForm from "@/components/onboarding/FitnessGoalsForm";

const Onboarding: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route index element={<PersonalInfoForm />} />
        <Route path="goals" element={<FitnessGoalsForm />} />
        <Route path="*" element={<Navigate to="/onboarding" />} />
      </Routes>
    </div>
  );
};

export default Onboarding;
