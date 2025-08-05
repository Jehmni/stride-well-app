import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationBanner, { NotificationBannerProps } from '@/components/ui/notification-banner';

interface NotificationContextType {
  showNotification: (props: Omit<NotificationBannerProps, 'onClose'>) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationBannerProps | null>(null);

  const showNotification = useCallback((props: Omit<NotificationBannerProps, 'onClose'>) => {
    setNotification({
      ...props,
      onClose: () => setNotification(null),
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification, hideNotification }}>
      {children}
      {notification && <NotificationBanner {...notification} />}
    </NotificationContext.Provider>
  );
}; 