import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Bell, Calendar, Smartphone, X, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { scheduleReminder, cancelReminder, updateReminder } from '@/services/notificationService';
import { calendarManager } from '@/services/calendarService';
import { smartReminderService } from '@/services/smartReminderService';
import { googleAuthService } from '@/services/googleAuthService';

interface Reminder {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  is_recurring: boolean;
  recurrence_pattern: string;
  is_enabled: boolean;
  workout_plan_id?: string;
  calendar_event_id?: string;
  suggested_optimization?: any;
}

const EnhancedWorkoutReminders: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    scheduled_date: '',
    scheduled_time: '',
    is_recurring: false,
    recurrence_pattern: 'weekly',
    is_enabled: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isConnectingCalendar, setIsConnectingCalendar] = useState(false);

  // Load reminders on component mount
  useEffect(() => {
    loadReminders();
    checkCalendarConnection();
    loadSmartSuggestions();
  }, []);

  // Check if Google Calendar is connected
  const checkCalendarConnection = () => {
    setIsCalendarConnected(googleAuthService.isConnected());
  };

  // Load smart suggestions
  const loadSmartSuggestions = async () => {
    try {
      const suggestions = await smartReminderService.generateSmartSuggestions();
      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load smart suggestions:', error);
    }
  };

  // Load reminders from localStorage (demo)
  const loadReminders = () => {
    const stored = localStorage.getItem('workout_reminders');
    if (stored) {
      setReminders(JSON.parse(stored));
    }
  };

  // Save reminders to localStorage (demo)
  const saveReminders = (newReminders: Reminder[]) => {
    localStorage.setItem('workout_reminders', JSON.stringify(newReminders));
    setReminders(newReminders);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reminderData = {
        ...formData,
        id: editingReminder?.id || `reminder_${Date.now()}`,
        calendar_event_id: undefined,
        suggested_optimization: undefined
      };

      if (editingReminder) {
        // Update existing reminder
        await updateReminder(reminderData.id, reminderData);
        const updatedReminders = reminders.map(r => 
          r.id === reminderData.id ? reminderData : r
        );
        saveReminders(updatedReminders);
      } else {
        // Create new reminder
        await scheduleReminder(reminderData);
        const newReminders = [...reminders, reminderData];
        saveReminders(newReminders);

        // Sync with calendar if connected
        if (isCalendarConnected) {
          try {
            await calendarManager.syncReminder(reminderData);
            // Update reminder with calendar event ID
            reminderData.calendar_event_id = 'synced';
            const updatedReminders = reminders.map(r => 
              r.id === reminderData.id ? reminderData : r
            );
            saveReminders(updatedReminders);
          } catch (error) {
            console.error('Failed to sync with calendar:', error);
          }
        }
      }

      // Reset form
      resetForm();
      setIsFormOpen(false);
      
      // Show success notification
      if (window.addInAppNotification) {
        window.addInAppNotification({
          type: 'success',
          title: 'Reminder Saved',
          message: editingReminder ? 'Reminder updated successfully!' : 'Reminder created successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to save reminder:', error);
      if (window.addInAppNotification) {
        window.addInAppNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to save reminder. Please try again.',
          duration: 5000
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle reminder deletion
  const handleDeleteReminder = async (id: string) => {
    try {
      await cancelReminder(id);
      const updatedReminders = reminders.filter(r => r.id !== id);
      saveReminders(updatedReminders);
      
      if (window.addInAppNotification) {
        window.addInAppNotification({
          type: 'success',
          title: 'Reminder Deleted',
          message: 'Reminder removed successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Failed to delete reminder:', error);
    }
  };

  // Handle reminder toggle
  const handleToggleReminder = async (reminder: Reminder) => {
    try {
      const updatedReminder = { ...reminder, is_enabled: !reminder.is_enabled };
      
      if (updatedReminder.is_enabled) {
        await scheduleReminder(updatedReminder);
      } else {
        await cancelReminder(reminder.id);
      }
      
      const updatedReminders = reminders.map(r => 
        r.id === reminder.id ? updatedReminder : r
      );
      saveReminders(updatedReminders);
    } catch (error) {
      console.error('Failed to toggle reminder:', error);
    }
  };

  // Connect to Google Calendar
  const handleConnectCalendar = async () => {
    setIsConnectingCalendar(true);
    try {
      const success = await calendarManager.getPrimaryService().connect();
      if (success) {
        setIsCalendarConnected(true);
        if (window.addInAppNotification) {
          window.addInAppNotification({
            type: 'success',
            title: 'Calendar Connected',
            message: 'Google Calendar connected successfully!',
            duration: 5000
          });
        }
      } else {
        throw new Error('Failed to connect to Google Calendar');
      }
    } catch (error) {
      console.error('Calendar connection failed:', error);
      if (window.addInAppNotification) {
        window.addInAppNotification({
          type: 'error',
          title: 'Connection Failed',
          message: 'Failed to connect to Google Calendar. Please try again.',
          duration: 5000
        });
      }
    } finally {
      setIsConnectingCalendar(false);
    }
  };

  // Disconnect from Google Calendar
  const handleDisconnectCalendar = () => {
    calendarManager.getPrimaryService().disconnect();
    setIsCalendarConnected(false);
    if (window.addInAppNotification) {
      window.addInAppNotification({
        type: 'info',
        title: 'Calendar Disconnected',
        message: 'Google Calendar disconnected successfully.',
        duration: 3000
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      scheduled_date: '',
      scheduled_time: '',
      is_recurring: false,
      recurrence_pattern: 'weekly',
      is_enabled: true
    });
    setEditingReminder(null);
  };

  // Open form for editing
  const openEditForm = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      scheduled_date: reminder.scheduled_date,
      scheduled_time: reminder.scheduled_time,
      is_recurring: reminder.is_recurring,
      recurrence_pattern: reminder.recurrence_pattern,
      is_enabled: reminder.is_enabled
    });
    setIsFormOpen(true);
  };

  // Apply smart suggestion
  const applySmartSuggestion = (suggestion: any) => {
    setFormData({
      title: suggestion.title || formData.title,
      scheduled_date: suggestion.optimalDate || formData.scheduled_date,
      scheduled_time: suggestion.optimalTime || formData.scheduled_time,
      is_recurring: suggestion.isRecurring || formData.is_recurring,
      recurrence_pattern: suggestion.recurrencePattern || formData.recurrence_pattern,
      is_enabled: true
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Calendar Integration */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Workout Reminders</h1>
          <p className="text-muted-foreground">
            Set reminders for your workouts and sync them with your calendar
          </p>
        </div>
        
        {/* Calendar Connection Status */}
        <div className="flex items-center gap-3">
          {isCalendarConnected ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Calendar className="h-4 w-4 mr-1" />
                Connected to Google Calendar
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnectCalendar}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleConnectCalendar}
              disabled={isConnectingCalendar}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConnectingCalendar ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Connect Google Calendar
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Smart Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {smartSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => applySmartSuggestion(suggestion)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {suggestion.confidence}% confidence
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.expectedAdherence}% adherence
                    </span>
                  </div>
                  <h4 className="font-medium text-sm">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {suggestion.reasoning}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reminders List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Your Reminders
          </CardTitle>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reminder
          </Button>
        </CardHeader>
        <CardContent>
          {reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No reminders set yet.</p>
              <p className="text-sm">Create your first reminder to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{reminder.title}</h3>
                      <div className="flex items-center gap-2">
                        {reminder.is_enabled ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                            Inactive
                          </Badge>
                        )}
                        {reminder.calendar_event_id && (
                          <Badge variant="outline" className="text-blue-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Synced
                          </Badge>
                        )}
                        {reminder.suggested_optimization && (
                          <Badge variant="outline" className="text-purple-600">
                            <Smartphone className="h-3 w-3 mr-1" />
                            AI Optimized
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span>
                        {format(new Date(reminder.scheduled_date), 'MMM dd, yyyy')} at{' '}
                        {reminder.scheduled_time}
                      </span>
                      {reminder.is_recurring && (
                        <span className="ml-2">
                          • Repeats {reminder.recurrence_pattern}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.is_enabled}
                      onCheckedChange={() => handleToggleReminder(reminder)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(reminder)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Reminder Form */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFormOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Reminder Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Morning Workout, Gym Session"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled_date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.scheduled_date ? (
                          format(new Date(formData.scheduled_date), 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={formData.scheduled_date ? new Date(formData.scheduled_date) : undefined}
                        onSelect={(date) => 
                          setFormData({ ...formData, scheduled_date: date ? format(date, 'yyyy-MM-dd') : '' })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time">Time</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="recurrence_pattern">Recurrence</Label>
                  <Select
                    value={formData.recurrence_pattern}
                    onValueChange={(value) => setFormData({ ...formData, recurrence_pattern: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Recurrence</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
                />
                <Label htmlFor="is_recurring">Recurring Reminder</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_enabled"
                  checked={formData.is_enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                />
                <Label htmlFor="is_enabled">Enable Reminder</Label>
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    editingReminder ? 'Update Reminder' : 'Create Reminder'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedWorkoutReminders;
