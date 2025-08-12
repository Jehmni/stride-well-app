import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, Clock, Calendar } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface InAppNotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'reminder';
  title: string;
  message: string;
  duration?: number;
  actions?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  }[];
  timestamp?: Date;
  persistent?: boolean;
}

interface InAppNotificationProps {
  notification: InAppNotificationData;
  onDismiss: (id: string) => void;
  onAction?: (action: string) => void;
}

const InAppNotification: React.FC<InAppNotificationProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!notification.persistent && notification.duration !== undefined) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(notification.id), 300); // Wait for animation
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, notification.persistent, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getTypeStyles = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20';
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'reminder':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
        getTypeStyles(),
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {notification.title}
            </h4>
            {notification.timestamp && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {notification.timestamp.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="h-6 w-6 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Message */}
      <div className="mt-2">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {notification.message}
        </p>
      </div>

      {/* Actions */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {notification.actions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              variant={action.variant || 'default'}
              onClick={() => {
                action.onClick();
                if (onAction) onAction(action.label);
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}

      {/* Expandable content for reminders */}
      {notification.type === 'reminder' && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {isExpanded ? 'Show less' : 'Show details'}
          </Button>
          
          {isExpanded && (
            <div className="mt-2 space-y-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Next occurrence: {notification.timestamp?.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Time: {notification.timestamp?.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InAppNotification;
