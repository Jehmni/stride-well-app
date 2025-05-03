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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logWorkoutCompletion } from "@/services/workoutService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Check, ClipboardList, Activity, Timer, ArrowRight } from "lucide-react";
import ExerciseLogForm from "./ExerciseLogForm";
import { WorkoutExerciseDetail } from "./types";

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

const DetailedWorkoutLog: React.FC<DetailedWorkoutLogProps> = ({ 
  workoutId, 
  workoutTitle, 
  exercises,
  onComplete 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "exercises">("summary");
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  
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
      const logId = await logWorkoutCompletion(
        user.id,
        workoutId,
        values.duration,
        values.caloriesBurned || null,
        values.notes || null,
        values.rating
      );
      
      if (logId) {
        setWorkoutLogId(logId);
        toast.success("Workout log created! Now let's log your exercises.");
        setActiveTab("exercises");
      } else {
        toast.error("Failed to create workout log");
      }
    } catch (error) {
      console.error("Error logging workout:", error);
      toast.error("Failed to log your workout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExerciseComplete = (exerciseId: string) => {
    setCompletedExercises(prev => [...prev, exerciseId]);
  };

  const allExercisesCompleted = exercises.length > 0 && 
    completedExercises.length === exercises.length;

  const handleFinish = () => {
    setIsOpen(false);
    if (onComplete) {
      onComplete();
    }
    toast.success("Workout completed and logged successfully!");
  };

  // Rating options with emoji
  const ratingOptions = [
    { value: 1, label: "😓 Very Hard" },
    { value: 2, label: "😰 Hard" },
    { value: 3, label: "😐 Moderate" },
    { value: 4, label: "😊 Easy" },
    { value: 5, label: "😁 Very Easy" },
  ];

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
            Record your workout details and track your progress
          </SheetDescription>
        </SheetHeader>
        
        <div className="py-4">
          <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as "summary" | "exercises")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary" disabled={!workoutLogId && activeTab === "exercises"}>
                <Activity className="mr-2 h-4 w-4" /> Workout Summary
              </TabsTrigger>
              <TabsTrigger value="exercises" disabled={!workoutLogId}>
                <Timer className="mr-2 h-4 w-4" /> Log Exercises
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary" className="space-y-4 mt-4">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (minutes)</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Slider
                              value={[field.value]}
                              min={5}
                              max={180}
                              step={5}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>5 min</span>
                              <span>{field.value} minutes</span>
                              <span>180 min</span>
                            </div>
                          </div>
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
                        <FormControl>
                          <div className="grid grid-cols-5 gap-2">
                            {ratingOptions.map((option) => (
                              <Button
                                key={option.value}
                                type="button"
                                variant={field.value === option.value ? "default" : "outline"}
                                className="h-14 flex flex-col"
                                onClick={() => field.onChange(option.value)}
                              >
                                <div className="text-lg">{option.label.split(' ')[0]}</div>
                                <div className="text-xs mt-1">
                                  {option.label.split(' ').slice(1).join(' ')}
                                </div>
                              </Button>
                            ))}
                          </div>
                        </FormControl>
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
                            placeholder="How did this workout feel? What went well or what could improve?"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      "Saving..."
                    ) : (
                      <>Continue to Exercise Log <ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="exercises" className="mt-4">
              {workoutLogId ? (
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Complete {completedExercises.length}/{exercises.length} exercises
                  </div>
                  
                  <Separator />
                  
                  {exercises.map((exercise) => (
                    <div key={exercise.exercise_id} className="mt-4">
                      {completedExercises.includes(exercise.exercise_id) ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md flex items-center">
                          <Check className="text-green-600 dark:text-green-400 mr-2" />
                          <span><strong>{exercise.exercise.name}</strong> completed</span>
                        </div>
                      ) : (
                        <ExerciseLogForm
                          workoutLogId={workoutLogId}
                          exerciseId={exercise.exercise_id}
                          exerciseName={exercise.exercise.name}
                          recommendedSets={exercise.sets}
                          recommendedReps={`${exercise.reps || '10-12'}`}
                          onComplete={() => handleExerciseComplete(exercise.exercise_id)}
                        />
                      )}
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <Button
                    onClick={handleFinish}
                    className="w-full"
                    variant={allExercisesCompleted ? "default" : "outline"}
                    disabled={!allExercisesCompleted}
                  >
                    {allExercisesCompleted ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Complete Workout Log
                      </>
                    ) : (
                      `Log remaining exercises (${exercises.length - completedExercises.length} left)`
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-40 text-center">
                  <div>
                    <p className="text-muted-foreground">
                      Please complete the workout summary first
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setActiveTab("summary")}
                    >
                      Back to Summary
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <SheetFooter className="mt-4">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default DetailedWorkoutLog;
