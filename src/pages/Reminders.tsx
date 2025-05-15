import React from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WorkoutReminders from "@/components/reminders/WorkoutReminders";
import { Bell } from "lucide-react";

const Reminders: React.FC = () => {
  return (
    <DashboardLayout title="Workout Reminders">
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Set up reminders for your workouts to stay consistent with your fitness routine.
        </p>
      </div>
      
      <WorkoutReminders />
    </DashboardLayout>
  );
};

export default Reminders; 