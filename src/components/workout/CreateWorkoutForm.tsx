import React, { useState, useEffect } from "react";
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
import { PlusCircle, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewWorkoutFormData, UserWorkout } from "./types";

interface CreateWorkoutFormProps {
  userId: string | undefined;
  onWorkoutCreated: (workout: UserWorkout) => void;
}

const CreateWorkoutForm: React.FC<CreateWorkoutFormProps> = ({ userId, onWorkoutCreated }) => {
  const [showCreateWorkout, setShowCreateWorkout] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newWorkout, setNewWorkout] = useState<NewWorkoutFormData>({
    name: "",
    description: "",
    dayOfWeek: "0"
  });
  const [exercises, setExercises] = useState<any[]>([]);
  const [workoutExercises, setWorkoutExercises] = useState<any[]>([]);
  const [showNewExercise, setShowNewExercise] = useState(false);
  const [newExercise, setNewExercise] = useState({
    name: "",
    muscle_group: "",
    difficulty: "Beginner",
    exercise_type: "strength",
    equipment_required: "",
  });
  // Field-level validation errors for the inline form
  const [newExerciseErrors, setNewExerciseErrors] = useState<{ 
    name?: string; 
    muscle_group?: string; 
    difficulty?: string; 
    exercise_type?: string; 
    general?: string;
  }>({});

  useEffect(() => {
    const fetchExercises = async () => {
      const { data, error } = await supabase.from("exercises").select("*");
      if (!error && data) setExercises(data);
    };
    fetchExercises();
  }, []);

  const addExerciseToWorkout = (exercise: any) => {
    setWorkoutExercises([
      ...workoutExercises,
      {
        ...exercise,
        sets: 3,
        reps: 10,
        weight_kg: '',
        comments: '',
        notes: '',
        tempId: Math.random().toString(36).slice(2),
      },
    ]);
  };

  const handleCreateNewExercise = async () => {
    // Simple client-side validation before hitting the API
    const nextErrors: typeof newExerciseErrors = {};
    if (!newExercise.name.trim()) {
      nextErrors.name = "Exercise name is required";
    }
    if (!newExercise.muscle_group.trim()) {
      nextErrors.muscle_group = "Muscle group is required";
    }
    if (!newExercise.difficulty) {
      nextErrors.difficulty = "Difficulty is required";
    }
    if (!newExercise.exercise_type) {
      nextErrors.exercise_type = "Exercise type is required";
    }
    if (Object.keys(nextErrors).length > 0) {
      setNewExerciseErrors(nextErrors);
      toast.error("Please fill in the required fields");
      return;
    }

    setIsCreatingExercise(true);
    try {
      // Normalize and derive values to satisfy NOT NULL constraints and checks in public.exercises
      // - difficulty must be one of: 'beginner' | 'intermediate' | 'advanced'
      const difficultyLower = newExercise.difficulty.toLowerCase();
      // - muscle_groups is a required text[]; store a single-element array from muscle_group input
      const muscleGroup = newExercise.muscle_group.trim();
      // - category is required; map exercise_type to a category. Treat cardio-like types as 'cardio', else 'strength'
      const typeLower = newExercise.exercise_type.toLowerCase();
      const category: 'cardio' | 'strength' = ['cardio', 'hiit', 'endurance'].includes(typeLower) ? 'cardio' : 'strength';

      const { data, error } = await supabase
        .from("exercises")
        .insert({
          // Keep legacy singular field for compatibility with existing queries/components
          name: newExercise.name.trim(),
          muscle_group: muscleGroup,
          // Provide required array field and category to satisfy NOT NULL constraints
          muscle_groups: [muscleGroup.toLowerCase()],
          category,
          // Normalize difficulty fields to pass CHECK constraints; keep exercise_type as chosen
          difficulty: difficultyLower,
          difficulty_level: difficultyLower,
          exercise_type: newExercise.exercise_type,
          // Optional free-text field
          equipment_required: newExercise.equipment_required.trim() || null
        })
        .select();

      if (error) {
        // Map common database errors to user-friendly messages and inline field errors
        const friendlyErrors: typeof newExerciseErrors = {};
        if (error.code === '23502') {
          // NOT NULL violation: parse column name from message
          const msg = (error.message || '').toLowerCase();
          if (msg.includes('muscle_groups')) {
            friendlyErrors.muscle_group = "Muscle group is required";
          } else if (msg.includes('category')) {
            friendlyErrors.exercise_type = "Exercise type/category is required";
          } else if (msg.includes('difficulty')) {
            friendlyErrors.difficulty = "Difficulty is required";
          } else if (msg.includes('name')) {
            friendlyErrors.name = "Exercise name is required";
          } else {
            friendlyErrors.general = "Required field missing. Please complete all required fields.";
          }
          toast.error(friendlyErrors.general || "Please complete the highlighted fields");
          setNewExerciseErrors(friendlyErrors);
        } else if (error.code === '23514') {
          // CHECK constraint, e.g. difficulty enum
          if ((error.message || '').toLowerCase().includes('difficulty')) {
            friendlyErrors.difficulty = "Choose one: Beginner, Intermediate, Advanced";
            toast.error("Invalid difficulty. Choose Beginner, Intermediate, or Advanced.");
            setNewExerciseErrors(friendlyErrors);
          } else {
            toast.error("Invalid value provided. Please review your entries.");
          }
        } else {
          toast.error("Failed to create exercise. Please try again.");
        }
        return;
      }

      if (data && data[0]) {
        // Clear any prior field errors on success
        setNewExerciseErrors({});
        setExercises([...exercises, data[0]]);
        addExerciseToWorkout(data[0]);
        setShowNewExercise(false);
        setNewExercise({
          name: "",
          muscle_group: "",
          difficulty: "Beginner",
          exercise_type: "strength",
          equipment_required: "",
        });
        toast.success(`Exercise "${data[0].name}" created and added to workout!`);
      }
    } catch (error: any) {
      console.error("Error creating exercise:", error);
      toast.error("Failed to create exercise: " + (error.message || "Unknown error"));
    } finally {
      setIsCreatingExercise(false);
    }
  };

  const removeExercise = (tempId: string) => {
    setWorkoutExercises(workoutExercises.filter((ex) => ex.tempId !== tempId));
  };

  const updateExerciseField = (tempId: string, field: string, value: any) => {
    setWorkoutExercises(
      workoutExercises.map((ex) =>
        ex.tempId === tempId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const moveExercise = (tempId: string, direction: 'up' | 'down') => {
    const idx = workoutExercises.findIndex((ex) => ex.tempId === tempId);
    if (idx < 0) return;
    const newArr = [...workoutExercises];
    if (direction === 'up' && idx > 0) {
      [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
    } else if (direction === 'down' && idx < newArr.length - 1) {
      [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
    }
    setWorkoutExercises(newArr);
  };

  const createWorkout = async () => {
    if (!userId) return;
    
    try {
      // First create the workout
      const { data: workoutData, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          name: newWorkout.name,
          description: newWorkout.description || null,
          day_of_week: newWorkout.dayOfWeek ? parseInt(newWorkout.dayOfWeek) : null,
          user_id: userId
        })
        .select();
        
      if (workoutError) throw workoutError;
      if (!workoutData || workoutData.length === 0) throw new Error("Failed to create workout");

      const createdWorkout = workoutData[0];
      
      // Then create the workout exercises if any
      if (workoutExercises.length > 0) {
        const exerciseInserts = workoutExercises.map((ex, index) => ({
          workout_id: createdWorkout.id,
          exercise_id: ex.id,
          sets: ex.sets || 3,
          reps: ex.reps || 10,
          duration: ex.duration || null,
          rest_time: ex.rest_time || 60,
          notes: ex.notes || null,
          // Provide both fields to satisfy mixed schemas where order_in_workout is NOT NULL
          order_in_workout: index,
          order_position: index
        }));

        const { error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert(exerciseInserts);
          
        if (exerciseError) {
          console.error("Error creating workout exercises:", exerciseError);
          throw exerciseError;
        }
      }
      
      toast.success(`Workout "${newWorkout.name}" created successfully with ${workoutExercises.length} exercises!`);
      onWorkoutCreated(createdWorkout as UserWorkout);
      
      // Reset form
      setShowCreateWorkout(false);
      setNewWorkout({
        name: "",
        description: "",
        dayOfWeek: "0"
      });
      setWorkoutExercises([]);
    } catch (error: any) {
      console.error("Error creating workout:", error);
      toast.error("Failed to create workout: " + (error.message || "Unknown error"));
    }
  };

  return (
    <Dialog open={showCreateWorkout} onOpenChange={setShowCreateWorkout}>
                  <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                <Plus className="h-4 w-4 mr-2" />
                New Workout
              </Button>
            </DialogTrigger>
      {/* Constrain dialog height and use column layout so footer stays visible and middle scrolls */}
      <DialogContent className="max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Workout</DialogTitle>
          <DialogDescription>
            Create a custom workout tailored to your fitness goals.
          </DialogDescription>
        </DialogHeader>
        {/* Make the main form area scrollable to avoid buttons going off-screen when many exercises are added */}
        <div className="space-y-4 py-4 overflow-y-auto pr-2 flex-1">
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
          <div className="space-y-2">
            <Label>Exercises in this Workout</Label>
            <div className="flex gap-2 mb-2">
              <Select onValueChange={val => {
                const ex = exercises.find(e => e.id === val);
                if (ex) addExerciseToWorkout(ex);
              }}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select exercise from list" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name} ({ex.muscle_group})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => setShowNewExercise(v => !v)}>
                + New Exercise
              </Button>
            </div>
            {showNewExercise && (
              <div className="bg-muted p-3 rounded mb-2 space-y-2">
                <Input 
                  placeholder="Exercise Name" 
                  value={newExercise.name} 
                  onChange={e => {
                    setNewExercise({ ...newExercise, name: e.target.value });
                    if (newExerciseErrors.name) setNewExerciseErrors({ ...newExerciseErrors, name: undefined });
                  }} 
                />
                {newExerciseErrors.name && (<div className="text-sm text-red-500">{newExerciseErrors.name}</div>)}
                <Input 
                  placeholder="Muscle Group" 
                  value={newExercise.muscle_group} 
                  onChange={e => {
                    setNewExercise({ ...newExercise, muscle_group: e.target.value });
                    if (newExerciseErrors.muscle_group) setNewExerciseErrors({ ...newExerciseErrors, muscle_group: undefined });
                  }} 
                />
                {newExerciseErrors.muscle_group && (<div className="text-sm text-red-500">{newExerciseErrors.muscle_group}</div>)}
                <Input 
                  placeholder="Equipment (optional)" 
                  value={newExercise.equipment_required} 
                  onChange={e => setNewExercise({ ...newExercise, equipment_required: e.target.value })} 
                />
                <Select 
                  value={newExercise.difficulty} 
                  onValueChange={val => {
                    setNewExercise({ ...newExercise, difficulty: val });
                    if (newExerciseErrors.difficulty) setNewExerciseErrors({ ...newExerciseErrors, difficulty: undefined });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                {newExerciseErrors.difficulty && (<div className="text-sm text-red-500">{newExerciseErrors.difficulty}</div>)}
                {newExerciseErrors.general && (<div className="text-sm text-red-500">{newExerciseErrors.general}</div>)}
                <Button 
                  type="button" 
                  onClick={handleCreateNewExercise}
                  disabled={isCreatingExercise}
                >
                  {isCreatingExercise ? "Adding..." : "Add Exercise"}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {workoutExercises.length === 0 && <div className="text-muted-foreground">No exercises added yet.</div>}
              {workoutExercises.map((ex, idx) => (
                <div key={ex.tempId} className="flex flex-wrap items-center gap-2 bg-secondary/50 p-2 rounded">
                  <span className="font-medium flex-1 min-w-[120px]">{ex.name} <span className="text-xs text-muted-foreground">({ex.muscle_group})</span></span>
                  <Input type="number" min={1} className="w-16" value={ex.sets} onChange={e => updateExerciseField(ex.tempId, 'sets', Number(e.target.value))} />
                  <span>sets</span>
                  <Input type="number" min={1} className="w-16" value={ex.reps} onChange={e => updateExerciseField(ex.tempId, 'reps', Number(e.target.value))} />
                  <span>reps</span>
                  {/* Weight input (use 'Weight' placeholder to avoid duplicate 'kg' text next to unit label) */}
                  <Input 
                    type="number" 
                    min={0} 
                    step="0.1" 
                    className="w-20" 
                    placeholder="Weight" 
                    value={ex.weight_kg} 
                    onChange={e => updateExerciseField(ex.tempId, 'weight_kg', e.target.value)} 
                  />
                  <span>kg</span>
                  <Input className="w-32" placeholder="Comments" value={ex.comments} onChange={e => updateExerciseField(ex.tempId, 'comments', e.target.value)} />
                  <Button size="icon" variant="ghost" onClick={() => moveExercise(ex.tempId, 'up')} disabled={idx === 0}>↑</Button>
                  <Button size="icon" variant="ghost" onClick={() => moveExercise(ex.tempId, 'down')} disabled={idx === workoutExercises.length - 1}>↓</Button>
                  <Button size="icon" variant="destructive" onClick={() => removeExercise(ex.tempId)}>✕</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Footer remains anchored at the bottom of the dialog */}
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
  );
};

export default CreateWorkoutForm;
