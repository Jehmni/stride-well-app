import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import EnhancedAIWorkoutForm from "@/components/ai/EnhancedAIWorkoutForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Brain, Sparkles, Zap, Target } from "lucide-react";

const CreateAIWorkout: React.FC = () => {
  const { user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardLayout title="Create AI Workout Plan">
      {/* Enhanced Hero Section */}
      <div className="relative overflow-hidden mb-8 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9Im5vbmUiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI0MCIgZmlsbD0iIzAwMCIgZmlsbC1vcGFjaXR5PSIwLjA1Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2EpIi8+PC9zdmc+')] opacity-30"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-6 left-6 w-12 h-12 bg-white/10 rounded-full backdrop-blur-sm animate-pulse"></div>
        <div className="absolute top-12 right-12 w-6 h-6 bg-white/20 rounded-full backdrop-blur-sm animate-bounce"></div>
        <div className="absolute bottom-8 left-12 w-8 h-8 bg-white/15 rounded-full backdrop-blur-sm animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 text-center text-white">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-150 animate-pulse"></div>
              <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-4 border border-white/20">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            AI Workout Generator
          </h1>
          
          <p className="text-xl lg:text-2xl mb-6 text-white/90 font-light max-w-2xl mx-auto leading-relaxed">
            Unlock your potential with personalized fitness plans powered by advanced AI
          </p>
          
          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium text-white">AI-Powered</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Target className="h-4 w-4 text-green-300" />
              <span className="text-sm font-medium text-white">Goal-Focused</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Zap className="h-4 w-4 text-orange-300" />
              <span className="text-sm font-medium text-white">Adaptive</span>
            </div>
          </div>
          
          <div className="text-white/70 text-sm">
            Join thousands who've transformed their fitness journey with AI
          </div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>

      <EnhancedAIWorkoutForm />
    </DashboardLayout>
  );
};

export default CreateAIWorkout; 