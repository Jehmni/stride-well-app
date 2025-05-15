// Service Worker for handling workout reminders
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Handle push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Time for your workout!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/workouts',
      workoutPlanId: data.workoutPlanId || null
    },
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Workout'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'CorePilot Workout Reminder',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data.url || '/workouts';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // If a tab is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Run scheduled checks for reminders
const checkReminders = async () => {
  // In a real implementation, this would fetch from IndexedDB
  // where scheduled reminders would be stored
  const reminders = await getRemindersFromStorage();
  
  const now = new Date();
  
  reminders.forEach(reminder => {
    const reminderTime = new Date(reminder.date);
    if (reminderTime <= now && reminder.enabled) {
      // Send notification
      self.registration.showNotification(
        reminder.title || 'CorePilot Workout Reminder',
        {
          body: 'Time for your workout!',
          icon: '/favicon.ico',
          data: {
            url: reminder.workoutPlanId ? `/workouts/ai/${reminder.workoutPlanId}` : '/workouts',
            workoutPlanId: reminder.workoutPlanId || null
          }
        }
      );
      
      // Update reminder if recurring
      if (reminder.isRecurring) {
        updateRecurringReminder(reminder);
      } else {
        // Mark as triggered
        markReminderAsTriggered(reminder.id);
      }
    }
  });
};

// Helper function to get reminders from storage
const getRemindersFromStorage = async () => {
  // This would be implemented using IndexedDB
  // For demo purposes, we'll return an empty array
  return [];
};

// Helper function to update a recurring reminder
const updateRecurringReminder = async (reminder) => {
  // This would calculate the next occurrence based on the pattern
  // and update the reminder in IndexedDB
};

// Helper function to mark a reminder as triggered
const markReminderAsTriggered = async (id) => {
  // This would update the reminder in IndexedDB
};

// Periodically check for reminders (every minute)
setInterval(checkReminders, 60000); 