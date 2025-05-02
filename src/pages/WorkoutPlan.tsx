
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, Clock, Dumbbell, Loader2, PlusCircle, Target, Trash } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutCard from "@/components/dashboard/WorkoutCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Types for workout data
interface WorkoutExercise {
  name: string;
  sets: number;
  reps: string;
  muscle: string;
}

interface WorkoutDay {
  day: string;
  focus: string;
  duration: number;
}

interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  fitness_goal: string;
  weekly_structure: WorkoutDay[];
  exercises: WorkoutExercise[];
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string;
  difficulty: string;
  exercise_type: string;
  description: string | null;
}

interface UserWorkout {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number | null;
  created_at: string;
  updated_at: string;
}

interface WorkoutExerciseDetail {
  id: string;
  workout_id: string;
  exercise_id: string;
  sets: number;
  reps: number | null;
  duration: number | null;
  rest_time: number;
  order_position: number;
  notes: string | null;
  exercise: Exercise;
}

const WorkoutPlan: React.FC = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<{
    title: string;
    description: string;
    duration: number;
    exercises: number;
    date: string;
    image: string;
  } | null>(null);
  
  // New states for custom workouts
  const [userWorkouts, setUserWorkouts] = useState<UserWorkout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    dayOfWeek: "0",
  });
  
  // Selected workout for details view
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseDetail[]>([]);
  
  // New exercise form
  const [newExerciseForm, setNewExerciseForm] = useState({
    exerciseId: "",
    sets: 3,
    reps: 10,
    duration: null,
    restTime: 60,
    notes: "",
  });

  // Fetch workout plan based on user's fitness goal
  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      if (!profile) return;
      
      try {
        setIsLoading(true);
        
        // Get workout plan for the user's fitness goal
        const { data, error } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('fitness_goal', profile.fitness_goal)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setWorkoutPlan(data);
          
          // Set today's workout based on day of week
          const today = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
          const todayWorkoutData = data.weekly_structure[today];
          
          setTodayWorkout({
            title: todayWorkoutData.focus,
            description: `Focus on ${todayWorkoutData.focus.toLowerCase()} exercises for optimal results`,
            duration: todayWorkoutData.duration,
            exercises: Math.floor(Math.random() * 3) + 4, // Random number between 4-6
            date: "Today",
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80"
          });
        }
      } catch (error: any) {
        console.error("Error fetching workout plan:", error);
        toast.error("Failed to load your workout plan");
        
        // Fallback to a default plan if fetch fails
        setWorkoutPlan({
          id: "default",
          title: "General Fitness Program",
          description: "Well-rounded approach to improve overall fitness and health",
          fitness_goal: "general-fitness",
          weekly_structure: [
            { day: "Monday", focus: "Full Body Strength", duration: 45 },
            { day: "Tuesday", focus: "Cardio & Mobility", duration: 40 },
            { day: "Wednesday", focus: "Core & Balance", duration: 30 },
            { day: "Thursday", focus: "Rest or Light Activity", duration: 20 },
            { day: "Friday", focus: "Full Body Circuit", duration: 45 },
            { day: "Saturday", focus: "Cardio & Flexibility", duration: 40 },
            { day: "Sunday", focus: "Rest Day", duration: 0 }
          ],
          exercises: [
            { name: "Dumbbell Squat", sets: 3, reps: "12-15", muscle: "Legs" },
            { name: "Push-ups", sets: 3, reps: "10-15", muscle: "Chest" },
            { name: "Dumbbell Row", sets: 3, reps: "12 each arm", muscle: "Back" },
            { name: "Plank", sets: 3, reps: "30-60 seconds", muscle: "Core" },
            { name: "Walking Lunges", sets: 2, reps: "10 each leg", muscle: "Legs" },
            { name: "Jumping Jacks", sets: 3, reps: "45 seconds", muscle: "Cardio" }
          ]
        });
      }
      
      // Fetch user's custom workouts
      try {
        const { data: userWorkoutData, error: userWorkoutError } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user?.id);
          
        if (userWorkoutError) throw userWorkoutError;
        
        setUserWorkouts(userWorkoutData || []);
      } catch (error: any) {
        console.error("Error fetching user workouts:", error);
        toast.error("Failed to load your custom workouts");
      }
      
      // Fetch exercises
      try {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('exercises')
          .select('*');
          
        if (exercisesError) throw exercisesError;
        
        setExercises(exercisesData || []);
      } catch (error: any) {
        console.error("Error fetching exercises:", error);
      }
      
      setIsLoading(false);
    };
    
    fetchWorkoutPlan();
  }, [profile, user?.id]);
  
  // Function to mark a workout as completed
  const completeWorkout = async () => {
    if (!profile) return;
    
    try {
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: profile.id,
          workout_id: workoutPlan?.id || 'default',
          completed_at: new Date().toISOString(),
          duration: todayWorkout?.duration,
          calories_burned: Math.floor(Math.random() * 100) + 200 // Random calories for demo
        });
        
      if (error) throw error;
      
      toast.success("Workout marked as completed!");
    } catch (error: any) {
      console.error("Error saving completed workout:", error);
      toast.error("Failed to save workout completion");
    }
  };
  
  // Function to create a new custom workout
  const createWorkout = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          name: newWorkout.name,
          description: newWorkout.description || null,
          day_of_week: newWorkout.dayOfWeek ? parseInt(newWorkout.dayOfWeek) : null,
          user_id: user.id
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Workout created successfully!");
      setUserWorkouts([...(data || []), ...userWorkouts]);
      setShowCreateWorkout(false);
      setNewWorkout({
        name: "",
        description: "",
        dayOfWeek: "0"
      });
    } catch (error: any) {
      console.error("Error creating workout:", error);
      toast.error("Failed to create workout");
    }
  };
  
  // Function to delete a workout
  const deleteWorkout = async (workoutId: string) => {
    try {
      const { error } = await supabase
        .from('workouts')
        .delete()
        .eq('id', workoutId);
        
      if (error) throw error;
      
      toast.success("Workout deleted successfully!");
      setUserWorkouts(userWorkouts.filter(workout => workout.id !== workoutId));
      
      if (selectedWorkout === workoutId) {
        setSelectedWorkout(null);
        setWorkoutExercises([]);
      }
    } catch (error: any) {
      console.error("Error deleting workout:", error);
      toast.error("Failed to delete workout");
    }
  };
  
  // Function to fetch workout exercises
  const fetchWorkoutExercises = async (workoutId: string) => {
    try {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('workout_id', workoutId)
        .order('order_position', { ascending: true });
        
      if (error) throw error;
      
      setWorkoutExercises(data || []);
    } catch (error: any) {
      console.error("Error fetching workout exercises:", error);
      toast.error("Failed to load workout details");
    }
  };
  
  // Function to add an exercise to a workout
  const addExerciseToWorkout = async () => {
    if (!selectedWorkout || !newExerciseForm.exerciseId) return;
    
    try {
      // Get the next order position
      const nextPosition = workoutExercises.length > 0 
        ? Math.max(...workoutExercises.map(ex => ex.order_position)) + 1 
        : 0;
      
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          workout_id: selectedWorkout,
          exercise_id: newExerciseForm.exerciseId,
          sets: newExerciseForm.sets,
          reps: newExerciseForm.reps,
          duration: newExerciseForm.duration,
          rest_time: newExerciseForm.restTime,
          order_position: nextPosition,
          notes: newExerciseForm.notes || null
        })
        .select(`
          *,
          exercise:exercises(*)
        `);
        
      if (error) throw error;
      
      toast.success("Exercise added to workout!");
      setWorkoutExercises([...workoutExercises, ...(data || [])]);
      
      // Reset form
      setNewExerciseForm({
        exerciseId: "",
        sets: 3,
        reps: 10,
        duration: null,
        restTime: 60,
        notes: "",
      });
    } catch (error: any) {
      console.error("Error adding exercise to workout:", error);
      toast.error("Failed to add exercise to workout");
    }
  };
  
  // Function to remove an exercise from a workout
  const removeExerciseFromWorkout = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);
        
      if (error) throw error;
      
      toast.success("Exercise removed from workout!");
      setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId));
    } catch (error: any) {
      console.error("Error removing exercise:", error);
      toast.error("Failed to remove exercise");
    }
  };

  // Get day name from number
  const getDayName = (dayNumber: number | null) => {
    if (dayNumber === null) return "Any day";
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return days[dayNumber];
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fitness-primary" />
          <span className="ml-2">Loading your workout plan...</span>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!workoutPlan) {
    return (
      <DashboardLayout title="Workout Plans">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No workout plan found for your fitness goal.
          </p>
          <Button onClick={() => navigate("/profile")}>
            Update Your Fitness Goal
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Workout Plans">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">{workoutPlan.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {workoutPlan.description}
        </p>
        
        <div className="bg-fitness-primary bg-opacity-10 p-6 rounded-lg mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="mr-2 h-5 w-5" />
            Weekly Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {workoutPlan.weekly_structure.map((day, index) => (
              <div 
                key={index}
                className={`p-4 rounded-lg border ${
                  new Date().getDay() === (index + 1) % 7 ? 
                  'border-fitness-primary bg-fitness-primary bg-opacity-5' : 
                  'border-gray-200 dark:border-gray-700'
                }`}
              >
                <p className="font-medium">{day.day}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{day.focus}</p>
                {day.duration > 0 ? (
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{day.duration} mins</span>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500">Rest Day</div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Dumbbell className="mr-2 h-5 w-5" />
            Key Exercises
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="py-3 px-4 text-left">Exercise</th>
                  <th className="py-3 px-4 text-left">Sets</th>
                  <th className="py-3 px-4 text-left">Reps</th>
                  <th className="py-3 px-4 text-left">Target Muscle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {workoutPlan.exercises.map((exercise, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">{exercise.name}</td>
                    <td className="py-3 px-4">{exercise.sets}</td>
                    <td className="py-3 px-4">{exercise.reps}</td>
                    <td className="py-3 px-4">{exercise.muscle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {todayWorkout && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Today's Workout
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <WorkoutCard
              title={todayWorkout.title}
              description={todayWorkout.description}
              duration={todayWorkout.duration}
              exercises={todayWorkout.exercises}
              date={todayWorkout.date}
              image={todayWorkout.image}
            />

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h4 className="text-lg font-medium mb-4">Ready to start?</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Complete this workout to track your progress and stay on track with your fitness goals.
              </p>
              <div className="space-y-4">
                <Button 
                  className="w-full"
                  onClick={completeWorkout}
                >
                  Mark as Completed <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate("/progress")}
                >
                  View Your Progress
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Workouts Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center">
            <Dumbbell className="mr-2 h-5 w-5" />
            Your Custom Workouts
          </h3>
          <Dialog open={showCreateWorkout} onOpenChange={setShowCreateWorkout}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                New Workout
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workout</DialogTitle>
                <DialogDescription>
                  Create a custom workout tailored to your fitness goals.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Workout Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Upper Body Strength"
                    value={newWorkout.name}
                    onChange={(e) => setNewWorkout({...newWorkout, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your workout..."
                    value={newWorkout.description}
                    onChange={(e) => setNewWorkout({...newWorkout, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="day">Preferred Day</Label>
                  <Select 
                    value={newWorkout.dayOfWeek}
                    onValueChange={(value) => setNewWorkout({...newWorkout, dayOfWeek: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Any day</SelectItem>
                      <SelectItem value="0">Monday</SelectItem>
                      <SelectItem value="1">Tuesday</SelectItem>
                      <SelectItem value="2">Wednesday</SelectItem>
                      <SelectItem value="3">Thursday</SelectItem>
                      <SelectItem value="4">Friday</SelectItem>
                      <SelectItem value="5">Saturday</SelectItem>
                      <SelectItem value="6">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateWorkout(false)}>
                  Cancel
                </Button>
                <Button onClick={createWorkout} disabled={!newWorkout.name}>
                  Create Workout
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {userWorkouts.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <Dumbbell className="h-12 w-12 mx-auto text-gray-400" />
            <h3 className="mt-4 text-lg font-medium">No Custom Workouts Yet</h3>
            <p className="mt-2 text-gray-500 max-w-sm mx-auto">
              Create your first custom workout to start tracking your fitness journey.
            </p>
            <Button 
              className="mt-4" 
              variant="outline"
              onClick={() => setShowCreateWorkout(true)}
            >
              Create Your First Workout
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userWorkouts.map((workout) => (
              <div
                key={workout.id}
                className={`p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${
                  selectedWorkout === workout.id
                    ? 'border-fitness-primary bg-fitness-primary bg-opacity-5'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                onClick={() => {
                  setSelectedWorkout(workout.id);
                  fetchWorkoutExercises(workout.id);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{workout.name}</h4>
                    {workout.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {workout.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {getDayName(workout.day_of_week)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWorkout(workout.id);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Workout Details Section */}
      {selectedWorkout && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">
            {userWorkouts.find(w => w.id === selectedWorkout)?.name} - Exercises
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h4 className="text-lg font-medium mb-4">Add Exercise</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exercise">Select Exercise</Label>
                <Select
                  value={newExerciseForm.exerciseId}
                  onValueChange={(value) => 
                    setNewExerciseForm({...newExerciseForm, exerciseId: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name} ({exercise.muscle_group})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sets">Sets</Label>
                <Input
                  id="sets"
                  type="number"
                  min={1}
                  value={newExerciseForm.sets}
                  onChange={(e) => 
                    setNewExerciseForm({
                      ...newExerciseForm, 
                      sets: parseInt(e.target.value) || 1
                    })
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="reps">Reps</Label>
                <Input
                  id="reps"
                  type="number"
                  min={1}
                  value={newExerciseForm.reps}
                  onChange={(e) => 
                    setNewExerciseForm({
                      ...newExerciseForm, 
                      reps: parseInt(e.target.value) || 1
                    })
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="restTime">Rest Time (seconds)</Label>
                <Input
                  id="restTime"
                  type="number"
                  min={0}
                  value={newExerciseForm.restTime}
                  onChange={(e) => 
                    setNewExerciseForm({
                      ...newExerciseForm, 
                      restTime: parseInt(e.target.value) || 0
                    })
                  }
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Any special instructions or notes"
                  value={newExerciseForm.notes || ""}
                  onChange={(e) => 
                    setNewExerciseForm({...newExerciseForm, notes: e.target.value})
                  }
                />
              </div>
            </div>
            <Button 
              className="mt-4" 
              onClick={addExerciseToWorkout}
              disabled={!newExerciseForm.exerciseId}
            >
              Add to Workout
            </Button>
          </div>
          
          {workoutExercises.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="py-3 px-4 text-left">Exercise</th>
                    <th className="py-3 px-4 text-left">Sets</th>
                    <th className="py-3 px-4 text-left">Reps</th>
                    <th className="py-3 px-4 text-left">Rest</th>
                    <th className="py-3 px-4 text-left">Notes</th>
                    <th className="py-3 px-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {workoutExercises.map((ex) => (
                    <tr key={ex.id}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{ex.exercise.name}</div>
                          <div className="text-xs text-gray-500">{ex.exercise.muscle_group}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">{ex.sets}</td>
                      <td className="py-3 px-4">{ex.reps || '-'}</td>
                      <td className="py-3 px-4">{ex.rest_time}s</td>
                      <td className="py-3 px-4">{ex.notes || '-'}</td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeExerciseFromWorkout(ex.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500">No exercises added to this workout yet.</p>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default WorkoutPlan;
