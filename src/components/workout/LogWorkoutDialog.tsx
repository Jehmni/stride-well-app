import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logWorkoutCompletion } from "@/services/workoutService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface LogWorkoutProps {
  workoutId: string;
  workoutTitle: string;
  onComplete?: () => void;
}

const formSchema = z.object({
  duration: z.number().min(5, "Duration must be at least 5 minutes").max(180, "Duration cannot exceed 180 minutes"),
  caloriesBurned: z.number().optional(),
  rating: z.number().min(1).max(5),
  notes: z.string().optional(),
});

const LogWorkoutDialog: React.FC<LogWorkoutProps> = ({ workoutId, workoutTitle, onComplete }) => {
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
      await logWorkoutCompletion(
        user.id,
        workoutId,
        values.duration,
        values.caloriesBurned || null,
        values.notes || null,
        values.rating
      );
      
      toast.success("Workout logged successfully!");
      setIsOpen(false);
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      toast.error("Failed to log your workout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Check className="mr-1 h-4 w-4" /> Complete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Workout Completion</DialogTitle>
          <DialogDescription>
            Record your completed workout: {workoutTitle}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[field.value]}
                        min={5}
                        max={180}
                        step={5}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="flex-1"
                      />
                      <span className="w-12 text-center text-sm">{field.value}</span>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="caloriesBurned"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calories Burned (optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="Enter calories" 
                      {...field} 
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Workout Rating (1-5)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[field.value]}
                        min={1}
                        max={5}
                        step={1}
                        onValueChange={(value) => field.onChange(value[0])}
                        className="flex-1"
                      />
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-4 w-4 ${star <= field.value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-gray-300'}`}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </FormControl>
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
                      placeholder="How did it go? Any achievements or challenges?"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Log Workout"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default LogWorkoutDialog;
