// Notification service for handling workout reminders

/**
 * Check if notifications are supported by the browser
 */
export const isNotificationSupported = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Register the reminder service worker
 */
export const registerReminderServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/reminder-worker.js');
    console.log('Reminder service worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Error registering reminder service worker:', error);
    return null;
  }
};

/**
 * Schedule a reminder notification
 */
export const scheduleReminder = async (
  reminder: {
    id: string;
    title: string;
    scheduled_date: string;
    scheduled_time: string;
    is_recurring: boolean;
    recurrence_pattern?: string;
    workout_plan_id?: string;
    is_enabled: boolean;
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send message to service worker to store the reminder
    if (registration.active) {
      registration.active.postMessage({
        type: 'STORE_REMINDER',
        reminder
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return false;
  }
};

/**
 * Cancel a specific reminder
 */
export const cancelReminder = async (reminderId: string): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'DELETE_REMINDER',
        id: reminderId
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error canceling reminder:', error);
    return false;
  }
};

/**
 * Update an existing reminder
 */
export const updateReminder = async (
  reminder: {
    id: string;
    title: string;
    scheduled_date: string;
    scheduled_time: string;
    is_recurring: boolean;
    recurrence_pattern?: string;
    workout_plan_id?: string;
    is_enabled: boolean;
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'UPDATE_REMINDER',
        reminder
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error updating reminder:', error);
    return false;
  }
};

/**
 * Cancel all pending notifications
 */
export const cancelAllNotifications = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if (registration && 'getNotifications' in registration) {
      const notifications = await registration.getNotifications();
      notifications.forEach(notification => notification.close());
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
};

/**
 * Test notification (for debugging)
 */
export const testNotification = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('showNotification' in registration) {
      await registration.showNotification('Test Notification', {
        body: 'This is a test notification from CorePilot',
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error showing test notification:', error);
    return false;
  }
}; 