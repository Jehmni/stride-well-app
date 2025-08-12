import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { TimeInput } from '@/components/ui/time-input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Zap,
  Brain,
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format, parseISO, addDays, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  scheduleReminder, 
  cancelReminder, 
  updateReminder, 
  testNotification 
} from '@/services/notificationService';
import { calendarManager } from '@/services/calendarService';
import { smartReminderService } from '@/services/smartReminderService';
import { InAppNotificationData } from '@/components/ui/InAppNotification';

interface WorkoutReminder {
  id: string;
  title: string;
  workout_plan_id?: string;
  scheduled_date: string;
  scheduled_time: string;
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthdays' | 'monthly';
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  calendar_event_id?: string;
  suggested_optimization?: {
    newTime: string;
    newDays: number[];
    confidence: number;
    reasoning: string;
  };
}

interface WorkoutPlan {
  id: string;
  title: string;
  description?: string;
}

const EnhancedWorkoutReminders: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<WorkoutReminder[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<WorkoutReminder | null>(null);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [calendarServices, setCalendarServices] = useState<any[]>([]);
  const [activeCalendarService, setActiveCalendarService] = useState<any>(null);
  const [isCalendarSyncing, setIsCalendarSyncing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    workout_plan_id: '',
    scheduled_date: new Date(),
    scheduled_time: '07:00',
    is_recurring: false,
    recurrence_pattern: 'weekly' as const,
    is_enabled: true,
  });

  useEffect(() => {
    if (user) {
      fetchReminders();
      fetchWorkoutPlans();
      initializeCalendarServices();
    }
  }, [user]);

  const fetchReminders = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      setReminders(data || []);
      
      // Sync with service worker
      data?.forEach(reminder => {
        if (reminder.is_enabled) {
          scheduleReminder(reminder);
        }
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to fetch reminders');
    }
  };

  const fetchWorkoutPlans = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('id, title, description')
        .eq('user_id', user.id);

      if (error) throw error;
      setWorkoutPlans(data || []);
    } catch (error) {
      console.error('Error fetching workout plans:', error);
    }
  };

  const initializeCalendarServices = () => {
    const availableServices = calendarManager.getAvailableServices();
    setCalendarServices(availableServices);
    
    if (availableServices.length > 0) {
      setActiveCalendarService(availableServices[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      const reminderData = {
        ...formData,
        user_id: user.id,
        scheduled_date: format(formData.scheduled_date, 'yyyy-MM-dd'),
      };

      if (editingReminder) {
        // Update existing reminder
        const { error } = await supabase
          .from('workout_reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;

        // Update in service worker
        await updateReminder(editingReminder.id, reminderData);
        
        toast.success('Reminder updated successfully');
      } else {
        // Create new reminder
        const { data, error } = await supabase
          .from('workout_reminders')
          .insert([reminderData])
          .select()
          .single();

        if (error) throw error;

        // Schedule in service worker
        await scheduleReminder(data);
        
        toast.success('Reminder created successfully');
      }

      // Sync with calendar if available
      if (activeCalendarService?.isAuthenticated) {
        await syncReminderToCalendar(editingReminder || reminderData);
      }

      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast.error('Failed to save reminder');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleReminder = async (reminder: WorkoutReminder) => {
    try {
      const updatedReminder = { ...reminder, is_enabled: !reminder.is_enabled };
      
      const { error } = await supabase
        .from('workout_reminders')
        .update({ is_enabled: updatedReminder.is_enabled })
        .eq('id', reminder.id);

      if (error) throw error;

      // Update in service worker
      if (updatedReminder.is_enabled) {
        await scheduleReminder(updatedReminder);
      } else {
        await cancelReminder(reminder.id);
      }

      // Update calendar
      if (activeCalendarService?.isAuthenticated) {
        if (updatedReminder.is_enabled) {
          await syncReminderToCalendar(updatedReminder);
        } else {
          await removeReminderFromCalendar(reminder.id);
        }
      }

      setReminders(prev => 
        prev.map(r => r.id === reminder.id ? updatedReminder : r)
      );

      toast.success(`Reminder ${updatedReminder.is_enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast.error('Failed to toggle reminder');
    }
  };

  const handleDeleteReminder = async (reminder: WorkoutReminder) => {
    try {
      const { error } = await supabase
        .from('workout_reminders')
        .delete()
        .eq('id', reminder.id);

      if (error) throw error;

      // Remove from service worker
      await cancelReminder(reminder.id);

      // Remove from calendar
      if (activeCalendarService?.isAuthenticated) {
        await removeReminderFromCalendar(reminder.id);
      }

      setReminders(prev => prev.filter(r => r.id !== reminder.id));
      toast.success('Reminder deleted successfully');
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Failed to delete reminder');
    }
  };

  const syncReminderToCalendar = async (reminder: any) => {
    if (!activeCalendarService?.isAuthenticated) return;

    try {
      setIsCalendarSyncing(true);
      const eventId = await calendarManager.syncReminderToCalendar(reminder);
      
      if (eventId) {
        // Update reminder with calendar event ID
        await supabase
          .from('workout_reminders')
          .update({ calendar_event_id: eventId })
          .eq('id', reminder.id);

        toast.success('Reminder synced to calendar');
      }
    } catch (error) {
      console.error('Error syncing to calendar:', error);
      toast.error('Failed to sync to calendar');
    } finally {
      setIsCalendarSyncing(false);
    }
  };

  const removeReminderFromCalendar = async (reminderId: string) => {
    if (!activeCalendarService?.isAuthenticated) return;

    try {
      await calendarManager.removeReminderFromCalendar(reminderId);
      
      // Remove calendar event ID from reminder
      await supabase
        .from('workout_reminders')
        .update({ calendar_event_id: null })
        .eq('id', reminderId);

      toast.success('Reminder removed from calendar');
    } catch (error) {
      console.error('Error removing from calendar:', error);
      toast.error('Failed to remove from calendar');
    }
  };

  const authenticateCalendarService = async (service: any) => {
    try {
      const success = await calendarManager.authenticateService(service.name);
      if (success) {
        setActiveCalendarService(service);
        toast.success(`Connected to ${service.name}`);
        
        // Sync existing reminders
        const remindersToSync = reminders.filter(r => r.is_enabled && !r.calendar_event_id);
        for (const reminder of remindersToSync) {
          await syncReminderToCalendar(reminder);
        }
      } else {
        toast.error(`Failed to connect to ${service.name}`);
      }
    } catch (error) {
      console.error('Error authenticating calendar service:', error);
      toast.error('Calendar authentication failed');
    }
  };

  const generateSmartSuggestions = async () => {
    if (!user) return;

    try {
      setShowSmartSuggestions(true);
      
      // Mock data for demonstration - in real app, fetch actual data
      const optimizationData = {
        userId: user.id,
        currentReminders: reminders,
        workoutHistory: [], // Would fetch from workout logs
        userPreferences: {
          userId: user.id,
          preferredDays: [1, 3, 5], // Monday, Wednesday, Friday
          preferredTimes: ['07:00', '18:00'],
          workoutDuration: 45,
          consistency: 0.8,
          energyLevels: {},
          scheduleConstraints: {
            workDays: [1, 2, 3, 4, 5],
            workStartTime: '09:00',
            workEndTime: '17:00',
            familyTime: ['18:00', '19:00'],
            otherCommitments: [],
          },
          fitnessGoals: ['general-fitness'],
          currentFitnessLevel: 'intermediate',
        },
        externalFactors: {
          weather: {},
          localEvents: [],
          seasonalChanges: {},
        },
      };

      const suggestions = await smartReminderService.generateSmartSuggestions(optimizationData);
      setSmartSuggestions(suggestions);

      // Show in-app notification
      if (window.addInAppNotification) {
        const notification: InAppNotificationData = {
          type: 'reminder',
          title: 'Smart Suggestions Generated',
          message: `AI has analyzed your patterns and generated ${suggestions.length} optimal reminder suggestions.`,
          duration: 5000,
          actions: [
            {
              label: 'View Suggestions',
              onClick: () => setShowSmartSuggestions(true),
              variant: 'default',
            },
          ],
          timestamp: new Date(),
        };
        window.addInAppNotification(notification);
      }
    } catch (error) {
      console.error('Error generating smart suggestions:', error);
      toast.error('Failed to generate smart suggestions');
    }
  };

  const applySmartSuggestion = async (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      scheduled_time: suggestion.suggestedTime,
      // Convert day numbers to recurrence pattern
      recurrence_pattern: suggestion.suggestedDays.length === 1 ? 'weekly' : 'weekly',
    }));

    setShowSmartSuggestions(false);
    setShowForm(true);
    
    toast.success('Smart suggestion applied to form');
  };

  const resetForm = () => {
    setFormData({
      title: '',
      workout_plan_id: '',
      scheduled_date: new Date(),
      scheduled_time: '07:00',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      is_enabled: true,
    });
    setEditingReminder(null);
    setShowForm(false);
  };

  const formatRecurrencePattern = (pattern: string, isRecurring: boolean) => {
    if (!isRecurring) return 'One-time';
    
    switch (pattern) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthdays': return 'Monthly (same date)';
      case 'monthly': return 'Monthly (same day)';
      default: return pattern;
    }
  };

  const getNextOccurrence = (reminder: WorkoutReminder) => {
    const baseDate = parseISO(reminder.scheduled_date);
    const now = new Date();
    
    if (baseDate >= now) return baseDate;
    
    if (!reminder.is_recurring) return baseDate;
    
    // Calculate next occurrence based on pattern
    let nextDate = baseDate;
    while (nextDate <= now) {
      switch (reminder.recurrence_pattern) {
        case 'daily':
          nextDate = addDays(nextDate, 1);
          break;
        case 'weekly':
          nextDate = addDays(nextDate, 7);
          break;
        case 'monthdays':
          nextDate = addDays(nextDate, 30);
          break;
        case 'monthly':
          nextDate = addDays(nextDate, 28);
          break;
      }
    }
    
    return nextDate;
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workout Reminders</CardTitle>
          <CardDescription>Please log in to manage your reminders</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Smart Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Workout Reminders
              </CardTitle>
              <CardDescription>
                Manage your workout reminders and get AI-powered suggestions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generateSmartSuggestions}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Brain className="h-4 w-4" />
                AI Suggestions
              </Button>
              <Button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Reminder
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar Integration
          </CardTitle>
          <CardDescription>
            Sync your reminders with external calendar apps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calendarServices.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-4 w-4" />
                  <span className="font-medium">{service.name}</span>
                  <Badge variant={service.isAuthenticated ? 'default' : 'secondary'}>
                    {service.isAuthenticated ? 'Connected' : 'Not Connected'}
                  </Badge>
                </div>
                <Button
                  onClick={() => authenticateCalendarService(service)}
                  variant={service.isAuthenticated ? 'outline' : 'default'}
                  disabled={isCalendarSyncing}
                >
                  {service.isAuthenticated ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
            
            {calendarServices.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No calendar services available. Make sure you have the required APIs enabled.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Smart Suggestions Modal */}
      {showSmartSuggestions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI-Powered Suggestions
            </CardTitle>
            <CardDescription>
              Based on your workout patterns and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {smartSuggestions.map((suggestion, index) => (
                <div key={suggestion.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {index === 0 ? 'Primary Suggestion' : `Alternative ${index}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {Math.round(suggestion.confidence * 100)}%
                      </p>
                    </div>
                    <Badge variant="outline">
                      {Math.round(suggestion.expectedAdherence * 100)}% adherence expected
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Time: {suggestion.suggestedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Days: {suggestion.suggestedDays.map(day => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {suggestion.reasoning}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => applySmartSuggestion(suggestion)}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Apply Suggestion
                    </Button>
                    <Button
                      onClick={() => setShowSmartSuggestions(false)}
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminder Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Morning workout"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Workout Plan (Optional)</label>
                  <Select
                    value={formData.workout_plan_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, workout_plan_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select workout plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {workoutPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {format(formData.scheduled_date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.scheduled_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, scheduled_date: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Time</label>
                  <TimeInput
                    value={formData.scheduled_time}
                    onChange={(time) => setFormData(prev => ({ ...prev, scheduled_time: time }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="recurring"
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                  />
                  <label htmlFor="recurring" className="text-sm font-medium">
                    Recurring reminder
                  </label>
                </div>
                
                {formData.is_recurring && (
                  <div>
                    <label className="text-sm font-medium">Recurrence Pattern</label>
                    <Select
                      value={formData.recurrence_pattern}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, recurrence_pattern: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthdays">Monthly (same date)</SelectItem>
                        <SelectItem value="monthly">Monthly (same day)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enabled"
                    checked={formData.is_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_enabled: checked }))}
                  />
                  <label htmlFor="enabled" className="text-sm font-medium">
                    Enable reminder
                  </label>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingReminder ? 'Update' : 'Create')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reminders</CardTitle>
          <CardDescription>
            {reminders.length} reminder{reminders.length !== 1 ? 's' : ''} set
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders set yet</p>
              <p className="text-sm">Create your first reminder to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reminders.map((reminder) => {
                const nextOccurrence = getNextOccurrence(reminder);
                const workoutPlan = workoutPlans.find(p => p.id === reminder.workout_plan_id);
                
                return (
                  <div key={reminder.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{reminder.title}</h4>
                          <Badge variant={reminder.is_enabled ? 'default' : 'secondary'}>
                            {reminder.is_enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          {reminder.calendar_event_id && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" />
                              Calendar
                            </Badge>
                          )}
                          {reminder.suggested_optimization && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              AI Optimized
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" />
                            <span>Next: {format(nextOccurrence, 'PPP')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>Time: {reminder.scheduled_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            <span>Pattern: {formatRecurrencePattern(reminder.recurrence_pattern, reminder.is_recurring)}</span>
                          </div>
                          {workoutPlan && (
                            <div className="flex items-center gap-2">
                              <span>Plan: {workoutPlan.title}</span>
                            </div>
                          )}
                        </div>
                        
                        {reminder.suggested_optimization && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                AI Suggestion
                              </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Consider changing to {reminder.suggested_optimization.newTime} on different days for better adherence.
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Confidence: {Math.round(reminder.suggested_optimization.confidence * 100)}%
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingReminder(reminder);
                            setFormData({
                              title: reminder.title,
                              workout_plan_id: reminder.workout_plan_id || '',
                              scheduled_date: parseISO(reminder.scheduled_date),
                              scheduled_time: reminder.scheduled_time,
                              is_recurring: reminder.is_recurring,
                              recurrence_pattern: reminder.recurrence_pattern,
                              is_enabled: reminder.is_enabled,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleReminder(reminder)}
                        >
                          {reminder.is_enabled ? 'Disable' : 'Enable'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteReminder(reminder)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedWorkoutReminders;
