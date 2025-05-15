import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logWorkoutWithExercises } from "@/services/workoutService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, ClipboardList, Activity, Timer, Dumbbell } from "lucide-react";
import { WorkoutExerciseDetail } from "./types";
import { Separator } from "@/components/ui/separator";

interface DetailedWorkoutLogProps {
  workoutId: string;
  workoutTitle: string;
  exercises: WorkoutExerciseDetail[];
  onComplete?: () => void;
}

const formSchema = z.object({
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(180, "Duration cannot exceed 180 minutes"),
  caloriesBurned: z.union([z.number(), z.string()]).optional().transform(val => {
    if (typeof val === 'string' && val === '') return undefined;
    return typeof val === 'string' ? parseInt(val) : val;
  }),
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
});

// Rating options with emoji
const ratingOptions = [
  { value: 1, label: "😓 Very Hard" },
  { value: 2, label: "😰 Hard" },
  { value: 3, label: "😐 Moderate" },
  { value: 4, label: "😊 Easy" },
  { value: 5, label: "😁 Very Easy" },
];

const DetailedWorkoutLog: React.FC<DetailedWorkoutLogProps> = ({ 
  workoutId, 
  workoutTitle, 
  exercises,
  onComplete 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      duration: 30,
      caloriesBurned: undefined,
      rating: 3,
      notes: "",
    },
  });

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast.error("You must be logged in to log a workout");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get completed exercises from local storage
      const completedExercises = JSON.parse(localStorage.getItem(`completedExercises-${workoutId}`) || '{}');
      
      // Prepare exercise logs
      const exerciseLogs = Object.entries(completedExercises)
        .filter(([_, data]) => data && typeof data === 'object' && data.completed)
        .map(([exerciseId, data]: [string, any]) => ({
          exercise_id: exerciseId,
          sets_completed: data.details?.sets_completed || 0,
          reps_completed: data.details?.reps_completed || 0,
          weight_used: data.details?.weight_used || null,
          notes: data.details?.notes || null
        }));
      
      // Check if any exercises were completed
      if (exerciseLogs.length === 0) {
        toast.error("Please complete at least one exercise before logging the workout");
        return;
      }
      
      // Log workout with exercises
      const result = await logWorkoutWithExercises({
        userId: user.id,
        workoutId,
        workoutTitle,
        duration: values.duration,
        caloriesBurned: values.caloriesBurned || null,
        notes: values.notes || null,
        rating: values.rating,
        exercises: exerciseLogs
      });
      
      if (result) {
        toast.success("Workout logged successfully!");
        
        // Clear completed exercises from local storage
        localStorage.removeItem(`completedExercises-${workoutId}`);
        
        // Close the sheet and call the onComplete callback
        setIsOpen(false);
        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error("Failed to log workout");
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      toast.error("Failed to log your workout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="default">
          <ClipboardList className="mr-1 h-4 w-4" /> Log Workout
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log Workout: {workoutTitle}</SheetTitle>
          <SheetDescription>
            Record details for your completed workout
          </SheetDescription>
        </SheetHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel>Workout Duration (minutes)</FormLabel>
                      <span className="text-sm font-medium">{field.value} min</span>
                    </div>
                    <FormControl>
                      <Slider
                        min={5}
                        max={180}
                        step={5}
                        defaultValue={[30]}
                        onValueChange={(value) => field.onChange(value[0])}
                        value={[field.value]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="caloriesBurned"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Calories Burned (optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter calories"
                        {...field}
                        value={field.value || ''}
                        onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>How difficult was this workout?</FormLabel>
                    <div className="grid grid-cols-5 gap-2">
                      {ratingOptions.map((option) => (
                        <Button
                          key={option.value}
                          type="button"
                          variant={field.value === option.value ? "default" : "outline"}
                          className={`h-14 px-2 flex flex-col justify-center ${field.value === option.value ? 'bg-fitness-primary text-white' : ''}`}
                          onClick={() => field.onChange(option.value)}
                        >
                          <span className="text-lg">{option.label.split(' ')[0]}</span>
                          <span className="text-xs whitespace-nowrap">{option.label.split(' ').slice(1).join(' ')}</span>
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="How did the workout feel? What could be improved?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-4" />
              
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Dumbbell className="h-4 w-4 mr-1" />
                  Completed Exercises
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  Exercise details from your workout will be included automatically.
                </div>
              </div>
            </div>
            
            <SheetFooter className="flex-col sm:flex-row gap-2">
              <SheetClose asChild>
                <Button variant="outline" className="w-full">Cancel</Button>
              </SheetClose>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logging..." : "Save Workout Log"}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default DetailedWorkoutLog;
