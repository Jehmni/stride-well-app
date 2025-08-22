import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { register as registerServiceWorker } from './services/serviceWorkerRegistration'
import { preloadDashboardModules } from './utils/modulePreload'

// Preload critical modules to prevent chunk loading errors
preloadDashboardModules().catch(err => {
  console.warn('Module preloading failed:', err);
});

// Register Dashboard-specific service worker only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Avoid registering the dashboard service worker during local development
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/dashboard-sw.js')
      .then(registration => {
        console.log('Dashboard SW registered:', registration);
      })
      .catch(error => {
        console.error('Dashboard SW registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  // Development helper: attempt to unregister any previously-registered dashboard SWs
  // This helps when a developer previously registered /dashboard-sw.js on localhost
  // which can persist and continue to intercept requests even after code changes.
  window.addEventListener('load', async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        const script = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || '';
        if (script.includes('dashboard-sw.js') || (r.scope && r.scope.includes('/dashboard'))) {
          const ok = await r.unregister();
          console.log('Unregistered dashboard SW (dev):', script, 'success=', ok);
        }
      }
    } catch (err) {
      console.warn('Failed to cleanup dashboard service workers in dev:', err);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for offline support
registerServiceWorker();
