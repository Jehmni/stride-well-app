
import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { seedGroceryStores } from "@/utils/seedStoreData";

// Lazy load page components
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const WorkoutPlan = lazy(() => import("./pages/WorkoutPlan"));
const MealPlan = lazy(() => import("./pages/MealPlan"));
const Progress = lazy(() => import("./pages/Progress"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Friends = lazy(() => import("./pages/Friends"));
const Challenges = lazy(() => import("./pages/Challenges"));

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Seed store data on app initialization
    seedGroceryStores();
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route 
                  path="/login" 
                  element={
                    <ProtectedRoute requiresAuth={false}>
                      <Login />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/signup" 
                  element={
                    <ProtectedRoute requiresAuth={false}>
                      <Signup />
                    </ProtectedRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route 
                  path="/onboarding/*" 
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/workouts" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <WorkoutPlan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/meal-plan" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <MealPlan />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/progress" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Progress />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />
                
                {/* New social routes */}
                <Route 
                  path="/friends/*" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Friends />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/challenges/*" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Challenges />
                    </ProtectedRoute>
                  } 
                />

                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
