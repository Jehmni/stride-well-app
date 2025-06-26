/**
 * Enhanced Error Boundary Component
 * Provides better error handling and user experience
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { ERROR_MESSAGES } from '@/lib/constants';

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  level: 'page' | 'component' | 'critical';
  errorId: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError } = this.props;
    
    this.setState({
      errorInfo,
    });

    // Log error details
    console.error('Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Send error to external logging service
    this.logErrorToService(error, errorInfo);
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to your error logging service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: localStorage.getItem('userId'), // if available
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      errorInfo,
      sessionId: sessionStorage.getItem('sessionId'),
    };

    // Example: Send to external service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error);

    console.error('Error Report:', errorReport);
  };

  private resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleRetry = () => {
    this.resetErrorBoundary();
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    const { hasError, error, errorInfo, errorId } = this.state;
    const { children, fallback: FallbackComponent, level = 'component' } = this.props;

    if (hasError && error) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetErrorBoundary}
            level={level}
            errorId={errorId}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetErrorBoundary}
          level={level}
          errorId={errorId}
        />
      );
    }

    return children;
  }
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
  level,
  errorId
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return 'Critical Application Error';
      case 'page':
        return 'Page Error';
      case 'component':
      default:
        return 'Something went wrong';
    }
  };

  const getErrorDescription = () => {
    switch (level) {
      case 'critical':
        return 'A critical error has occurred that affects the entire application.';
      case 'page':
        return 'An error occurred while loading this page.';
      case 'component':
      default:
        return 'An error occurred in this component.';
    }
  };

  const getErrorActions = () => {
    switch (level) {
      case 'critical':
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        );
      case 'page':
        return (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button variant="outline" onClick={() => window.history.back()} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        );
      case 'component':
      default:
        return (
          <Button onClick={resetError} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center p-4 ${level === 'critical' ? 'min-h-screen' : 'min-h-[200px]'}`}>
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">{getErrorTitle()}</CardTitle>
          <CardDescription>{getErrorDescription()}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* User-friendly error message */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error.message || ERROR_MESSAGES.SERVER_ERROR}
            </AlertDescription>
          </Alert>

          {/* Error actions */}
          <div className="flex justify-center">
            {getErrorActions()}
          </div>

          {/* Development error details */}
          {isDevelopment && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Developer Details
                </div>
              </summary>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <div className="text-xs font-mono space-y-2">
                  <div>
                    <strong>Error ID:</strong> {errorId}
                  </div>
                  <div>
                    <strong>Error:</strong> {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 max-h-32 overflow-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap text-xs mt-1 max-h-32 overflow-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </details>
          )}

          {/* Error ID for support */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Error ID: <code className="bg-muted px-1 rounded">{errorId}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please include this ID when reporting the issue.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// HOC for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

// Async Error Handler Hook
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    handleError,
    resetError
  };
};

// Specific Error Boundary for Async Components
export const AsyncErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="component"
    onError={(error, errorInfo) => {
      console.error('Async component error:', error, errorInfo);
    }}
    fallback={({ error, resetError }) => (
      <Alert className="m-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load component: {error.message}</span>
          <Button size="sm" variant="outline" onClick={resetError}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    )}
  >
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;
