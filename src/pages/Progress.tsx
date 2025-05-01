import React, { useState, useEffect } from "react";
import { 
  ArrowDown, 
  ArrowUp,
  Award, 
  BarChart3, 
  Calendar, 
  Dumbbell, 
  Loader2,
  Scale,
  Target,
  TrendingUp 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Define types for our progress data
interface WeightRecord {
  id: string;
  recorded_at: string;
  weight: number;
  user_id: string;
}

interface WorkoutRecord {
  id: string;
  completed_at: string;
  workout_title: string;
  duration: number;
  user_id: string;
}

interface StrengthRecord {
  id: string;
  recorded_at: string;
  exercise: string;
  weight: number;
  reps: number;
  user_id: string;
}

interface Measurement {
  id: string;
  recorded_at: string;
  chest: number;
  waist: number;
  hips: number;
  arms: number;
  thighs: number;
  user_id: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
}

const ProgressPage: React.FC = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [weightData, setWeightData] = useState<WeightRecord[]>([]);
  const [strengthData, setStrengthData] = useState<StrengthRecord[]>([]);
  const [measurementData, setMeasurementData] = useState<Measurement | null>(null);
  const [workoutData, setWorkoutData] = useState<WorkoutRecord[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  
  // Fetch all progress data
  useEffect(() => {
    const fetchProgressData = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      try {
        // Fetch weight records
        const { data: weightRecords, error: weightError } = await supabase
          .from('weight_records')
          .select('*')
          .eq('user_id', profile.id)
          .order('recorded_at', { ascending: true });
          
        if (weightError) throw weightError;
        
        if (weightRecords && weightRecords.length > 0) {
          setWeightData(weightRecords);
        } else {
          // If no data, create mock data for demo purposes
          const mockWeightData = [
            { id: 'mock1', user_id: profile.id, recorded_at: '2023-07-01', weight: profile.weight },
            { id: 'mock2', user_id: profile.id, recorded_at: '2023-07-08', weight: profile.weight - 0.5 },
            { id: 'mock3', user_id: profile.id, recorded_at: '2023-07-15', weight: profile.weight - 0.8 },
            { id: 'mock4', user_id: profile.id, recorded_at: '2023-07-22', weight: profile.weight - 1.2 },
            { id: 'mock5', user_id: profile.id, recorded_at: '2023-07-29', weight: profile.weight - 1.7 }
          ];
          setWeightData(mockWeightData);
        }
        
        // Fetch completed workouts
        const { data: workouts, error: workoutError } = await supabase
          .from('completed_workouts')
          .select('*')
          .eq('user_id', profile.id)
          .order('completed_at', { ascending: true });
          
        if (workoutError) throw workoutError;
        setWorkoutData(workouts || []);
        
        // Fetch strength records
        const { data: strengthRecords, error: strengthError } = await supabase
          .from('strength_records')
          .select('*')
          .eq('user_id', profile.id)
          .order('recorded_at', { ascending: true });
          
        if (strengthError) throw strengthError;
        setStrengthData(strengthRecords || []);
        
        // Fetch latest body measurements
        const { data: measurements, error: measurementError } = await supabase
          .from('body_measurements')
          .select('*')
          .eq('user_id', profile.id)
          .order('recorded_at', { ascending: false })
          .limit(1)
          .maybeSingle();
          
        if (measurementError) throw measurementError;
        setMeasurementData(measurements);
        
        // Generate achievements based on the data
        const userAchievements = generateAchievements(workouts || [], weightRecords || []);
        setAchievements(userAchievements);
        
      } catch (error: any) {
        console.error("Error fetching progress data:", error);
        toast.error("Failed to load progress data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgressData();
  }, [profile]);
  
  // Generate achievements based on user data
  const generateAchievements = (workouts: WorkoutRecord[], weightRecords: WeightRecord[]): Achievement[] => {
    const result: Achievement[] = [];
    
    // First workout achievement
    if (workouts.length > 0) {
      const firstWorkoutDate = new Date(workouts[0].completed_at);
      result.push({
        id: 1,
        title: "First Workout Completed",
        description: "You completed your first workout. Great start!",
        date: firstWorkoutDate.toLocaleDateString(),
        icon: <Calendar className="h-10 w-10 p-2 bg-blue-100 text-blue-600 rounded-full" />
      });
    }
    
    // Workout streak achievement (5 workouts)
    if (workouts.length >= 5) {
      result.push({
        id: 2,
        title: "5 Workouts Completed",
        description: "You've completed 5 workouts. Keep going!",
        date: new Date(workouts[4].completed_at).toLocaleDateString(),
        icon: <Award className="h-10 w-10 p-2 bg-yellow-100 text-yellow-600 rounded-full" />
      });
    }
    
    // Weight loss achievement (if applicable)
    if (weightRecords.length >= 2) {
      const firstWeight = weightRecords[0].weight;
      const latestWeight = weightRecords[weightRecords.length - 1].weight;
      const weightDiff = firstWeight - latestWeight;
      
      if (weightDiff >= 2) {
        result.push({
          id: 3,
          title: "Weight Milestone",
          description: `You've lost ${weightDiff.toFixed(1)} kg. Amazing progress!`,
          date: new Date(weightRecords[weightRecords.length - 1].recorded_at).toLocaleDateString(),
          icon: <Scale className="h-10 w-10 p-2 bg-green-100 text-green-600 rounded-full" />
        });
      }
    }
    
    return result;
  };
  
  // Format weight data for chart
  const formatWeightData = () => {
    return weightData.map(record => ({
      date: new Date(record.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weight: record.weight
    }));
  };
  
  // Format strength data for chart
  const formatStrengthData = () => {
    const exercises = [...new Set(strengthData.map(record => record.exercise))];
    const dataByWeek: Record<string, Record<string, number>> = {};
    
    strengthData.forEach(record => {
      const date = new Date(record.recorded_at);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = `Week ${weekStart.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}`;
      
      if (!dataByWeek[weekKey]) {
        dataByWeek[weekKey] = {};
      }
      
      // Use the one-rep max formula: weight * (1 + 0.0333 * reps)
      const oneRepMax = record.weight * (1 + 0.0333 * record.reps);
      dataByWeek[weekKey][record.exercise] = Math.round(oneRepMax);
    });
    
    // Convert the grouped data into chart format
    return Object.entries(dataByWeek).map(([week, values]) => {
      const result: Record<string, any> = { date: week };
      exercises.forEach(exercise => {
        result[exercise] = values[exercise] || null;
      });
      return result;
    });
  };
  
  // Add a new weight record
  const addWeightRecord = async (weight: number) => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('weight_records')
        .insert({
          user_id: profile.id,
          weight: weight,
          recorded_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast.success("Weight record added successfully!");
      
      // Refresh weight data
      const { data, error: fetchError } = await supabase
        .from('weight_records')
        .select('*')
        .eq('user_id', profile.id)
        .order('recorded_at', { ascending: true });
        
      if (fetchError) throw fetchError;
      setWeightData(data || []);
      
    } catch (error: any) {
      console.error("Error adding weight record:", error);
      toast.error("Failed to add weight record");
    }
  };
  
  // Render progress card with arrow indicator
  const renderProgressCard = (title: string, current: number, previous: number, unit: string) => {
    const isPositive = current > previous;
    const isNeutral = current === previous;
    const difference = Math.abs(current - previous);
    const percentChange = previous > 0 ? Math.round((difference / previous) * 100) : 0;
    
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-bold">{current}{unit}</p>
            {!isNeutral && (
              <p className={`ml-2 text-sm flex items-center ${
                (isPositive && title.includes("Weight") || !isPositive && !title.includes("Weight")) 
                  ? "text-red-500" 
                  : "text-green-500"
              }`}>
                {isPositive ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                {difference}{unit} ({percentChange}%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Progress Tracking">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2">Loading your progress data...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Progress Tracking">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Fitness Journey</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track your progress towards your {profile?.fitness_goal === "weight-loss" ? "weight loss" : profile?.fitness_goal === "muscle-gain" ? "muscle building" : profile?.fitness_goal === "endurance" ? "endurance" : "fitness"} goals
        </p>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {weightData.length > 0 && renderProgressCard(
            "Current Weight", 
            weightData[weightData.length - 1].weight, 
            weightData[0].weight, 
            "kg"
          )}
          {renderProgressCard("Workouts Completed", workoutData.length, 0, "")}
          
          {/* Current streak calculation (simplified) */}
          {workoutData.length > 0 && renderProgressCard(
            "Current Streak", 
            1, // This would need more complex logic to calculate actual streak
            0, 
            " days"
          )}
          
          {/* Calories burned (estimated) */}
          {renderProgressCard(
            "Calories Burned", 
            workoutData.reduce((total, workout) => total + (workout.duration * 8), 0), // Rough estimate: 8 calories per minute
            0, 
            " kcal"
          )}
        </div>
        
        <Tabs defaultValue="weight" className="mb-8">
          <TabsList>
            <TabsTrigger value="weight" className="flex items-center">
              <Scale className="h-4 w-4 mr-2" />
              Weight
            </TabsTrigger>
            <TabsTrigger value="strength" className="flex items-center">
              <Dumbbell className="h-4 w-4 mr-2" />
              Strength
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Measurements
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center">
              <Award className="h-4 w-4 mr-2" />
              Achievements
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="weight" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <TrendingUp className="mr-2 h-5 w-5" />
                    Weight Progress
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const weight = prompt("Enter your current weight in kg:");
                        if (weight && !isNaN(parseFloat(weight))) {
                          addWeightRecord(parseFloat(weight));
                        } else if (weight !== null) {
                          toast.error("Please enter a valid number");
                        }
                      }}
                    >
                      Add Weight Record
                    </Button>
                  </div>
                </div>
                
                {weightData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formatWeightData()}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={{ r: 5 }} 
                          activeDot={{ r: 7 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No weight data recorded yet.</p>
                    <Button 
                      onClick={() => {
                        const weight = prompt("Enter your current weight in kg:");
                        if (weight && !isNaN(parseFloat(weight))) {
                          addWeightRecord(parseFloat(weight));
                        } else if (weight !== null) {
                          toast.error("Please enter a valid number");
                        }
                      }}
                    >
                      Record Your Weight
                    </Button>
                  </div>
                )}
                
                {weightData.length > 0 && (
                  <div className="mt-6 flex justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Starting weight</p>
                      <p className="font-medium">{weightData[0].weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current weight</p>
                      <p className="font-medium">{weightData[weightData.length - 1].weight} kg</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total change</p>
                      <p className={`font-medium ${weightData[0].weight > weightData[weightData.length - 1].weight ? "text-green-500" : "text-red-500"}`}>
                        {(weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1)} kg
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strength" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Dumbbell className="mr-2 h-5 w-5" />
                    Strength Progress
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/workouts")}
                  >
                    Log Workout
                  </Button>
                </div>
                
                {strengthData.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formatStrengthData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        {[...new Set(strengthData.map(record => record.exercise))].map((exercise, index) => (
                          <Bar 
                            key={exercise} 
                            dataKey={exercise} 
                            fill={`hsl(${index * 40}, 70%, 50%)`} 
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No strength data recorded yet.</p>
                    <Button onClick={() => navigate("/workouts")}>
                      Record Your Lifts
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="measurements" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Body Measurements
                </h3>
                
                {measurementData ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Chest</p>
                        <p className="text-2xl font-bold">{measurementData.chest} cm</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Waist</p>
                        <p className="text-2xl font-bold">{measurementData.waist} cm</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Hips</p>
                        <p className="text-2xl font-bold">{measurementData.hips} cm</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Arms</p>
                        <p className="text-2xl font-bold">{measurementData.arms} cm</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Thighs</p>
                        <p className="text-2xl font-bold">{measurementData.thighs} cm</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm">
                        Update Measurements
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No body measurements recorded yet.</p>
                    <Button>
                      Record Measurements
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  Your Achievements
                </h3>
                
                {achievements.length > 0 ? (
                  <div className="space-y-4">
                    {achievements.map((achievement) => (
                      <div key={achievement.id} className="flex items-start p-4 border rounded-lg">
                        {achievement.icon}
                        <div className="ml-4">
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {achievement.description}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Achieved on {achievement.date}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Complete workouts and track your progress to earn achievements!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
