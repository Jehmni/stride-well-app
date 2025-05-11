import React, { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import AIWorkoutList from '@/components/workout/AIWorkoutList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import DbFixesNotice from '@/components/common/DbFixesNotice';

const AIWorkoutsPage = () => {
  const user = useUser();
  const supabase = useSupabaseClient();
  const [userId, setUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  if (!user) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Please sign in to view your AI-generated workouts.</p>
            <Button asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-5xl mx-auto py-6">
        <DbFixesNotice userId={userId || undefined} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Brain className="h-7 w-7 mr-2 text-blue-500" />
            AI Workout Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            View and manage your personalized AI-generated workout plans.
          </p>
        </div>

        {userId && <AIWorkoutList userId={userId} />}
      </div>
    </DashboardLayout>
  );
};

export default AIWorkoutsPage; 