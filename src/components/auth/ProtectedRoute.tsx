
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: JSX.Element;
  requiresAuth?: boolean;
  requiresOnboarding?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requiresAuth = true,
  requiresOnboarding = false 
}: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If authentication is required and user is not authenticated
  if (requiresAuth && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} />;
  }
  
  // If user is authenticated but not onboarded and the route requires onboarding
  if (user && !profile && requiresOnboarding) {
    return <Navigate to="/onboarding" />;
  }
  
  // If user is authenticated and trying to access auth pages
  if (user && !requiresAuth) {
    // Always redirect to dashboard after login if user is onboarded
    if (profile) {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/onboarding" />;
    }
  }

  return children;
};

export default ProtectedRoute;
