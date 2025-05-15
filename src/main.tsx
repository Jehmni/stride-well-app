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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for offline support
registerServiceWorker();
