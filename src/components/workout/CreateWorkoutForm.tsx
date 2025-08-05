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
    if (!newExercise.name) return;
    const { data, error } = await supabase
      .from("exercises")
      .insert(newExercise)
      .select();
    if (!error && data && data[0]) {
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
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          name: newWorkout.name,
          description: newWorkout.description || null,
          day_of_week: newWorkout.dayOfWeek ? parseInt(newWorkout.dayOfWeek) : null,
          user_id: userId
        })
        .select();
        
      if (error) throw error;
      
      toast.success("Workout created successfully!");
      if (data && data.length > 0) {
        onWorkoutCreated(data[0] as UserWorkout);
      }
      setShowCreateWorkout(false);
      setNewWorkout({
        name: "",
        description: "",
        dayOfWeek: "0"
      });
      setWorkoutExercises([]);

      for (let i = 0; i < workoutExercises.length; i++) {
        const ex = workoutExercises[i];
        await supabase.from('workout_exercises').insert({
          workout_id: data[0].id,
          exercise_id: ex.id,
          sets: ex.sets,
          reps: ex.reps,
          weight_kg: ex.weight_kg || null,
          comments: ex.comments || null,
          notes: ex.notes,
          order_in_workout: i
        });
      }
    } catch (error: any) {
      console.error("Error creating workout:", error);
      toast.error("Failed to create workout");
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
                <Input placeholder="Exercise Name" value={newExercise.name} onChange={e => setNewExercise({ ...newExercise, name: e.target.value })} />
                <Input placeholder="Muscle Group" value={newExercise.muscle_group} onChange={e => setNewExercise({ ...newExercise, muscle_group: e.target.value })} />
                <Input placeholder="Equipment (optional)" value={newExercise.equipment_required} onChange={e => setNewExercise({ ...newExercise, equipment_required: e.target.value })} />
                <Select value={newExercise.difficulty} onValueChange={val => setNewExercise({ ...newExercise, difficulty: val })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleCreateNewExercise}>Add Exercise</Button>
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
                  <Input type="number" min={0} step="0.1" className="w-20" placeholder="kg" value={ex.weight_kg} onChange={e => updateExerciseField(ex.tempId, 'weight_kg', e.target.value)} />
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
