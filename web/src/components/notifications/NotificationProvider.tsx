/**
 * Notification Manager for handling toast notifications
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastNotification, { ToastNotificationData } from './ToastNotification';

interface NotificationContextType {
  showNotification: (notification: Omit<ToastNotificationData, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useToastNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useToastNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<ToastNotificationData[]>([]);

  const showNotification = useCallback((notification: Omit<ToastNotificationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: ToastNotificationData = {
      ...notification,
      id,
      duration: notification.duration || 5000,
    };

    setNotifications(prev => [...prev, newNotification]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider 
      value={{ 
        showNotification, 
        dismissNotification, 
        clearAllNotifications 
      }}
    >
      {children}
      
      {/* Render toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className={`relative`}
            style={{ 
              transform: `translateY(${index * 80}px)`,
              zIndex: 1000 - index 
            }}
          >
            <ToastNotification
              notification={notification}
              onDismiss={dismissNotification}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};