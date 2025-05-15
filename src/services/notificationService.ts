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
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title: string,
  options: {
    body: string;
    timestamp: number;
    workoutPlanId?: string;
    actions?: {action: string; title: string}[];
  }
): Promise<boolean> => {
  if (!isNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if ('showNotification' in registration) {
      const now = Date.now();
      const delay = Math.max(0, options.timestamp - now);
      
      if (delay > 0) {
        // For a demo version, we'll use setTimeout,
        // In a real app this would use IndexedDB to persist
        setTimeout(() => {
          registration.showNotification(title, {
            ...options,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: {
              url: options.workoutPlanId ? `/workouts/ai/${options.workoutPlanId}` : '/workouts',
              workoutPlanId: options.workoutPlanId
            },
            vibrate: [200, 100, 200],
            actions: options.actions || [
              {
                action: 'view',
                title: 'View Workout'
              },
              {
                action: 'close',
                title: 'Dismiss'
              }
            ]
          });
        }, delay);
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error scheduling notification:', error);
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