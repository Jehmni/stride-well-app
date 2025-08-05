
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Exercise } from "@/models/models";
import { NewExerciseFormData, WorkoutExerciseDetail } from "./types";

interface WorkoutExerciseFormProps {
  selectedWorkout: string;
  exercises: Exercise[];
  workoutExercises: WorkoutExerciseDetail[];
  onExerciseAdded: (exercise: WorkoutExerciseDetail) => void;
}

const WorkoutExerciseForm: React.FC<WorkoutExerciseFormProps> = ({ 
  selectedWorkout, 
  exercises, 
  workoutExercises,
  onExerciseAdded 
}) => {
  const [newExerciseForm, setNewExerciseForm] = useState<NewExerciseFormData>({
    exerciseId: "",
    sets: 3,
    reps: 10,
    duration: null,
    restTime: 60,
    notes: null,
  });

  const addExerciseToWorkout = async () => {
    if (!selectedWorkout || !newExerciseForm.exerciseId) return;
    
    try {
      // Get the next order position
          const nextPosition = workoutExercises.length > 0 
        ? Math.max(...workoutExercises.map(ex => ex.order_in_workout)) + 1
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
          order_in_workout: nextPosition,
          notes: newExerciseForm.notes || null
        })
        .select(`
          *,
          exercise:exercises(*)
        `);
        
      if (error) throw error;
      
      toast.success("Exercise added to workout!");
      if (data && data.length > 0) {
        // Make sure the exercise has the equipment_required field
        const exercise = data[0] as any;
        const processedExercise: WorkoutExerciseDetail = {
          ...exercise,
          exercise: {
            ...exercise.exercise,
            equipment_required: exercise.exercise?.equipment_required || null
          }
        };
        
        onExerciseAdded(processedExercise);
      }
      
      // Reset form
      setNewExerciseForm({
        exerciseId: "",
        sets: 3,
        reps: 10,
        duration: null,
        restTime: 60,
        notes: null,
      });
    } catch (error: any) {
      console.error("Error adding exercise to workout:", error);
      toast.error("Failed to add exercise to workout");
    }
  };

  return (
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
  );
};

export default WorkoutExerciseForm;
