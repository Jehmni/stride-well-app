import React, { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotificationManager from "@/components/ui/NotificationManager";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import LoadingSpinner from "./components/ui/LoadingSpinner";
import ErrorBoundary, { withErrorBoundary } from "./components/common/ErrorBoundary";
import { seedGroceryStores } from "./utils/seedStoreData";
import { seedExerciseData } from "./utils/seedExerciseData";
import { registerReminderServiceWorker } from "./services/notificationService";
import { register as registerServiceWorker } from "./services/serviceWorkerRegistration";
import { syncAllWorkouts } from "./services/offlineStorageService";
import { supabase } from "@/integrations/supabase/client";
import { preloadModule } from "@/utils/modulePreload";
import { ROUTES, API_CONFIG } from "@/lib/constants";

// Import Index directly to avoid lazy loading issues
import Index from "./pages/Index";
// Import Dashboard directly but also with dynamic loading fallback
import DashboardComponent from "./pages/Dashboard";
import DashboardFallback from "./components/dashboard/DashboardFallback";

// Create a wrapped Dashboard component with error handling
const Dashboard = withErrorBoundary(() => {
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
}, {
  level: 'page',
  onError: (error, errorInfo) => {
    console.error('Dashboard component error:', error, errorInfo);
    sessionStorage.setItem('dashboard_load_error', 'true');
  }
});

// Lazy load other page components with preloading and error boundaries
const Login = withErrorBoundary(preloadModule(() => import("./pages/Login")), { level: 'page' });
const Signup = withErrorBoundary(preloadModule(() => import("./pages/Signup")), { level: 'page' });
const Onboarding = withErrorBoundary(preloadModule(() => import("./pages/Onboarding")), { level: 'page' });
const WorkoutPlan = withErrorBoundary(preloadModule(() => import("./pages/WorkoutPlan")), { level: 'page' });
const WorkoutSession = withErrorBoundary(preloadModule(() => import("./pages/WorkoutSession")), { level: 'page' });
const MealPlan = withErrorBoundary(preloadModule(() => import("./pages/MealPlan")), { level: 'page' });
const Progress = withErrorBoundary(preloadModule(() => import("./pages/Progress")), { level: 'page' });
const Profile = withErrorBoundary(preloadModule(() => import("./pages/Profile")), { level: 'page' });
const NotFound = withErrorBoundary(preloadModule(() => import("./pages/NotFound")), { level: 'page' });
const Friends = withErrorBoundary(preloadModule(() => import("./pages/Friends")), { level: 'page' });
const Challenges = withErrorBoundary(preloadModule(() => import("./pages/Challenges")), { level: 'page' });
const AIWorkoutsPage = withErrorBoundary(preloadModule(() => import("./pages/ai/AIWorkoutsPage")), { level: 'page' });
const AIWorkoutDetail = withErrorBoundary(preloadModule(() => import("./pages/ai/AIWorkoutDetailPage")), { level: 'page' });
const AIWorkoutGeneration = withErrorBoundary(preloadModule(() => import("./pages/ai/AIWorkoutGenerationPage")), { level: 'page' });
const CreateAIWorkout = withErrorBoundary(preloadModule(() => import("./pages/CreateAIWorkout")), { level: 'page' });
const Reminders = withErrorBoundary(preloadModule(() => import("./pages/Reminders")), { level: 'page' });
const EnhancedRemindersDemo = withErrorBoundary(preloadModule(() => import("./pages/EnhancedRemindersDemo")), { level: 'page' });

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

// Enhanced QueryClient configuration with proper error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 60 * 60 * 1000, // 1 hour cache garbage collection
      retry: (failureCount, error: any) => {
        // Don't retry on auth errors
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      onError: (error: any) => {
        console.error('Mutation error:', error);
        // Could add global error handling here
      },
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      console.error('Query cache error:', error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      console.error('Mutation cache error:', error);
    },
  }),
});

function App() {
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        // Seed exercise data on app initialization (doesn't require auth)
        seedExerciseData();
        
        // Register the notification and service worker
        await Promise.all([
          registerReminderServiceWorker(),
          registerServiceWorker()
        ]);
        
        // Check authentication status using supabase directly
        const { data } = await supabase.auth.getSession();
        
        // Only seed grocery store data and sync workouts if authenticated
        if (data.session?.user) {
          // Seed store data (requires authentication)
          seedGroceryStores();
          
          // Sync offline workouts on app startup if online
          if (navigator.onLine) {
            try {
              const count = await syncAllWorkouts();
              if (count > 0) {
                console.log(`Synced ${count} workouts on app startup`);
              }
            } catch (syncError) {
              console.warn('Failed to sync workouts on startup:', syncError);
              // Don't fail app initialization for sync errors
            }
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize app');
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, []);

  // Show loading during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 mt-4">Initializing Stride Well...</p>
        </div>
      </div>
    );
  }

  // Show initialization error if critical
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center p-6 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Initialization Error</h1>
          <p className="text-red-500 mb-4">{initError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
            <ChunkErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                {/* Global Notification Manager */}
                <NotificationManager position="top-right" maxNotifications={5} />
                
                <Routes>
                  {/* Public Routes - Index is not lazy loaded */}
                  <Route path={ROUTES.HOME} element={<Index />} />
                  
                  {/* Other Public Routes */}
                  <Route 
                    path={ROUTES.LOGIN} 
                    element={
                      <ProtectedRoute requiresAuth={false}>
                        <Login />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.SIGNUP} 
                    element={
                      <ProtectedRoute requiresAuth={false}>
                        <Signup />
                      </ProtectedRoute>
                    } 
                  />

                  {/* Protected Routes */}
                  <Route 
                    path={`${ROUTES.ONBOARDING}/*`} 
                    element={
                      <ProtectedRoute requiresOnboarding={false}>
                        <Onboarding />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.DASHBOARD} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.CREATE_AI_WORKOUT} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <CreateAIWorkout />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.WORKOUTS} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <WorkoutPlan />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={`${ROUTES.WORKOUT_SESSION}/:workoutId`} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <WorkoutSession />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={`${ROUTES.WORKOUTS}/ai/:id`} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <AIWorkoutDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.AI_WORKOUTS} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <AIWorkoutsPage />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.AI_WORKOUT_GENERATION} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <AIWorkoutGeneration />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={`${ROUTES.AI_WORKOUTS}/:id`} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <AIWorkoutDetail />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.MEAL_PLAN} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <MealPlan />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.PROGRESS} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <Progress />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.PROFILE} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={ROUTES.REMINDERS} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <Reminders />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/enhanced-reminders-demo" 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <EnhancedRemindersDemo />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={`${ROUTES.FRIENDS}/*`} 
                    element={
                      <ProtectedRoute requiresOnboarding={true}>
                        <Friends />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path={`${ROUTES.CHALLENGES}/*`} 
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
      </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
