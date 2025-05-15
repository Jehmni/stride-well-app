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

// Register Dashboard-specific service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/dashboard-sw.js')
      .then(registration => {
        console.log('Dashboard SW registered:', registration);
      })
      .catch(error => {
        console.error('Dashboard SW registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for offline support
registerServiceWorker();
