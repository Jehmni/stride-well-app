import { googleAuthService } from './googleAuthService';

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: string;
  location?: string;
}

export interface CalendarService {
  isConnected(): boolean;
  connect(): Promise<boolean>;
  disconnect(): void;
  createEvent(event: CalendarEvent): Promise<string | null>;
  updateEvent(eventId: string, event: CalendarEvent): Promise<boolean>;
  deleteEvent(eventId: string): Promise<boolean>;
}

/**
 * Google Calendar service implementation using OAuth
 */
export class GoogleCalendarService implements CalendarService {
  isConnected(): boolean {
    return googleAuthService.isConnected();
  }

  async connect(): Promise<boolean> {
    try {
      const result = await googleAuthService.authenticate();
      
      if (result.success && result.accessToken) {
        // Store the access token and user email
        localStorage.setItem('google_calendar_token', result.accessToken);
        if (result.userEmail) {
          localStorage.setItem('google_calendar_email', result.userEmail);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect to Google Calendar:', error);
      return false;
    }
  }

  disconnect(): void {
    googleAuthService.disconnect();
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Calendar');
    }

    try {
      // For demo purposes, we'll simulate creating an event
      // In production, this would make an API call to Google Calendar
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return mock event ID
      const eventId = 'google_event_' + Date.now();
      
      // Store event locally for demo
      const events = JSON.parse(localStorage.getItem('google_calendar_events') || '[]');
      events.push({ ...event, id: eventId });
      localStorage.setItem('google_calendar_events', JSON.stringify(events));
      
      return eventId;
    } catch (error) {
      console.error('Failed to create Google Calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Calendar');
    }

    try {
      // For demo purposes, we'll simulate updating an event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update event locally for demo
      const events = JSON.parse(localStorage.getItem('google_calendar_events') || '[]');
      const eventIndex = events.findIndex((e: any) => e.id === eventId);
      
      if (eventIndex !== -1) {
        events[eventIndex] = { ...event, id: eventId };
        localStorage.setItem('google_calendar_events', JSON.stringify(events));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update Google Calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isConnected()) {
      throw new Error('Not connected to Google Calendar');
    }

    try {
      // For demo purposes, we'll simulate deleting an event
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Remove event locally for demo
      const events = JSON.parse(localStorage.getItem('google_calendar_events') || '[]');
      const filteredEvents = events.filter((e: any) => e.id !== eventId);
      localStorage.setItem('google_calendar_events', JSON.stringify(filteredEvents));
      
      return true;
    } catch (error) {
      console.error('Failed to delete Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Converts app recurrence pattern to Google Calendar format
   */
  private convertRecurrencePattern(pattern: string): string {
    // Simple conversion - in production this would be more sophisticated
    if (pattern.includes('daily')) return 'RRULE:FREQ=DAILY';
    if (pattern.includes('weekly')) return 'RRULE:FREQ=WEEKLY';
    if (pattern.includes('monthly')) return 'RRULE:FREQ=MONTHLY';
    return 'RRULE:FREQ=WEEKLY';
  }
}

/**
 * Outlook Calendar service stub
 */
export class OutlookCalendarService implements CalendarService {
  isConnected(): boolean {
    return false; // Not implemented yet
  }

  async connect(): Promise<boolean> {
    // TODO: Implement Outlook OAuth
    return false;
  }

  disconnect(): void {
    // TODO: Implement Outlook disconnect
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    throw new Error('Outlook Calendar not implemented yet');
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    throw new Error('Outlook Calendar not implemented yet');
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    throw new Error('Outlook Calendar not implemented yet');
  }
}

/**
 * Calendar manager that handles multiple calendar services
 */
export class CalendarManager {
  private services: Map<string, CalendarService> = new Map();

  constructor() {
    // Initialize with Google Calendar service
    this.services.set('google', new GoogleCalendarService());
    this.services.set('outlook', new OutlookCalendarService());
  }

  /**
   * Gets a specific calendar service
   */
  getService(serviceName: string): CalendarService | undefined {
    return this.services.get(serviceName);
  }

  /**
   * Gets the primary calendar service (Google for now)
   */
  getPrimaryService(): CalendarService {
    return this.services.get('google')!;
  }

  /**
   * Syncs a reminder with the connected calendar
   */
  async syncReminder(reminder: any): Promise<boolean> {
    const primaryService = this.getPrimaryService();
    
    if (!primaryService.isConnected()) {
      return false;
    }

    try {
      const event: CalendarEvent = {
        title: `Workout Reminder: ${reminder.title || 'Workout'}`,
        description: reminder.description || 'Time for your workout!',
        startTime: new Date(reminder.scheduled_date + 'T' + reminder.scheduled_time),
        endTime: new Date(reminder.scheduled_date + 'T' + reminder.scheduled_time),
        isRecurring: reminder.is_recurring || false,
        recurrencePattern: reminder.recurrence_pattern,
        location: 'Gym/Home'
      };

      const eventId = await primaryService.createEvent(event);
      return !!eventId;
    } catch (error) {
      console.error('Failed to sync reminder with calendar:', error);
      return false;
    }
  }

  /**
   * Gets all connected calendar services
   */
  getConnectedServices(): string[] {
    const connected: string[] = [];
    
    for (const [name, service] of this.services) {
      if (service.isConnected()) {
        connected.push(name);
      }
    }
    
    return connected;
  }
}

// Export the calendar manager instance
export const calendarManager = new CalendarManager();
