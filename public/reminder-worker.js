// Service Worker for handling workout reminders
const DB_NAME = 'RemindersDB';
const DB_VERSION = 1;
const STORE_NAME = 'reminders';

// Install and activate
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Initialize IndexedDB
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('nextScheduled', 'nextScheduled', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

// Store a reminder in IndexedDB
const storeReminder = async (reminder) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  // Calculate next scheduled time
  const nextScheduled = calculateNextScheduledTime(reminder);
  
  const reminderData = {
    ...reminder,
    nextScheduled: nextScheduled.getTime(),
    storedAt: Date.now()
  };
  
  await store.put(reminderData);
  return reminderData;
};

// Get all reminders from IndexedDB
const getReminders = async () => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Delete a reminder from IndexedDB
const deleteReminder = async (id) => {
  const db = await initDB();
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  
  await store.delete(id);
};

// Calculate next scheduled time based on recurrence pattern
const calculateNextScheduledTime = (reminder) => {
  const baseTime = new Date(`${reminder.scheduled_date}T${reminder.scheduled_time}`);
  const now = new Date();
  
  if (!reminder.is_recurring) {
    return baseTime;
  }
  
  let nextTime = new Date(baseTime);
  
  // If the base time has passed, calculate the next occurrence
  while (nextTime <= now) {
    switch (reminder.recurrence_pattern) {
      case 'daily':
        nextTime.setDate(nextTime.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(nextTime.getDate() + 7);
        break;
      case 'weekdays':
        nextTime.setDate(nextTime.getDate() + 1);
        // Skip weekends
        while (nextTime.getDay() === 0 || nextTime.getDay() === 6) {
          nextTime.setDate(nextTime.getDate() + 1);
        }
        break;
      case 'monthly':
        nextTime.setMonth(nextTime.getMonth() + 1);
        break;
      default:
        return baseTime;
    }
  }
  
  return nextTime;
};

// Update recurring reminder
const updateRecurringReminder = async (reminder) => {
  if (!reminder.is_recurring) {
    await deleteReminder(reminder.id);
    return;
  }
  
  const nextScheduled = calculateNextScheduledTime(reminder);
  const updatedReminder = {
    ...reminder,
    scheduled_date: nextScheduled.toISOString().split('T')[0],
    nextScheduled: nextScheduled.getTime()
  };
  
  await storeReminder(updatedReminder);
};

// Check and send reminders
const checkReminders = async () => {
  try {
    const reminders = await getReminders();
    const now = Date.now();
    
    for (const reminder of reminders) {
      if (reminder.nextScheduled <= now && reminder.is_enabled) {
        // Send notification
        await self.registration.showNotification(
          reminder.title || 'CorePilot Workout Reminder',
          {
            body: reminder.workout_plan_id 
              ? `Time for your workout!` 
              : 'Time for your workout!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: {
              url: reminder.workout_plan_id ? `/ai-workouts/${reminder.workout_plan_id}` : '/workouts',
              workoutPlanId: reminder.workout_plan_id,
              reminderId: reminder.id
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
            ],
            tag: `reminder-${reminder.id}`,
            requireInteraction: true
          }
        );
        
        // Update recurring reminder or delete one-time reminder
        if (reminder.is_recurring) {
          await updateRecurringReminder(reminder);
        } else {
          await deleteReminder(reminder.id);
        }
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
};

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

// Handle push notifications (for future server-sent reminders)
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  
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

// Handle messages from the main app
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'STORE_REMINDER') {
    storeReminder(event.data.reminder);
  } else if (event.data && event.data.type === 'DELETE_REMINDER') {
    deleteReminder(event.data.id);
  } else if (event.data && event.data.type === 'UPDATE_REMINDER') {
    storeReminder(event.data.reminder);
  }
});

// Start checking reminders every minute
setInterval(checkReminders, 60000);

// Initial check when service worker starts
checkReminders(); 