
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PersonalInfoForm from "@/components/onboarding/PersonalInfoForm";
import FitnessGoalsForm from "@/components/onboarding/FitnessGoalsForm";

const Onboarding: React.FC = () => {
  return (
    <Routes>
      <Route index element={<PersonalInfoForm />} />
      <Route path="/goals" element={<FitnessGoalsForm />} />
      <Route path="*" element={<Navigate to="/onboarding" />} />
    </Routes>
  );
};

export default Onboarding;
