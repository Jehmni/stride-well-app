import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, isToday, isTomorrow } from 'date-fns';
import { Link } from 'react-router-dom';

interface Reminder {
  id: string;
  title: string;
  scheduled_date: string;
  scheduled_time: string;
  is_enabled: boolean;
  workout_plan_id?: string;
}

const RemindersWidget: React.FC = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUpcomingReminders();
    }
  }, [user]);

  const fetchUpcomingReminders = async () => {
    try {
      setLoading(true);
      
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from('workout_reminders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_enabled', true)
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lte('scheduled_date', nextWeek.toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) throw error;
      
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatReminderTime = (date: string, time: string) => {
    const reminderDate = new Date(`${date}T${time}`);
    
    if (isToday(reminderDate)) {
      return `Today at ${time.substring(0, 5)}`;
    } else if (isTomorrow(reminderDate)) {
      return `Tomorrow at ${time.substring(0, 5)}`;
    } else {
      return format(reminderDate, 'MMM d at HH:mm');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reminders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Upcoming Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No upcoming reminders</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/reminders">Set Reminders</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Reminders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
              <div className="flex-1">
                <h4 className="font-medium text-sm">{reminder.title}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatReminderTime(reminder.scheduled_date, reminder.scheduled_time)}</span>
                </div>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link to="/reminders">View</Link>
              </Button>
            </div>
          ))}
          
          {reminders.length >= 5 && (
            <div className="text-center pt-2">
              <Button asChild size="sm" variant="outline">
                <Link to="/reminders">View All Reminders</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RemindersWidget;
