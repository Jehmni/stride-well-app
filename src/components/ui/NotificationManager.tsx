import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import InAppNotification, { InAppNotificationData } from './InAppNotification';
import { Bell, X } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface NotificationManagerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
  className?: string;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({
  position = 'top-right',
  maxNotifications = 5,
  className
}) => {
  const [notifications, setNotifications] = useState<InAppNotificationData[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Add notification to the queue
  const addNotification = useCallback((notification: Omit<InAppNotificationData, 'id'>) => {
    const newNotification: InAppNotificationData = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      setUnreadCount(updated.length);
      return updated;
    });
  }, [maxNotifications]);

  // Remove notification from the queue
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      setUnreadCount(updated.length);
      return updated;
    });
  }, []);

  // Handle notification action
  const handleNotificationAction = useCallback((action: string) => {
    console.log('Notification action:', action);
    // Handle different actions here
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Toggle collapse state
  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  // Get position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      default:
        return 'top-4 right-4';
    }
  };

  // Expose addNotification method globally
  useEffect(() => {
    (window as any).addInAppNotification = addNotification;
    return () => {
      delete (window as any).addInAppNotification;
    };
  }, [addNotification]);

  if (notifications.length === 0) {
    return null;
  }

  const notificationContainer = (
    <div className={cn('fixed z-50 flex flex-col gap-2', getPositionClasses(), className)}>
      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-2">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notifications ({unreadCount})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isCollapsed ? (
              <span className="text-xs">▼</span>
            ) : (
              <span className="text-xs">▲</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllNotifications}
            className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {!isCollapsed && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <InAppNotification
              key={notification.id}
              notification={notification}
              onDismiss={removeNotification}
              onAction={handleNotificationAction}
            />
          ))}
        </div>
      )}
    </div>
  );

  // Use portal to render at the top level
  return createPortal(notificationContainer, document.body);
};

export default NotificationManager;
