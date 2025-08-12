import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const GoogleAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // This page is just for OAuth redirect handling
    // The actual OAuth flow happens in the popup
    setStatus('success');
    setMessage('Google Calendar connected successfully!');
  }, []);

  const handleClose = () => {
    // Close this window and return to the main app
    window.close();
  };

  const handleReturnToApp = () => {
    // Navigate back to the reminders page
    navigate('/reminders');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            Google Calendar Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {status === 'loading' && (
              <p className="text-gray-600">Connecting to Google Calendar...</p>
            )}
            {status === 'success' && (
              <div className="space-y-3">
                <p className="text-green-600 font-medium">{message}</p>
                <p className="text-sm text-gray-500">
                  You can now close this window and return to the app.
                </p>
              </div>
            )}
            {status === 'error' && (
              <div className="space-y-3">
                <p className="text-red-600 font-medium">{message}</p>
                <p className="text-sm text-gray-500">
                  Please try again or contact support if the problem persists.
                </p>
              </div>
            )}
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={handleClose} 
              variant="outline" 
              className="flex-1"
            >
              Close Window
            </Button>
            {status === 'success' && (
              <Button 
                onClick={handleReturnToApp} 
                className="flex-1"
              >
                Return to App
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleAuthCallback;
