// Dashboard-specific service worker
// This service worker is focused on caching and serving the Dashboard component

const DASHBOARD_CACHE = 'dashboard-cache-v1';
const DASHBOARD_FILES = [
  '/src/pages/Dashboard.tsx',
  '/src/components/dashboard/DashboardLayout.tsx',
  '/dashboard-fallback.js'
];

// Install event - cache Dashboard-related files
self.addEventListener('install', (event) => {
  console.log('Dashboard Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(DASHBOARD_CACHE)
      .then((cache) => {
        console.log('Dashboard Service Worker: Caching dashboard files');
        return cache.addAll(DASHBOARD_FILES);
      })
      .then(() => {
        console.log('Dashboard Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Dashboard Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Dashboard Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== DASHBOARD_CACHE) {
              console.log('Dashboard Service Worker: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Dashboard Service Worker: Now ready to handle dashboard requests');
        return self.clients.claim();
      })
  );
});

// Fetch event - intercept dashboard-related requests
self.addEventListener('fetch', (event) => {
  // Only handle dashboard-related requests
  if (event.request.url.includes('Dashboard-') || 
      event.request.url.includes('/dashboard') ||
      DASHBOARD_FILES.some(file => event.request.url.includes(file))) {
    
    console.log('Dashboard Service Worker: Handling dashboard request', event.request.url);
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            console.log('Dashboard Service Worker: Serving from cache', event.request.url);
            return response;
          }
          
          // Otherwise make network request
          console.log('Dashboard Service Worker: Fetching from network', event.request.url);
          return fetch(event.request)
            .then((networkResponse) => {
              // Cache the network response for future
              caches.open(DASHBOARD_CACHE)
                .then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                  console.log('Dashboard Service Worker: Cached new resource', event.request.url);
                });
              
              return networkResponse;
            })
            .catch((error) => {
              console.error('Dashboard Service Worker: Fetch failed', error);
              
              // If both cache and network fail, serve a minimal dashboard fallback
              if (event.request.url.includes('Dashboard-')) {
                return caches.match('/dashboard-fallback.js')
                  .then(fallbackResponse => {
                    if (fallbackResponse) {
                      return fallbackResponse;
                    }
                    
                    // Last resort - create simple JS module response
                    return new Response(
                      `export default function SimpleDashboard() { 
                        return { 
                          type: 'div', 
                          props: { 
                            children: 'Dashboard is unavailable. Please try again later.'
                          } 
                        }; 
                      }`,
                      { 
                        headers: { 'Content-Type': 'application/javascript' }
                      }
                    );
                  });
              }
              
              // For other requests just pass through the error
              throw error;
            });
        })
    );
  }
}); 