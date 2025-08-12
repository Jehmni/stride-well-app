// Calendar integration service for syncing reminders with external calendar apps

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    endDate?: Date;
    daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
  reminders?: {
    minutes: number;
    type: 'email' | 'popup' | 'sms';
  }[];
}

export interface CalendarService {
  name: string;
  isAvailable: boolean;
  isAuthenticated: boolean;
  authenticate(): Promise<boolean>;
  createEvent(event: CalendarEvent): Promise<string | null>;
  updateEvent(eventId: string, event: CalendarEvent): Promise<boolean>;
  deleteEvent(eventId: string): Promise<boolean>;
  listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
}

// Google Calendar integration
export class GoogleCalendarService implements CalendarService {
  name = 'Google Calendar';
  isAvailable = false;
  isAuthenticated = false;
  private accessToken: string | null = null;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    return typeof window !== 'undefined' && 'gapi' in window;
  }

  async authenticate(): Promise<boolean> {
    if (!this.isAvailable) {
      console.warn('Google Calendar API not available');
      return false;
    }

    try {
      // Initialize Google API
      await this.initializeGoogleAPI();
      
      // Request authorization
      const authResult = await this.requestAuthorization();
      this.isAuthenticated = authResult;
      
      if (this.isAuthenticated) {
        console.log('✅ Google Calendar authenticated successfully');
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('❌ Google Calendar authentication failed:', error);
      return false;
    }
  }

  private async initializeGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      window.gapi.load('auth2', () => {
        window.gapi.auth2.init({
          client_id: process.env.VITE_GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/calendar'
        }).then(() => {
          resolve();
        }).catch(reject);
      });
    });
  }

  private async requestAuthorization(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!window.gapi || !window.gapi.auth2) {
        reject(new Error('Google API not initialized'));
        return;
      }

      const auth2 = window.gapi.auth2.getAuthInstance();
      if (auth2.isSignedIn.get()) {
        this.accessToken = auth2.currentUser.get().getAuthResponse().access_token;
        resolve(true);
      } else {
        auth2.signIn().then(() => {
          this.accessToken = auth2.currentUser.get().getAuthResponse().access_token;
          resolve(true);
        }).catch(reject);
      }
    });
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    if (!this.isAuthenticated || !this.accessToken) {
      console.warn('Google Calendar not authenticated');
      return null;
    }

    try {
      const googleEvent = this.convertToGoogleEvent(event);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Google Calendar event created:', result.id);
      return result.id;
    } catch (error) {
      console.error('❌ Failed to create Google Calendar event:', error);
      return null;
    }
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    if (!this.isAuthenticated || !this.accessToken) {
      return false;
    }

    try {
      const googleEvent = this.convertToGoogleEvent(event);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Google Calendar event updated:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to update Google Calendar event:', error);
      return false;
    }
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.isAuthenticated || !this.accessToken) {
      return false;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Google Calendar event deleted:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete Google Calendar event:', error);
      return false;
    }
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    if (!this.isAuthenticated || !this.accessToken) {
      return [];
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
        `timeMin=${startDate.toISOString()}&timeMax=${endDate.toISOString()}&singleEvents=true`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.items.map((item: any) => this.convertFromGoogleEvent(item));
    } catch (error) {
      console.error('❌ Failed to list Google Calendar events:', error);
      return [];
    }
  }

  private convertToGoogleEvent(event: CalendarEvent): any {
    const googleEvent: any = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    if (event.location) {
      googleEvent.location = event.location;
    }

    if (event.recurrence) {
      googleEvent.recurrence = this.convertRecurrence(event.recurrence);
    }

    if (event.reminders) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: event.reminders.map(r => ({
          method: r.type === 'email' ? 'email' : 'popup',
          minutes: r.minutes,
        })),
      };
    }

    return googleEvent;
  }

  private convertFromGoogleEvent(googleEvent: any): CalendarEvent {
    return {
      id: googleEvent.id,
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime: new Date(googleEvent.start.dateTime || googleEvent.start.date),
      endTime: new Date(googleEvent.end.dateTime || googleEvent.end.date),
      location: googleEvent.location,
      // Add other conversions as needed
    };
  }

  private convertRecurrence(recurrence: any): string[] {
    const rules: string[] = [];
    
    if (recurrence.frequency) {
      let rule = `FREQ=${recurrence.frequency.toUpperCase()}`;
      
      if (recurrence.interval && recurrence.interval > 1) {
        rule += `;INTERVAL=${recurrence.interval}`;
      }
      
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        const days = recurrence.daysOfWeek.map(day => {
          const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
          return dayNames[day];
        });
        rule += `;BYDAY=${days.join(',')}`;
      }
      
      if (recurrence.endDate) {
        rule += `;UNTIL=${recurrence.endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
      }
      
      rules.push(`RRULE:${rule}`);
    }
    
    return rules;
  }
}

// Outlook Calendar integration
export class OutlookCalendarService implements CalendarService {
  name = 'Outlook Calendar';
  isAvailable = false;
  isAuthenticated = false;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    return typeof window !== 'undefined' && 'Office' in window;
  }

  async authenticate(): Promise<boolean> {
    // Outlook integration would go here
    // For now, return false as it's not implemented
    return false;
  }

  async createEvent(event: CalendarEvent): Promise<string | null> {
    return null;
  }

  async updateEvent(eventId: string, event: CalendarEvent): Promise<boolean> {
    return false;
  }

  async deleteEvent(eventId: string): Promise<boolean> {
    return false;
  }

  async listEvents(startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    return [];
  }
}

// Calendar manager service
export class CalendarManager {
  private services: CalendarService[] = [];
  private activeService: CalendarService | null = null;

  constructor() {
    this.initializeServices();
  }

  private initializeServices() {
    // Add available calendar services
    if (typeof window !== 'undefined') {
      this.services.push(new GoogleCalendarService());
      this.services.push(new OutlookCalendarService());
    }
  }

  getAvailableServices(): CalendarService[] {
    return this.services.filter(service => service.isAvailable);
  }

  async authenticateService(serviceName: string): Promise<boolean> {
    const service = this.services.find(s => s.name === serviceName);
    if (!service) {
      return false;
    }

    const success = await service.authenticate();
    if (success) {
      this.activeService = service;
    }
    return success;
  }

  getActiveService(): CalendarService | null {
    return this.activeService;
  }

  async syncReminderToCalendar(reminder: any): Promise<string | null> {
    if (!this.activeService || !this.activeService.isAuthenticated) {
      console.warn('No active calendar service');
      return null;
    }

    const event: CalendarEvent = {
      id: `reminder-${reminder.id}`,
      title: reminder.title,
      description: `Workout reminder: ${reminder.title}`,
      startTime: new Date(`${reminder.scheduled_date}T${reminder.scheduled_time}`),
      endTime: new Date(`${reminder.scheduled_date}T${reminder.scheduled_time}`),
      recurrence: reminder.is_recurring ? {
        frequency: reminder.recurrence_pattern as any,
        interval: 1,
      } : undefined,
      reminders: [
        { minutes: 15, type: 'popup' },
        { minutes: 30, type: 'email' },
      ],
    };

    return await this.activeService.createEvent(event);
  }

  async removeReminderFromCalendar(reminderId: string): Promise<boolean> {
    if (!this.activeService || !this.activeService.isAuthenticated) {
      return false;
    }

    const eventId = `reminder-${reminderId}`;
    return await this.activeService.deleteEvent(eventId);
  }
}

// Export singleton instance
export const calendarManager = new CalendarManager();
