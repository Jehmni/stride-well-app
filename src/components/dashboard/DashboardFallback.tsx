import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

const DashboardFallback: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  
  // Get user's first name for welcome message
  const firstName = profile?.first_name || "there";

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard (Simplified View)
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Welcome back, {firstName}!
        </p>
      </header>

      <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center text-yellow-800">
            <RefreshCw className="h-5 w-5 mr-2 text-yellow-700" />
            Limited Functionality Mode
          </CardTitle>
          <CardDescription className="text-yellow-700">
            You're viewing a simplified dashboard due to a resource loading issue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700 mb-4">
            Some advanced features might be unavailable. You can try refreshing the page or navigate to other sections.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleRefresh} className="bg-yellow-600 hover:bg-yellow-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Dashboard
            </Button>
            <Button variant="outline" className="border-yellow-600 text-yellow-700" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Home
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Navigation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate('/workouts')}
              >
                <Home className="h-4 w-4 mr-2" />
                Workouts
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate('/progress')}
              >
                <Home className="h-4 w-4 mr-2" />
                Progress
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate('/meal-plan')}
              >
                <Home className="h-4 w-4 mr-2" />
                Meal Plan
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start text-left"
                onClick={() => navigate('/profile')}
              >
                <Home className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardFallback; 