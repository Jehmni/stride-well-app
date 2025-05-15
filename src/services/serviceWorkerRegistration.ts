// Service worker registration utility
import { syncAllWorkouts } from './offlineStorageService';

const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

/**
 * Register the service worker
 */
export async function register(config?: Config): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      // The URL constructor is available in all browsers that support SW
      const publicUrl = new URL(import.meta.env.BASE_URL, window.location.href);
      
      // Our service worker won't work if PUBLIC_URL is on a different origin
      if (publicUrl.origin !== window.location.origin) {
        console.log('Service worker skipped: different origin');
        return;
      }

      // Wait for the page to load before registering
      window.addEventListener('load', async () => {
        const swUrl = `${import.meta.env.BASE_URL}serviceWorker.js`;

        if (isLocalhost) {
          // This is running on localhost. Check if SW exists
          await checkValidServiceWorker(swUrl, config);
        } else {
          // Is not localhost. Just register service worker
          await registerValidSW(swUrl, config);
        }
      });

      // Add sync event listener
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_WORKOUTS') {
          console.log('Received sync request from service worker');
          syncAllWorkouts().then(count => {
            console.log(`Synced ${count} workouts during background sync`);
          });
        }
      });
      
      // Set up auto-sync when coming back online
      window.addEventListener('online', () => {
        console.log('App is back online, syncing workouts...');
        syncAllWorkouts().then(count => {
          if (count > 0) {
            console.log(`Synced ${count} workouts after reconnecting`);
          }
        });
        
        // Request a background sync if supported
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-workouts')
              .catch(error => console.error('Error registering sync:', error));
          });
        }
      });
      
    } catch (error) {
      console.error('Error during service worker registration:', error);
    }
  }
}

/**
 * Register a valid service worker
 */
async function registerValidSW(swUrl: string, config?: Config): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (installingWorker == null) return;
      
      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // At this point, the updated precached content has been fetched
            console.log('New content is available. Please refresh the page.');
            
            // Execute callback
            if (config?.onUpdate) {
              config.onUpdate(registration);
            }
          } else {
            // At this point, everything has been precached
            console.log('Content is cached for offline use.');
            
            // Execute callback
            if (config?.onSuccess) {
              config.onSuccess(registration);
            }
          }
        }
      };
    };
  } catch (error) {
    console.error('Error during service worker registration:', error);
  }
}

/**
 * Check if a service worker is valid
 */
async function checkValidServiceWorker(swUrl: string, config?: Config): Promise<void> {
  try {
    // Check if the service worker can be found
    const response = await fetch(swUrl, {
      headers: { 'Service-Worker': 'script' }
    });
    
    // Ensure response is valid
    const contentType = response.headers.get('content-type');
    const validContentType = contentType?.includes('javascript');
    
    if (response.status === 404 || !validContentType) {
      // No service worker found. Probably a different app. Reload the page.
      console.log('No service worker found. Refreshing browser...');
      const browser = await navigator.serviceWorker.ready;
      await browser.unregister();
      window.location.reload();
    } else {
      // Service worker found. Proceed as normal.
      await registerValidSW(swUrl, config);
    }
  } catch (error) {
    console.log('No internet connection found. App is running in offline mode.');
  }
}

/**
 * Unregister the service worker
 */
export async function unregister(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
    } catch (error) {
      console.error('Error unregistering service worker:', error);
    }
  }
}

/**
 * Register for background sync
 */
export async function registerForBackgroundSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-workouts');
      return true;
    } catch (error) {
      console.error('Error registering for background sync:', error);
      return false;
    }
  }
  return false;
} 