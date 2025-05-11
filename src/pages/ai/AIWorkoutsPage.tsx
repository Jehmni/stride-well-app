import { AIWorkoutList } from "@/components/ai/AIWorkoutList";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

export function AIWorkoutsPage() {
  return (
    <DashboardLayout title="AI Workouts">
      <AIWorkoutList />
    </DashboardLayout>
  );
} 