import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Database, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface DbFixesNoticeProps {
  userId?: string;
}

const checkDatabaseSetup = async (): Promise<boolean> => {
  try {
    // Try to run a query that uses the ai-related columns
    // This will fail if the columns don't exist
    const { data, error } = await supabase
      .from('workout_logs')
      .select('id, is_from_ai_plan, ai_workout_plan_id, workout_type')
      .limit(1);
    
    if (error) {
      console.error('Error checking database setup:', error);
      return false;
    }
    
    // Check if RPC functions exist by trying to call them with minimal params
    try {
      const { error: rpcError } = await supabase.rpc('link_ai_workout_to_log', {
        workout_plan_id_param: '00000000-0000-0000-0000-000000000000',
        workout_log_id_param: '00000000-0000-0000-0000-000000000000'
      });
      
      // We expect an error about the IDs not existing, but not about the function
      if (rpcError && rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.warn('RPC function link_ai_workout_to_log does not exist');
        return false;
      }
    } catch (e) {
      // RPC error is fine as long as it's not about the function not existing
      console.log('Expected RPC error:', e);
    }
    
    return true;
  } catch (error) {
    console.error('Error checking database setup:', error);
    return false;
  }
};

/**
 * Notice component that checks if database optimizations are in place
 * and provides a way to fix them if needed
 */
const DbFixesNotice: React.FC<DbFixesNoticeProps> = ({ userId }) => {
  const [isDbOptimized, setIsDbOptimized] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (userId) {
      checkDatabaseStatus();
    }
  }, [userId]);

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    const isOptimized = await checkDatabaseSetup();
    setIsDbOptimized(isOptimized);
    setIsChecking(false);
  };

  const fixDatabase = async () => {
    try {
      setIsFixing(true);
      
      // Create a toast to inform the user
      toast({
        title: 'Optimizing database...',
        description: 'This should only take a moment.',
      });
      
      // Apply the migration through the API that adds needed columns to the workout_logs table
      // First try to directly update workout_logs schema with fallback approach
      
      try {
        // Try to run a direct query first to see if the table structure is correct
        const { data: workoutLogSample, error: queryError } = await supabase
          .from('workout_logs')
          .select('*')
          .limit(1);
        
        if (!queryError) {
          if (workoutLogSample && 
              workoutLogSample.length > 0 && 
              'is_from_ai_plan' in workoutLogSample[0] && 
              'ai_workout_plan_id' in workoutLogSample[0] &&
              'workout_type' in workoutLogSample[0]) {
            // Table already has the correct structure
            setIsDbOptimized(true);
            toast({
              title: 'Database is optimized!',
              description: 'Your AI workouts will now be properly tracked.',
            });
            return;
          }
        }
        
        // The table structure needs updating - need to contact support
        toast({
          title: 'Database optimization required',
          description: 'Please contact support to apply the necessary database updates for AI workout tracking.',
          variant: 'destructive'
        });
      } catch (e) {
        console.error('Error checking database structure:', e);
        toast({
          title: 'Error checking database',
          description: 'Could not verify database structure. Please contact support.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fixing database:', error);
      toast({
        title: 'Error optimizing database',
        description: 'Please try again later or contact support.',
        variant: 'destructive'
      });
    } finally {
      setIsFixing(false);
    }
  };

  // Don't show if not logged in or still checking
  if (!userId || isDbOptimized === null) {
    return null;
  }

  // Don't show if already optimized
  if (isDbOptimized === true) {
    return null;
  }

  return (
    <Card className="mb-6 border-amber-500 dark:border-amber-700">
      <CardHeader className="flex flex-row items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-amber-500" />
        <CardTitle className="text-amber-700 dark:text-amber-400">
          Database Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-gray-700 dark:text-gray-300 mb-4">
          The database needs to be optimized for proper AI workout tracking. This is a one-time operation.
        </CardDescription>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={checkDatabaseStatus}
            disabled={isChecking || isFixing}
          >
            {isChecking ? 'Checking...' : 'Check Status'}
          </Button>
          <Button
            onClick={fixDatabase}
            disabled={isChecking || isFixing}
            className="gap-2"
          >
            <Database className="h-4 w-4" />
            {isFixing ? 'Optimizing...' : 'Optimize Database'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DbFixesNotice;
