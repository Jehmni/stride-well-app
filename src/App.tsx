
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/progress" 
            element={
              <ProtectedRoute requiresOnboarding={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute requiresOnboarding={true}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
