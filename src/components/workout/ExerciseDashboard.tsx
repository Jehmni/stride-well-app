
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [activeTab, setActiveTab] = useState("progress");

  useEffect(() => {
    const loadExerciseData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if the exercise logging function exists by directly querying the database
        const { data: funcExists, error: checkError } = await supabase
          .from('exercise_logs')
          .select('id')
          .limit(1);
        
        if (checkError) {
          console.error("Error checking exercise logs:", checkError);
          setError("Could not verify if exercise logs table exists. Please check your database setup.");
          setLoading(false);
          return;
        }
        
        // If we can query exercise_logs, the table exists
        // Now get user exercise counts
        const { data, error } = await getUserExerciseCountsRPC({ 
          user_id_param: user.id 
        });
        
        if (error) {
          console.error("Error fetching exercise counts:", error);
          setError("Error loading your exercise data. Please try again later.");
        } else if (data && data.length > 0) {
          console.log("Exercise data loaded successfully:", data);
          setExerciseData(data);
          setSelectedExerciseId(data[0].exercise_id);
          setSelectedExerciseName(data[0].name);
        } else {
          console.log("No exercise data found");
          setExerciseData([]);
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
    // Switch to progress tab when "View Progress" is clicked
    setActiveTab("progress");
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="progress">Progress Charts</TabsTrigger>
          <TabsTrigger value="summary">Exercise Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Exercise Progress</CardTitle>
                <Select 
                  value={selectedExerciseId || ''} 
                  onValueChange={(value) => {
                    setSelectedExerciseId(value);
                    const exercise = exerciseData.find(ex => ex.exercise_id === value);
                    setSelectedExerciseName(exercise?.name || null);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exerciseData.map((exercise) => (
                      <SelectItem key={exercise.exercise_id} value={exercise.exercise_id}>
                        {exercise.name} ({exercise.count} times)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
            <CardContent className="pt-6">
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
