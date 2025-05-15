import React, { Suspense, lazy, useEffect, useState } from "react";
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
import { preloadModule } from "@/utils/modulePreload";
import NetworkErrorHandler from "./components/common/NetworkErrorHandler";

// Import Index directly to avoid lazy loading issues
import Index from "./pages/Index";
// Import Dashboard directly but also with dynamic loading fallback
// This approach ensures the component works in both development and production environments
import DashboardComponent from "./pages/Dashboard";
import DashboardFallback from "./components/dashboard/DashboardFallback";

// Create a wrapped Dashboard component with error handling
const Dashboard = () => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check if a previous error was stored (for refreshes)
    const storedError = sessionStorage.getItem('dashboard_load_error');
    if (storedError) {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    // Listen for errors that might indicate Dashboard loading issues
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Dashboard-') && event.message.includes('Failed to fetch')) {
        console.error('Dashboard loading error detected:', event);
        setHasError(true);
        sessionStorage.setItem('dashboard_load_error', 'true');
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // If there was an error, use the fallback component
  if (hasError) {
    return <DashboardFallback />;
  }

  // Otherwise use the real Dashboard component
  return <DashboardComponent />;
};

// Lazy load other page components with preloading
const Login = preloadModule(() => import("./pages/Login"));
const Signup = preloadModule(() => import("./pages/Signup"));
const Onboarding = preloadModule(() => import("./pages/Onboarding"));
const WorkoutPlan = preloadModule(() => import("./pages/WorkoutPlan"));
const MealPlan = preloadModule(() => import("./pages/MealPlan"));
const Progress = preloadModule(() => import("./pages/Progress"));
const Profile = preloadModule(() => import("./pages/Profile"));
const NotFound = preloadModule(() => import("./pages/NotFound"));
const Friends = preloadModule(() => import("./pages/Friends"));
const Challenges = preloadModule(() => import("./pages/Challenges"));
const AIWorkoutsPage = preloadModule(() => import("./pages/ai/AIWorkoutsPage"));
const AIWorkoutDetail = preloadModule(() => import("./pages/ai/AIWorkoutDetailPage"));
const AIWorkoutGeneration = preloadModule(() => import("./pages/ai/AIWorkoutGenerationPage"));
const Reminders = preloadModule(() => import("./pages/Reminders"));

// Simple error boundary for catching chunk loading errors
class ChunkErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("Chunk loading error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Something went wrong loading the page</h2>
          <p className="mb-4">We're having trouble loading this page. Please try refreshing.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-fitness-primary text-white rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

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
    <NetworkErrorHandler>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ChunkErrorBoundary>
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
            </ChunkErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </NetworkErrorHandler>
  </QueryClientProvider>
);
}

export default App;
