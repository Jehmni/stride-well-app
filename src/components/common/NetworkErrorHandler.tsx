import React, { useEffect, useState } from 'react';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface NetworkErrorHandlerProps {
  children: React.ReactNode;
}

const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasChunkError, setHasChunkError] = useState(false);
  const [isDashboardError, setIsDashboardError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Handle script errors, including chunk loading failures
    const handleError = (event: ErrorEvent) => {
      const { message, filename } = event;
      console.error('Script error detected:', message, filename);
      
      // Check if this is a Dashboard chunk loading error
      if (message.includes('Dashboard-') && message.includes('Failed to fetch')) {
        setIsDashboardError(true);
        setHasChunkError(true);
        setErrorMessage(message);
        event.preventDefault();
      }
      // Check if this is a general chunk loading error
      else if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Loading chunk') ||
        message.includes('Loading CSS chunk')
      ) {
        setHasChunkError(true);
        setErrorMessage(message);
        event.preventDefault();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleReload = () => {
    // Clear cached resources if possible
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear error state
    setHasChunkError(false);
    setIsDashboardError(false);
    setErrorMessage(null);
    
    // Reload the page
    window.location.reload();
  };

  // Redirect to another page if Dashboard fails to load
  const handleRedirectHome = () => {
    window.location.href = '/';
  };

  if (!isOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-50 p-4">
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>
            Your device is currently offline. Some features may be unavailable.
          </AlertDescription>
        </Alert>
        {children}
      </div>
    );
  }

  if (isDashboardError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Dashboard Loading Error</h2>
        <p className="mb-4">We're having trouble loading the Dashboard component. This is a known issue we're working to fix.</p>
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-md mx-auto">
          <Button 
            onClick={handleReload}
            className="flex items-center gap-2 flex-1"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={handleRedirectHome}
            variant="outline"
            className="flex items-center gap-2 flex-1"
          >
            Go to Homepage
          </Button>
        </div>
        {errorMessage && (
          <p className="text-xs text-gray-500 mt-8 max-w-lg mx-auto overflow-hidden text-ellipsis">
            Error details: {errorMessage}
          </p>
        )}
      </div>
    );
  }

  if (hasChunkError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Something went wrong loading the app</h2>
        <p className="mb-2">We're having trouble loading some resources. This might be due to:</p>
        <ul className="list-disc text-left mb-4 max-w-md mx-auto">
          <li>A temporary network issue</li>
          <li>An outdated cached version of the app</li>
          <li>A problem with the app deployment</li>
        </ul>
        {errorMessage && (
          <p className="text-xs text-gray-500 mb-4 max-w-lg mx-auto overflow-hidden text-ellipsis">
            Error details: {errorMessage}
          </p>
        )}
        <Button 
          onClick={handleReload}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reload App
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};

export default NetworkErrorHandler; 