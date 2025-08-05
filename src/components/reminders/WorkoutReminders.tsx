import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { TimeInput } from "@/components/ui/time-input";
import {
  isNotificationSupported,
  requestNotificationPermission,
  registerReminderServiceWorker,
  scheduleLocalNotification
} from "@/services/notificationService";

interface Reminder {
  id: string;
  user_id: string;
  title: string;
  workout_plan_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  is_enabled: boolean;
  created_at: string;
}

const WorkoutReminders: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("08:00");
  const [title, setTitle] = useState<string>("Workout Reminder");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState<string>("weekly");
  const [workoutPlans, setWorkoutPlans] = useState<any[]>([]);
  const [selectedWorkoutPlanId, setSelectedWorkoutPlanId] = useState<string | undefined>(undefined);
  const [notificationsSupported, setNotificationsSupported] = useState(false);
  const [notificationsPermission, setNotificationsPermission] = useState(false);

  useEffect(() => {
    // Check if notifications are supported and initialize service worker
    const checkNotificationSupport = async () => {
      const supported = isNotificationSupported();
      setNotificationsSupported(supported);
      
      if (supported) {
        // Register service worker
        await registerReminderServiceWorker();
        
        // Check existing permission
        const permissionState = Notification.permission;
        setNotificationsPermission(permissionState === 'granted');
      }
    };
    
    checkNotificationSupport();
    
    if (user) {
      fetchReminders();
      fetchWorkoutPlans();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('workout_reminders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to load your reminders');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkoutPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id, title')
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    }
  };

  const handleCreateReminder = async () => {
    if (!user?.id || !date) {
      toast.error('Missing required information');
      return;
    }

    try {
      setSaving(true);

      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('workout_reminders')
        .insert({
          user_id: user.id,
          title,
          workout_plan_id: selectedWorkoutPlanId,
          scheduled_date: formattedDate,
          scheduled_time: time,
          is_recurring: isRecurring,
          recurrence_pattern: isRecurring ? recurrencePattern : null,
          is_enabled: true
        })
        .select()
        .single();

      if (error) throw error;
      
      // Schedule the notification if permission is granted
      if (notificationsSupported && notificationsPermission) {
        const reminderTime = new Date(`${formattedDate}T${time}`);
        
        await scheduleLocalNotification(
          title,
          {
            body: selectedWorkoutPlanId 
              ? `Time for your workout: ${getWorkoutPlanTitle(selectedWorkoutPlanId)}`
              : 'Time for your workout!',
            timestamp: reminderTime.getTime(),
            workoutPlanId: selectedWorkoutPlanId
          }
        );
      } else if (notificationsSupported && !notificationsPermission) {
        // Ask for permission
        const granted = await requestNotificationPermission();
        setNotificationsPermission(granted);
        
        if (granted) {
          // If permission was just granted, schedule the notification
          const reminderTime = new Date(`${formattedDate}T${time}`);
          
          await scheduleLocalNotification(
            title,
            {
              body: selectedWorkoutPlanId 
                ? `Time for your workout: ${getWorkoutPlanTitle(selectedWorkoutPlanId)}`
                : 'Time for your workout!',
              timestamp: reminderTime.getTime(),
              workoutPlanId: selectedWorkoutPlanId
            }
          );
        }
      }
      
      setReminders([data, ...reminders]);
      resetForm();
      toast.success('Reminder created successfully');
      
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error('Failed to create reminder');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReminder = async (id: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('workout_reminders')
        .update({ is_enabled: !isEnabled })
        .eq('id', id);

      if (error) throw error;
      
      setReminders(reminders.map(reminder => 
        reminder.id === id ? { ...reminder, is_enabled: !isEnabled } : reminder
      ));
      
      toast.success(`Reminder ${!isEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error('Failed to update reminder');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('workout_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReminders(reminders.filter(reminder => reminder.id !== id));
      toast.success('Reminder deleted');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const resetForm = () => {
    setTitle("Workout Reminder");
    setDate(new Date());
    setTime("08:00");
    setIsRecurring(false);
    setRecurrencePattern("weekly");
    setSelectedWorkoutPlanId(undefined);
  };

  const formatRecurrencePattern = (pattern: string) => {
    switch (pattern) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return 'Every week';
      case 'weekdays':
        return 'Weekdays';
      case 'monthly':
        return 'Monthly';
      default:
        return pattern;
    }
  };

  const getWorkoutPlanTitle = (id?: string) => {
    if (!id) return 'None';
    const plan = workoutPlans.find(plan => plan.id === id);
    return plan ? plan.title : 'Unknown workout';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Schedule a Workout Reminder
          </CardTitle>
          <CardDescription>
            Create reminders for your workouts to stay on track with your fitness goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificationsSupported === false && (
            <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 p-3 rounded mb-4 text-sm">
              Your browser doesn't support notifications. Reminders will be stored but you won't receive alerts.
            </div>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="reminder-title">Reminder Title</Label>
              <Input
                id="reminder-title"
                placeholder="What's this reminder for?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label>Workout Plan (Optional)</Label>
              <Select value={selectedWorkoutPlanId} onValueChange={setSelectedWorkoutPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a workout plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific workout</SelectItem>
                  {workoutPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid gap-2">
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <TimeInput
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring">Recurring reminder</Label>
            </div>

            {isRecurring && (
              <div className="grid gap-2">
                <Label>Recurrence Pattern</Label>
                <Select value={recurrencePattern} onValueChange={setRecurrencePattern}>
                  <SelectTrigger>
                    <SelectValue placeholder="How often to repeat?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekdays">Weekdays</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleCreateReminder}
            disabled={saving || !title || !date || !time}
            className="w-full"
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Reminder
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Reminders</h3>
        
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="text-center py-10 border rounded-lg bg-muted/10">
            <Bell className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-lg mb-1">No reminders yet</h3>
            <p className="text-muted-foreground">Schedule your first workout reminder to stay on track</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reminders.map(reminder => (
              <Card key={reminder.id}>
                <CardHeader className="py-3">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{reminder.title}</CardTitle>
                    <Switch
                      checked={reminder.is_enabled}
                      onCheckedChange={() => handleToggleReminder(reminder.id, reminder.is_enabled)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(reminder.scheduled_date), "MMMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {reminder.scheduled_time.substring(0, 5)}
                        </span>
                      </div>
                    </div>
                    
                    {reminder.is_recurring && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Repeats: {formatRecurrencePattern(reminder.recurrence_pattern || '')}</span>
                      </div>
                    )}
                    
                    {reminder.workout_plan_id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Workout: {getWorkoutPlanTitle(reminder.workout_plan_id)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="py-3">
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="ml-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutReminders; 