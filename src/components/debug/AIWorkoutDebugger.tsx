// Debug utility to verify AI workout generation
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { regenerateWorkoutPlan } from '@/integrations/ai/workoutAIService';
import { supabase } from '@/integrations/supabase/client';
import { getAIConfig } from '@/integrations/supabase/aiConfig';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle } from 'lucide-react';

const AIWorkoutDebugger = () => {
  const { user, profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [aiConfigInfo, setAiConfigInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check AI configuration
  const checkAiConfig = async () => {
    try {
      const aiConfig = await getAIConfig('openai');
      setAiConfigInfo({
        exists: !!aiConfig,
        apiKeyExists: !!(aiConfig && aiConfig.api_key),
        isEnabled: !!(aiConfig && aiConfig.is_enabled),
        model: aiConfig?.model || 'unknown'
      });
    } catch (err) {
      console.error("Error checking AI config:", err);
      setAiConfigInfo({ error: "Failed to check AI configuration" });
    }
  };

  // Fetch existing AI workout plans
  const checkExistingPlans = async () => {
    if (!user?.id) return;
    
    try {
      const { data: plans, error } = await supabase
        .from('workout_plans')
        .select('id, title, created_at, ai_generated')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setDebugInfo({
        existingPlans: plans
      });
      
      return plans;
    } catch (err) {
      console.error("Error checking existing plans:", err);
      setDebugInfo({ error: "Failed to check existing plans" });
      return [];
    }
  };

  // Trigger AI workout plan generation
  const generateWorkoutPlan = async () => {
    if (!user?.id || !profile) {
      setError("User not logged in or profile not loaded");
      return;
    }
    
    try {
      setIsGenerating(true);
      setProgress(0);
      setProgressMessage('Starting workout generation...');
      setError(null);
      setSuccess(false);
      
      // Check configuration first
      await checkAiConfig();
      const existingPlans = await checkExistingPlans();
      
      // Force console to show all logs
      console.log = console.log.bind(console);
      
      // Generate the workout plan
      const success = await regenerateWorkoutPlan(user.id, (message, progress) => {
        setProgressMessage(message);
        setProgress(progress);
      });
      
      if (success) {
        setSuccess(true);
        // Fetch the updated plans
        await checkExistingPlans();
      } else {
        setError("Failed to generate AI workout plan. Check console for details.");
      }
    } catch (err: any) {
      console.error("Error generating workout plan:", err);
      setError(err.message || "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>AI Workout Plan Debugger</CardTitle>
        <CardDescription>
          Verify if AI workout generation is working properly
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* AI Config Status */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">AI Configuration Status</h3>
          {aiConfigInfo ? (
            <div className="text-sm bg-muted p-3 rounded-md overflow-auto">
              <pre>{JSON.stringify(aiConfigInfo, null, 2)}</pre>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={checkAiConfig}>
              Check AI Configuration
            </Button>
          )}
        </div>
        
        {/* Existing Plan Data */}
        <div className="mb-6">
          <h3 className="font-medium mb-2">Existing AI Workout Plans</h3>
          {debugInfo ? (
            <div className="text-sm bg-muted p-3 rounded-md overflow-auto max-h-60">
              <pre>{JSON.stringify(debugInfo.existingPlans || {}, null, 2)}</pre>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={checkExistingPlans}>
              Check Existing Plans
            </Button>
          )}
        </div>
        
        {/* Progress Indicator */}
        {isGenerating && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Generation Progress</h3>
            <Progress value={progress} className="mb-2" />
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 flex items-start gap-2 text-red-600 bg-red-50 p-3 rounded-md">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 flex items-start gap-2 text-green-600 bg-green-50 p-3 rounded-md">
            <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Success!</p>
              <p className="text-sm">AI workout plan was successfully generated.</p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            setDebugInfo(null);
            setAiConfigInfo(null);
            setError(null);
            setSuccess(false);
          }}
        >
          Reset
        </Button>
        <Button 
          onClick={generateWorkoutPlan}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate AI Workout Plan"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIWorkoutDebugger;
