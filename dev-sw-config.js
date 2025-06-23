// Development-friendly service worker configuration
// Add this to your service worker for better dev experience

// Detect if in development mode
const isDevelopment = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

// Different caching strategies for dev vs production
const CACHE_STRATEGY = isDevelopment ? 'network-first' : 'cache-first';

// More aggressive cache clearing in development
if (isDevelopment) {
  // Clear all caches on service worker activation
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('Development: Clearing cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      })
    );
  });
}

// Skip waiting in development for faster updates
if (isDevelopment) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });
}
