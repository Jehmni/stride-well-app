// Type definitions for Service Worker API
// These extend the built-in types with additional features

interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistration {
  sync: SyncManager;
}

interface WindowEventMap {
  'sync': Event;
} 