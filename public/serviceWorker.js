// Service Worker for CorePilot - Gym & Fitness Trainer
const CACHE_NAME = 'corepilot-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/index.css',
  '/assets/index.js',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async (cache) => {
        console.log('Service Worker: Caching static assets');
        
        // Try to cache each asset individually to prevent complete failure
        const cachePromises = STATIC_ASSETS.map(async (asset) => {
          try {
            // Try to fetch and cache each asset
            const response = await fetch(asset, { cache: 'reload' });
            if (response.ok) {
              await cache.put(asset, response);
              console.log(`Successfully cached: ${asset}`);
            } else {
              console.log(`Failed to cache ${asset}: ${response.status} ${response.statusText}`);
            }
          } catch (error) {
            // Skip assets that fail to fetch
            console.log(`Skipping asset ${asset} due to error: ${error.message}`);
          }
        });
        
        // Wait for all assets to be processed
        await Promise.allSettled(cachePromises);
        console.log('Service Worker: Completed caching available assets');
      })
      .catch((error) => console.error('Failed to cache static assets:', error))
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim control immediately
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Supabase API requests (we don't want to cache these)
  if (event.request.url.includes('supabase.co')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return from cache if found
        if (response) {
          return response;
        }
        
        // Otherwise try to fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache opaque responses (CORS issues)
            if (networkResponse.type === 'opaque') {
              return networkResponse;
            }
            
            // Cache new responses
            return caches.open(CACHE_NAME).then((cache) => {
              // Clone the response as it can only be consumed once
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          });
      })
      .catch((error) => {
        console.error('Fetch handler failed:', error);
        
        // Fallback for HTML pages - return the offline page
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        
        return new Response('Network error occurred', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Background sync for workout data
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-workouts') {
    event.waitUntil(syncWorkouts());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body || 'Time to workout!',
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/badge-72x72.png',
    data: {
      url: data.url || '/',
      workoutPlanId: data.workoutPlanId
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'CorePilot Reminder', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If not, open a new window
        return clients.openWindow(urlToOpen);
      })
  );
});

// Function to handle background sync of workouts
async function syncWorkouts() {
  // This would be implemented by the main thread
  // We're just posting a message to the client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'SYNC_WORKOUTS'
    });
  });
} 