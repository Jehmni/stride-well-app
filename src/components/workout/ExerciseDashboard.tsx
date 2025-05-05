
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingUp, BarChart3, Filter } from "lucide-react";
import ExerciseProgressChart from "./ExerciseProgressChart";
import { Skeleton } from "../ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Exercise } from "@/models/models";

// Interface for exercise log count
interface ExerciseLogCount {
  exercise_id: string;
  count: number;
  name: string;
  muscle_group: string;
}

interface ExerciseDashboardProps {
  userId?: string; 
}

const ExerciseDashboard: React.FC<ExerciseDashboardProps> = ({ userId }) => {
  const { user } = useAuth();
  const activeUserId = userId || user?.id;
  
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loggedExercises, setLoggedExercises] = useState<ExerciseLogCount[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("logged");
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  
  useEffect(() => {
    if (!activeUserId) return;
    
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get unique muscle groups
        const { data: muscleGroupData } = await supabase
          .from('exercises')
          .select('muscle_group')
          .order('muscle_group');
        
        if (muscleGroupData) {
          const uniqueGroups = Array.from(new Set(muscleGroupData.map(item => item.muscle_group)));
          setMuscleGroups(uniqueGroups);
        }
        
        // Get logged exercises with counts by using RPC function
        const { data: logged, error: loggedError } = await supabase
          .rpc('get_user_exercise_counts', { user_id_param: activeUserId });
          
        if (loggedError) throw loggedError;
        
        if (logged && logged.length > 0) {
          const formattedLogs = logged.map((log: any) => ({
            exercise_id: log.exercise_id,
            count: log.count,
            name: log.name || 'Unknown Exercise',
            muscle_group: log.muscle_group || 'Unknown Group'
          }));
          
          setLoggedExercises(formattedLogs);
          
          // Set default selected exercise
          if (!selectedExerciseId && formattedLogs.length > 0) {
            setSelectedExerciseId(formattedLogs[0].exercise_id);
          }
        }
        
        // Get all exercises
        const { data: allExercises, error: exercisesError } = await supabase
          .from('exercises')
          .select('*')
          .order('name');
          
        if (exercisesError) throw exercisesError;
        
        // Add default value for equipment_required if missing
        const processedExercises = (allExercises || []).map(ex => ({
          ...ex,
          equipment_required: ex.equipment_required || null
        }));
        
        setExercises(processedExercises as Exercise[]);
      } catch (error) {
        console.error('Error fetching exercise data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [activeUserId, selectedExerciseId]);
  
  // Filter exercises based on search query and muscle groups
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (exercise.description && exercise.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesMuscleGroup = muscleGroupFilter.length === 0 || 
                             muscleGroupFilter.includes(exercise.muscle_group);
    
    return matchesSearch && matchesMuscleGroup;
  });
  
  const filteredLoggedExercises = loggedExercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMuscleGroup = muscleGroupFilter.length === 0 || 
                             muscleGroupFilter.includes(exercise.muscle_group);
    
    return matchesSearch && matchesMuscleGroup;
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-60" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Exercise Progress</h2>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exercises..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {muscleGroups.map((group) => (
                <DropdownMenuCheckboxItem
                  key={group}
                  checked={muscleGroupFilter.includes(group)}
                  onCheckedChange={(checked) => {
                    setMuscleGroupFilter(prev =>
                      checked
                        ? [...prev, group]
                        : prev.filter((item) => item !== group)
                    );
                  }}
                >
                  {group}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="logged">Tracked Exercises</TabsTrigger>
          <TabsTrigger value="all">All Exercises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="logged">
          {filteredLoggedExercises.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/30 rounded-md p-4 h-[400px] overflow-y-auto">
                {filteredLoggedExercises.map((exercise) => (
                  <div
                    key={exercise.exercise_id}
                    className={`p-3 mb-2 rounded-md cursor-pointer transition-colors ${
                      selectedExerciseId === exercise.exercise_id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedExerciseId(exercise.exercise_id)}
                  >
                    <div className="font-medium">{exercise.name}</div>
                    <div className="text-sm flex justify-between">
                      <span>{exercise.muscle_group}</span>
                      <span className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {exercise.count} logs
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="md:col-span-2">
                {selectedExerciseId ? (
                  <ExerciseProgressChart
                    exerciseId={selectedExerciseId}
                    exerciseName={loggedExercises.find(e => e.exercise_id === selectedExerciseId)?.name || ''}
                  />
                ) : (
                  <Card className="h-full flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground p-8">
                      Select an exercise to view progress data
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center text-center p-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No exercise data yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete workouts and log your exercises to see your progress here
                </p>
                <Button variant="secondary">Get Started with a Workout</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredExercises.map(exercise => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{exercise.name}</CardTitle>
                  <CardDescription className="flex justify-between">
                    <span>{exercise.muscle_group}</span>
                    <span className="text-xs px-2 py-1 bg-muted rounded-full">
                      {exercise.difficulty}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 text-sm">
                  {exercise.description && (
                    <p className="line-clamp-2 text-muted-foreground mb-2">
                      {exercise.description}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                      {exercise.equipment_required || 'No equipment'}
                    </span>
                    
                    {loggedExercises.some(e => e.exercise_id === exercise.id) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedExerciseId(exercise.id);
                          setActiveTab("logged");
                        }}
                      >
                        View Progress
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        disabled
                      >
                        No Data Yet
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExerciseDashboard;
