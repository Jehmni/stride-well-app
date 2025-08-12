import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Calendar, 
  Brain, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Info,
  Clock,
  Settings
} from 'lucide-react';
import EnhancedWorkoutReminders from '@/components/reminders/EnhancedWorkoutReminders';

const EnhancedRemindersDemo: React.FC = () => {
  const showDemoNotification = () => {
    if (window.addInAppNotification) {
      const notification = {
        type: 'reminder' as const,
        title: 'Demo Reminder',
        message: 'This is a demo of the enhanced in-app notification system!',
        duration: 8000,
        actions: [
          {
            label: 'Got it!',
            onClick: () => console.log('Demo notification action clicked'),
            variant: 'default' as const,
          },
          {
            label: 'Dismiss',
            onClick: () => console.log('Demo notification dismissed'),
            variant: 'outline' as const,
          },
        ],
        timestamp: new Date(),
      };
      window.addInAppNotification(notification);
    }
  };

  const showSuccessNotification = () => {
    if (window.addInAppNotification) {
      const notification = {
        type: 'success' as const,
        title: 'Workout Completed!',
        message: 'Great job! You\'ve completed your morning workout. Keep up the momentum!',
        duration: 5000,
        actions: [
          {
            label: 'View Progress',
            onClick: () => console.log('View progress clicked'),
            variant: 'default' as const,
          },
        ],
        timestamp: new Date(),
      };
      window.addInAppNotification(notification);
    }
  };

  const showWarningNotification = () => {
    if (window.addInAppNotification) {
      const notification = {
        type: 'warning' as const,
        title: 'Workout Reminder',
        message: 'You have a workout scheduled in 30 minutes. Time to prepare!',
        duration: 10000,
        actions: [
          {
            label: 'Start Now',
            onClick: () => console.log('Start workout clicked'),
            variant: 'default' as const,
          },
          {
            label: 'Snooze 15min',
            onClick: () => console.log('Snooze clicked'),
            variant: 'outline' as const,
          },
        ],
        timestamp: new Date(),
      };
      window.addInAppNotification(notification);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Enhanced Reminders System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Experience the next generation of workout reminders with AI-powered suggestions, 
          calendar integration, and beautiful in-app notifications.
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Enhanced In-App Notifications</CardTitle>
            <CardDescription>
              Beautiful, interactive notifications that work even without browser support
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={showDemoNotification} className="w-full">
              Try Demo Notification
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle>Calendar Integration</CardTitle>
            <CardDescription>
              Sync your reminders with Google Calendar, Outlook, and other calendar apps
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="text-sm">
              Google Calendar Ready
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle>AI-Powered Suggestions</CardTitle>
            <CardDescription>
              Get intelligent workout timing recommendations based on your patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge variant="outline" className="text-sm">
              Machine Learning
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Notification Demo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Notification System Demo
          </CardTitle>
          <CardDescription>
            Test different types of in-app notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={showSuccessNotification}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Success Notification
            </Button>
            
            <Button 
              onClick={showWarningNotification}
              variant="outline"
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Warning Notification
            </Button>
            
            <Button 
              onClick={showDemoNotification}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Info className="h-4 w-4" />
              Info Notification
            </Button>
          </div>
          
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Note:</strong> These notifications will appear in the top-right corner of your screen. 
              They're fully interactive and can include custom actions, timers, and rich content.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Features */}
      <Card>
        <CardHeader>
          <CardTitle>Key Features</CardTitle>
          <CardDescription>
            What makes this reminders system special
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Smart Timing</h4>
                <p className="text-sm text-muted-foreground">
                  AI analyzes your workout patterns, energy levels, and schedule to suggest optimal reminder times
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Calendar Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Automatically sync reminders with external calendars for seamless integration
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Rich Notifications</h4>
                <p className="text-sm text-muted-foreground">
                  Interactive notifications with actions, expandable content, and beautiful animations
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Pattern Recognition</h4>
                <p className="text-sm text-muted-foreground">
                  Learns from your workout history to improve suggestion accuracy over time
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <h4 className="font-medium">Cross-Platform</h4>
                <p className="text-sm text-muted-foreground">
                  Works on all devices and browsers, with graceful fallbacks for unsupported features
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Enhanced Reminders Component */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Full Reminders System</h2>
        <EnhancedWorkoutReminders />
      </div>
    </div>
  );
};

export default EnhancedRemindersDemo;
