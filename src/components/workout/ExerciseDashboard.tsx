
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ExerciseProgressChart from "./ExerciseProgressChart";
import KeyExercises from "./KeyExercises";
import { useAuth } from "@/hooks/useAuth";
import { getUserExerciseCountsRPC } from "@/integrations/supabase/functions";
import { ExerciseCount } from "./types";

const ExerciseDashboard = () => {
  const { user } = useAuth();
  const [exerciseData, setExerciseData] = useState<ExerciseCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null);

  useEffect(() => {
    const loadExerciseData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if exercise_logs function exists
        const { data: funcCheck, error: funcError } = await supabase.rpc('exec_sql', {
          sql: "SELECT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'log_exercise_completion');"
        });
        
        if (funcError) {
          console.error("Error checking function:", funcError);
          setError("The exercise logging function is not properly configured. Run the database fix script.");
          setLoading(false);
          return;
        }
        
        // Make sure we're handling the response correctly
        if (funcCheck && Array.isArray(funcCheck) && funcCheck.length > 0) {
          // Check if the property exists in the first element of the array
          const firstItem = funcCheck[0];
          // Check for exists field in different ways since it could be a boolean or string "true"/"false"
          const functionExists = typeof firstItem === 'object' && 
            (firstItem.exists === true || firstItem.exists === 'true' || firstItem.exists === 't');
          
          // If function exists, get exercise counts
          if (functionExists) {
            const { data, error } = await getUserExerciseCountsRPC({ 
              user_id_param: user.id 
            });
            
            if (error) {
              console.error("Error fetching exercise counts:", error);
              setError("Error loading your exercise data. Please try again later.");
            } else if (data && data.length > 0) {
              setExerciseData(data);
              setSelectedExerciseId(data[0].exercise_id);
              setSelectedExerciseName(data[0].name);
            } else {
              setExerciseData([]);
            }
          } else {
            setError("The exercise logging function is not properly configured. Run the database fix script.");
          }
        } else {
          setError("The exercise logging function is not properly configured. Run the database fix script.");
        }
      } catch (err) {
        console.error("Error in ExerciseDashboard:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadExerciseData();
  }, [user]);

  const handleExerciseSelect = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    // Find the name of the selected exercise
    const selectedExercise = exerciseData.find(ex => ex.exercise_id === exerciseId);
    if (selectedExercise) {
      setSelectedExerciseName(selectedExercise.name);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="mb-4 bg-red-50 dark:bg-red-900/20 border-red-200">
        <AlertDescription className="text-red-700 dark:text-red-300">
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (exerciseData.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No exercise data found. Start logging your workouts to see your progress here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="progress" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="progress">Progress Charts</TabsTrigger>
          <TabsTrigger value="summary">Exercise Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Exercise Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedExerciseId && (
                <ExerciseProgressChart 
                  exerciseId={selectedExerciseId}
                  exerciseName={selectedExerciseName || undefined}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="summary">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Most Used Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <KeyExercises 
                exerciseData={exerciseData} 
                onExerciseSelect={handleExerciseSelect} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExerciseDashboard;
