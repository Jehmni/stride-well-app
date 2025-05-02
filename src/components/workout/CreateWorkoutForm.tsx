
import React, { useState } from "react";
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
import { PlusCircle } from "lucide-react";
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
    } catch (error: any) {
      console.error("Error creating workout:", error);
      toast.error("Failed to create workout");
    }
  };

  return (
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
  );
};

export default CreateWorkoutForm;
