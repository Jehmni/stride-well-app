
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  Calendar,
  Plus,
  Scale,
  Target,
  TrendingUp
} from "lucide-react";
import { format, subDays } from "date-fns";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ProgressRecord {
  id: string;
  user_id: string;
  weight?: number;
  muscle_mass?: number;
  body_fat_percentage?: number;
  created_at: string;
  notes?: string;
}

interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  goal_type: string;
  target_value: number;
  current_value: number;
  target_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface WorkoutLog {
  id: string;
  user_id: string;
  workout_id: string;
  completed_at: string;
  duration?: number;
  calories_burned?: number;
  notes?: string;
  rating?: number;
}

const Progress: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("weight");
  
  // Progress tracking state
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // New record dialog
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [newProgress, setNewProgress] = useState({
    weight: "",
    muscle_mass: "",
    body_fat_percentage: "",
    notes: ""
  });
  
  // New goal dialog
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: "",
    description: "",
    goal_type: "weight",
    target_value: "",
    target_date: ""
  });

  useEffect(() => {
    const fetchProgressData = async () => {
      if (!profile) return;
      
      setIsLoading(true);
      
      try {
        // Fetch progress records
        const { data: progressData, error: progressError } = await supabase
          .from('progress_tracking')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (progressError) throw progressError;
        setProgressRecords(progressData || []);
        
        // Fetch goals
        const { data: goalsData, error: goalsError } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
          
        if (goalsError) throw goalsError;
        setGoals(goalsData || []);
        
        // Fetch workout logs
        const { data: logsData, error: logsError } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', profile.id)
          .order('completed_at', { ascending: false });
          
        if (logsError) throw logsError;
        setWorkoutLogs(logsData || []);
      } catch (error) {
        console.error("Error fetching progress data:", error);
        toast.error("Failed to load progress data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProgressData();
  }, [profile]);
  
  // Add a new progress record
  const addProgressRecord = async () => {
    if (!profile) return;
    
    try {
      const record: any = {
        user_id: profile.id,
        notes: newProgress.notes || null,
      };
      
      if (newProgress.weight) record.weight = parseFloat(newProgress.weight);
      if (newProgress.muscle_mass) record.muscle_mass = parseFloat(newProgress.muscle_mass);
      if (newProgress.body_fat_percentage) record.body_fat_percentage = parseFloat(newProgress.body_fat_percentage);
      
      const { data, error } = await supabase
        .from('progress_tracking')
        .insert([record])
        .select();
        
      if (error) throw error;
      
      toast.success("Progress record added successfully!");
      setProgressRecords([...(data || []), ...progressRecords]);
      setShowAddProgress(false);
      setNewProgress({
        weight: "",
        muscle_mass: "",
        body_fat_percentage: "",
        notes: ""
      });
      
      // Update user profile weight if recorded
      if (newProgress.weight && profile) {
        await supabase
          .from('user_profiles')
          .update({ weight: parseFloat(newProgress.weight) })
          .eq('id', profile.id);
      }
      
      // Update goal progress if applicable
      if (goals.length > 0 && newProgress.weight) {
        const weightGoals = goals.filter(g => g.goal_type === 'weight' && !g.completed);
        
        if (weightGoals.length > 0) {
          await Promise.all(weightGoals.map(async (goal) => {
            const weight = parseFloat(newProgress.weight);
            const completed = goal.target_value >= weight;
            
            await supabase
              .from('goals')
              .update({ 
                current_value: weight,
                completed
              })
              .eq('id', goal.id);
          }));
          
          // Refresh goals
          const { data: updatedGoals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });
            
          if (updatedGoals) {
            setGoals(updatedGoals);
          }
        }
      }
      
    } catch (error) {
      console.error("Error adding progress record:", error);
      toast.error("Failed to add progress record");
    }
  };
  
  // Add a new goal
  const addGoal = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([
          {
            user_id: profile.id,
            name: newGoal.name,
            description: newGoal.description || null,
            goal_type: newGoal.goal_type,
            target_value: parseFloat(newGoal.target_value),
            current_value: profile.weight || 0,
            target_date: newGoal.target_date || null,
            completed: false
          }
        ])
        .select();
        
      if (error) throw error;
      
      toast.success("Goal added successfully!");
      setGoals([...(data || []), ...goals]);
      setShowAddGoal(false);
      setNewGoal({
        name: "",
        description: "",
        goal_type: "weight",
        target_value: "",
        target_date: ""
      });
    } catch (error) {
      console.error("Error adding goal:", error);
      toast.error("Failed to add goal");
    }
  };
  
  // Format dates for charts
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d');
  };
  
  // Data for weight chart
  const getWeightChartData = () => {
    const sortedRecords = [...progressRecords]
      .filter(record => record.weight)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    if (sortedRecords.length === 0) return [];
    
    return sortedRecords.map(record => ({
      date: formatDate(record.created_at),
      weight: record.weight
    }));
  };
  
  // Data for body composition chart
  const getBodyCompChartData = () => {
    const sortedRecords = [...progressRecords]
      .filter(record => record.muscle_mass || record.body_fat_percentage)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    if (sortedRecords.length === 0) return [];
    
    return sortedRecords.map(record => ({
      date: formatDate(record.created_at),
      "Muscle Mass": record.muscle_mass || 0,
      "Body Fat %": record.body_fat_percentage || 0
    }));
  };
  
  // Data for workout frequency chart
  const getWorkoutFrequencyData = () => {
    if (workoutLogs.length === 0) return [];
    
    // Get last 30 days
    const data = [];
    for (let i = 30; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Count workouts on this date
      const count = workoutLogs.filter(log => 
        log.completed_at.split('T')[0] === dateStr
      ).length;
      
      data.push({
        date: format(date, 'MMM d'),
        workouts: count
      });
    }
    
    return data;
  };
  
  // Get latest record value
  const getLatestValue = (field: 'weight' | 'muscle_mass' | 'body_fat_percentage'): string => {
    for (const record of progressRecords) {
      if (record[field]) {
        return record[field]!.toString();
      }
    }
    return profile?.[field]?.toString() || '-';
  };
  
  // Get value change since last record
  const getValueChange = (field: 'weight' | 'muscle_mass' | 'body_fat_percentage'): { value: number, isPositive: boolean } | null => {
    const recordsWithField = progressRecords.filter(r => r[field]);
    
    if (recordsWithField.length < 2) return null;
    
    const latest = recordsWithField[0][field]!;
    const previous = recordsWithField[1][field]!;
    
    const change = latest - previous;
    return {
      value: Math.abs(change),
      isPositive: field === 'muscle_mass' ? change > 0 : change < 0
    };
  };
  
  // Get goal progress percentage
  const getGoalProgress = (goal: Goal): number => {
    if (goal.completed) return 100;
    
    const start = profile?.[goal.goal_type as 'weight'] || 0;
    const current = goal.current_value;
    const target = goal.target_value;
    
    // If goal is to decrease (weight loss)
    if (start > target) {
      if (current <= target) return 100;
      return Math.min(100, ((start - current) / (start - target)) * 100);
    } 
    // If goal is to increase (muscle gain)
    else {
      if (current >= target) return 100;
      return Math.min(100, ((current - start) / (target - start)) * 100);
    }
  };

  return (
    <DashboardLayout title="Progress Tracking">
      <div className="mb-8">
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Track your fitness journey and monitor your progress towards your goals.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Current Weight"
            value={`${getLatestValue('weight')} kg`}
            icon={<Scale className="h-6 w-6 text-fitness-primary" />}
            change={getValueChange('weight')}
          />
          <StatsCard
            title="Body Fat %"
            value={getLatestValue('body_fat_percentage') + '%'}
            icon={<TrendingUp className="h-6 w-6 text-fitness-primary" />}
            change={getValueChange('body_fat_percentage')}
          />
          <StatsCard
            title="Muscle Mass"
            value={`${getLatestValue('muscle_mass')} kg`}
            icon={<BarChart3 className="h-6 w-6 text-fitness-primary" />}
            change={getValueChange('muscle_mass')}
          />
          <StatsCard
            title="Workouts Completed"
            value={workoutLogs.length.toString()}
            icon={<Calendar className="h-6 w-6 text-fitness-primary" />}
            description="Total"
          />
        </div>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Tracking</h3>
          <Dialog open={showAddProgress} onOpenChange={setShowAddProgress}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Progress Record</DialogTitle>
                <DialogDescription>
                  Record your latest measurements to track your progress.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="Enter your current weight"
                    value={newProgress.weight}
                    onChange={(e) => setNewProgress({...newProgress, weight: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="muscle_mass">Muscle Mass (kg)</Label>
                  <Input
                    id="muscle_mass"
                    type="number"
                    step="0.1"
                    placeholder="Enter your muscle mass"
                    value={newProgress.muscle_mass}
                    onChange={(e) => setNewProgress({...newProgress, muscle_mass: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body_fat">Body Fat Percentage (%)</Label>
                  <Input
                    id="body_fat"
                    type="number"
                    step="0.1"
                    placeholder="Enter your body fat percentage"
                    value={newProgress.body_fat_percentage}
                    onChange={(e) => setNewProgress({
                      ...newProgress, 
                      body_fat_percentage: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Input
                    id="notes"
                    placeholder="Any additional notes"
                    value={newProgress.notes}
                    onChange={(e) => setNewProgress({...newProgress, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddProgress(false)}>
                  Cancel
                </Button>
                <Button onClick={addProgressRecord} disabled={
                  !newProgress.weight && 
                  !newProgress.muscle_mass && 
                  !newProgress.body_fat_percentage
                }>
                  Save Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="w-full mb-8"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="composition">Body Composition</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="weight">
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
              <h4 className="font-medium mb-4">Weight Tracking</h4>
              <div className="h-[300px]">
                {getWeightChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getWeightChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        name="Weight (kg)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Scale className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No weight data recorded yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddProgress(true)}
                    >
                      Add Your First Record
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="composition">
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
              <h4 className="font-medium mb-4">Body Composition</h4>
              <div className="h-[300px]">
                {getBodyCompChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getBodyCompChartData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="Muscle Mass" 
                        stroke="#82ca9d" 
                        activeDot={{ r: 8 }}
                        name="Muscle Mass (kg)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Body Fat %" 
                        stroke="#ff7300" 
                        activeDot={{ r: 8 }}
                        name="Body Fat %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <BarChart3 className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No body composition data recorded yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddProgress(true)}
                    >
                      Add Your First Record
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="activity">
            <div className="border rounded-lg p-6 bg-white dark:bg-gray-800">
              <h4 className="font-medium mb-4">Workout Frequency (Last 30 Days)</h4>
              <div className="h-[300px]">
                {workoutLogs.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getWorkoutFrequencyData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} domain={[0, 'auto']} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="workouts" 
                        stroke="#8884d8" 
                        activeDot={{ r: 8 }}
                        name="Workouts"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Calendar className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500">No workout activity recorded yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => navigate('/workouts')}
                    >
                      Start Your First Workout
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Goals Section */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Target className="mr-2 h-5 w-5" />
              Fitness Goals
            </h3>
            <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                  <DialogDescription>
                    Set a new fitness goal to work towards.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input
                      id="goal-name"
                      placeholder="e.g., Reach target weight"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-description">Description (optional)</Label>
                    <Input
                      id="goal-description"
                      placeholder="Describe your goal..."
                      value={newGoal.description}
                      onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goal-type">Goal Type</Label>
                    <select
                      id="goal-type"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newGoal.goal_type}
                      onChange={(e) => setNewGoal({...newGoal, goal_type: e.target.value})}
                    >
                      <option value="weight">Weight</option>
                      <option value="body_fat_percentage">Body Fat Percentage</option>
                      <option value="muscle_mass">Muscle Mass</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-value">Target Value</Label>
                    <Input
                      id="target-value"
                      type="number"
                      step="0.1"
                      placeholder="Enter your target value"
                      value={newGoal.target_value}
                      onChange={(e) => setNewGoal({...newGoal, target_value: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-date">Target Date (optional)</Label>
                    <Input
                      id="target-date"
                      type="date"
                      value={newGoal.target_date}
                      onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={addGoal}
                    disabled={!newGoal.name || !newGoal.target_value}
                  >
                    Create Goal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          {goals.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Target className="h-12 w-12 mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-medium">No Goals Set</h3>
              <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                Set your first fitness goal to help track and stay motivated on your journey.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => setShowAddGoal(true)}
              >
                Set Your First Goal
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {goals.map((goal) => {
                const progress = getGoalProgress(goal);
                const targetDate = goal.target_date 
                  ? format(new Date(goal.target_date), 'MMM d, yyyy')
                  : null;
                  
                return (
                  <div 
                    key={goal.id} 
                    className="border rounded-lg p-6 bg-white dark:bg-gray-800"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{goal.name}</h4>
                        {goal.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {goal.description}
                          </p>
                        )}
                      </div>
                      {goal.completed && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Completed
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className="bg-fitness-primary h-2.5 rounded-full" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <div>
                        <div className="font-medium">Current</div>
                        <div>{goal.current_value} {goal.goal_type === 'body_fat_percentage' ? '%' : 'kg'}</div>
                      </div>
                      <div>
                        <div className="font-medium">Target</div>
                        <div>{goal.target_value} {goal.goal_type === 'body_fat_percentage' ? '%' : 'kg'}</div>
                      </div>
                      {targetDate && (
                        <div>
                          <div className="font-medium">Target Date</div>
                          <div>{targetDate}</div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      {goal.target_value < goal.current_value ? (
                        <ArrowDown className="text-green-500 h-4 w-4 mr-1" />
                      ) : (
                        <ArrowUp className="text-green-500 h-4 w-4 mr-1" />
                      )}
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.abs(goal.target_value - goal.current_value).toFixed(1)} {goal.goal_type === 'body_fat_percentage' ? '%' : 'kg'} to go
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Progress History */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Progress History</h3>
          
          {progressRecords.length === 0 ? (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No progress records yet. Add your first record to start tracking.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Weight</th>
                    <th className="py-3 px-4 text-left">Body Fat %</th>
                    <th className="py-3 px-4 text-left">Muscle Mass</th>
                    <th className="py-3 px-4 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {progressRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="py-3 px-4">{formatDate(record.created_at)}</td>
                      <td className="py-3 px-4">{record.weight ? `${record.weight} kg` : '-'}</td>
                      <td className="py-3 px-4">{record.body_fat_percentage ? `${record.body_fat_percentage}%` : '-'}</td>
                      <td className="py-3 px-4">{record.muscle_mass ? `${record.muscle_mass} kg` : '-'}</td>
                      <td className="py-3 px-4">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Progress;
