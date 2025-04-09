
import React from "react";
import { 
  ArrowDown, 
  ArrowUp,
  Award, 
  BarChart3, 
  Calendar, 
  Dumbbell, 
  Scale,
  Target,
  TrendingUp 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
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

const ProgressPage: React.FC = () => {
  const userProfile = JSON.parse(localStorage.getItem("userProfile") || "{}");
  const fitnessGoal = userProfile.fitnessGoal || "general-fitness";
  
  // Mock data for weight tracking
  const weightData = [
    { date: "Mar 10", weight: 78.2 },
    { date: "Mar 17", weight: 77.5 },
    { date: "Mar 24", weight: 76.8 },
    { date: "Mar 31", weight: 76.0 },
    { date: "Apr 07", weight: 75.4 },
  ];
  
  // Mock data for workout performance
  const strengthData = [
    { date: "Week 1", squat: 50, bench: 40, deadlift: 60 },
    { date: "Week 2", squat: 55, bench: 42.5, deadlift: 65 },
    { date: "Week 3", squat: 60, bench: 45, deadlift: 70 },
    { date: "Week 4", squat: 62.5, bench: 47.5, deadlift: 75 },
    { date: "Week 5", squat: 65, bench: 50, deadlift: 80 },
  ];
  
  // Mock data for body measurements
  const measurementData = {
    chest: { current: 92, previous: 94 },
    waist: { current: 84, previous: 86 },
    hips: { current: 94, previous: 95 },
    arms: { current: 34, previous: 33 },
    thighs: { current: 56, previous: 55 },
  };
  
  // Mock data for achievements
  const achievements = [
    { 
      id: 1, 
      title: "First Week Complete", 
      description: "Completed your first week of workouts", 
      date: "Mar 17", 
      icon: <Calendar className="h-10 w-10 p-2 bg-blue-100 text-blue-600 rounded-full" /> 
    },
    { 
      id: 2, 
      title: "5 Workouts Streak", 
      description: "Completed 5 workouts in a row", 
      date: "Mar 24", 
      icon: <Award className="h-10 w-10 p-2 bg-yellow-100 text-yellow-600 rounded-full" /> 
    },
    { 
      id: 3, 
      title: "Weight Milestone", 
      description: "Lost your first 2 kg", 
      date: "Apr 7", 
      icon: <Scale className="h-10 w-10 p-2 bg-green-100 text-green-600 rounded-full" /> 
    },
  ];

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

  return (
    <DashboardLayout title="Progress Tracking">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Your Fitness Journey</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track your progress towards your {fitnessGoal === "weight-loss" ? "weight loss" : fitnessGoal === "muscle-gain" ? "muscle building" : fitnessGoal === "endurance" ? "endurance" : "fitness"} goals
        </p>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderProgressCard("Current Weight", weightData[weightData.length - 1].weight, weightData[0].weight, "kg")}
          {renderProgressCard("Workouts Completed", 12, 0, "")}
          {renderProgressCard("Current Streak", 5, 0, " days")}
          {renderProgressCard("Calories Burned", 8650, 0, " kcal")}
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
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Weight Progress
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weightData}
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
                    <p className="font-medium text-green-500">
                      {(weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1)} kg
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="strength" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Dumbbell className="mr-2 h-5 w-5" />
                  Strength Progress
                </h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={strengthData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="squat" name="Squat (kg)" fill="#3b82f6" />
                      <Bar dataKey="bench" name="Bench Press (kg)" fill="#10b981" />
                      <Bar dataKey="deadlift" name="Deadlift (kg)" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["squat", "bench", "deadlift"].map((exercise) => (
                    <div key={exercise}>
                      <p className="text-sm text-gray-500 capitalize">{exercise}</p>
                      <p className="font-medium">
                        {strengthData[strengthData.length - 1][exercise as keyof typeof strengthData[0]]} kg
                      </p>
                      <p className="text-xs text-green-500">
                        +{(strengthData[strengthData.length - 1][exercise as keyof typeof strengthData[0]] as number) - 
                           (strengthData[0][exercise as keyof typeof strengthData[0]] as number)} kg since start
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="measurements" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Body Measurements
                </h3>
                <div className="space-y-5">
                  {Object.entries(measurementData).map(([key, value]) => {
                    const change = value.current - value.previous;
                    const isPositive = change > 0;
                    const isNegative = change < 0;
                    
                    return (
                      <div key={key} className="space-y-2">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium capitalize">{key}</p>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm">{value.current} cm</p>
                            {isNegative && (
                              <span className="text-xs text-green-500 flex items-center">
                                <ArrowDown className="h-3 w-3 mr-1" />{Math.abs(change)} cm
                              </span>
                            )}
                            {isPositive && (
                              <span className="text-xs text-red-500 flex items-center">
                                <ArrowUp className="h-3 w-3 mr-1" />{change} cm
                              </span>
                            )}
                          </div>
                        </div>
                        <Progress value={value.current / (value.previous * 1.2) * 100} />
                      </div>
                    );
                  })}
                </div>
                <Button variant="outline" className="w-full mt-6">
                  Update Measurements
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="achievements" className="mt-6">
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <Card key={achievement.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      {achievement.icon}
                      <div className="ml-4">
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Achieved on {achievement.date}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button className="w-full fitness-button-primary flex items-center justify-center">
                <Award className="h-4 w-4 mr-2" />
                Share Achievements
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Goals & Targets */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Your Goals & Targets
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Weekly Workout Goal</h4>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    4 workouts per week
                  </p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>3/4 workouts</span>
                    </div>
                    <Progress value={75} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Weight Goal</h4>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Target: 70kg (Current: {weightData[weightData.length - 1].weight}kg)
                  </p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round((weightData[0].weight - weightData[weightData.length - 1].weight) / (weightData[0].weight - 70) * 100)}%</span>
                    </div>
                    <Progress value={Math.round((weightData[0].weight - weightData[weightData.length - 1].weight) / (weightData[0].weight - 70) * 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h4 className="font-semibold mb-3">Strength Goal</h4>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Bench press: 60kg (Current: {strengthData[strengthData.length - 1].bench}kg)
                  </p>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{Math.round(strengthData[strengthData.length - 1].bench / 60 * 100)}%</span>
                    </div>
                    <Progress value={Math.round(strengthData[strengthData.length - 1].bench / 60 * 100)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Stats History */}
        <Button variant="outline" className="w-full flex items-center justify-center">
          <Calendar className="h-4 w-4 mr-2" />
          View Detailed History
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;
