import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle, Bell } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

export interface NotificationBannerProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  persistent?: boolean;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  type,
  title,
  message,
  duration = 8000,
  onClose,
  action,
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, persistent, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-100" />;
      case 'error':
        return <AlertCircle className="h-6 w-6 text-red-100" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-orange-100" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-100" />;
      default:
        return <Bell className="h-6 w-6 text-gray-100" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-400';
      case 'error':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-400';
      case 'info':
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-blue-400';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white border-gray-400';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 transform transition-all duration-300 ease-in-out",
      isVisible ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className={cn(
        "mx-4 mt-4 rounded-xl border-2 shadow-2xl backdrop-blur-sm",
        getStyles()
      )}>
        <div className="flex items-start p-4">
          {/* Icon */}
          <div className="flex-shrink-0 mr-3 mt-0.5">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold leading-6">
                {title}
              </h3>
              <div className="flex items-center space-x-2">
                {action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={action.onClick}
                    className="bg-white/20 text-white border-white/30 hover:bg-white/30 hover:text-white"
                  >
                    {action.label}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {message && (
              <div className="mt-2">
                <p className="text-sm leading-5 opacity-90">
                  {message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner; 