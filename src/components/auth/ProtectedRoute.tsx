
import { Navigate } from "react-router-dom";

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
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";
  const isOnboarded = localStorage.getItem("isOnboarded") === "true";
  
  // If authentication is required and user is not authenticated
  if (requiresAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If user is authenticated but not onboarded and the route requires onboarding
  if (isAuthenticated && !isOnboarded && requiresOnboarding) {
    return <Navigate to="/onboarding" />;
  }
  
  // If user is authenticated and trying to access auth pages
  if (isAuthenticated && !requiresAuth) {
    // If user is onboarded, go to dashboard, otherwise to onboarding
    if (isOnboarded) {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/onboarding" />;
    }
  }

  return children;
};

export default ProtectedRoute;
