import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AIWorkoutList from '@/components/workout/AIWorkoutList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DbFixesNotice from '@/components/common/DbFixesNotice';

const AIWorkoutsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  if (!user) {
    return (
      <DashboardLayout title="AI Workouts">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please sign in to view your AI-generated workouts.</p>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50 dark:from-slate-950 dark:via-blue-950/30 dark:to-indigo-950">
          <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-32 right-0 w-96 h-96 bg-gradient-to-r from-indigo-400/15 to-cyan-400/15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-gradient-to-r from-violet-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="container max-w-6xl mx-auto py-8 relative z-10">
          <DbFixesNotice userId={userId || undefined} />
          
          {/* Hero Section */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200/50 dark:border-blue-700/50 mb-6 animate-fadeIn">
              <Brain className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400 animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI-Powered Fitness Intelligence</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 bg-clip-text text-transparent animate-slideUp">
              AI Workout Plans
            </h1>
            
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed animate-slideUp" style={{animationDelay: '0.1s'}}>
              Experience the future of fitness with personalized workout plans crafted by advanced AI. 
              Each plan adapts to your unique goals, preferences, and progress.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-3 mt-8 animate-slideUp" style={{animationDelay: '0.2s'}}>
              {[
                { icon: "🧠", text: "Smart Adaptation" },
                { icon: "📊", text: "Progress Tracking" },
                { icon: "🎯", text: "Goal-Focused" },
                { icon: "⚡", text: "Real-time Adjustments" }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center px-4 py-2 rounded-full bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-slate-800/90 transition-all duration-300 hover:scale-105"
                >
                  <span className="mr-2">{feature.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workout Plans Section */}
          <div className="animate-slideUp" style={{animationDelay: '0.3s'}}>
            {userId && <AIWorkoutList userId={userId} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIWorkoutsPage; 