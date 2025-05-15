import React, { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import { seedGroceryStores } from "./utils/seedStoreData";
import { seedExerciseData } from "./utils/seedExerciseData";
import { registerReminderServiceWorker } from "./services/notificationService";
import { register as registerServiceWorker } from "./services/serviceWorkerRegistration";
import { syncAllWorkouts } from "./services/offlineStorageService";
import { supabase } from "@/integrations/supabase/client";

// Import Index directly to avoid lazy loading issues
import Index from "./pages/Index";

// Lazy load other page components
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
const AIWorkoutsPage = lazy(() => import("./pages/ai/AIWorkoutsPage"));
const AIWorkoutDetail = lazy(() => import("./pages/ai/AIWorkoutDetailPage"));
const AIWorkoutGeneration = lazy(() => import("./pages/ai/AIWorkoutGenerationPage"));
const Reminders = lazy(() => import("./pages/Reminders"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {  
  React.useEffect(() => {
    // Seed exercise data on app initialization (doesn't require auth)
    seedExerciseData();
    
    // Register the notification and service worker
    registerReminderServiceWorker();
    registerServiceWorker();
    
    // Check authentication status using supabase directly
    const checkAuthAndSeed = async () => {
      const { data } = await supabase.auth.getSession();
      
      // Only seed grocery store data and sync workouts if authenticated
      if (data.session?.user) {
        // Seed store data (requires authentication)
        seedGroceryStores();
        
        // Sync offline workouts on app startup if online
        if (navigator.onLine) {
          syncAllWorkouts().then(count => {
            if (count > 0) {
              console.log(`Synced ${count} workouts on app startup`);
            }
          });
        }
      }
    };
    
    checkAuthAndSeed();
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
                {/* Public Routes - Index is not lazy loaded */}
            <Route path="/" element={<Index />} />
                
                {/* Other Public Routes */}
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
                  path="/workouts/ai/:id" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <AIWorkoutDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-workouts" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <AIWorkoutsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-workouts/generate" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <AIWorkoutGeneration />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ai-workouts/:id" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <AIWorkoutDetail />
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
                
                {/* New reminders route */}
                <Route 
                  path="/reminders" 
                  element={
                    <ProtectedRoute requiresOnboarding={true}>
                      <Reminders />
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
