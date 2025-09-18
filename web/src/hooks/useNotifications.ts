/**
 * Custom hook for managing real-time notifications
 * Integrates with notification service via API calls
 */

import { useState, useCallback } from 'react';
import notificationService, { NotificationRequest } from '@/services/notificationService';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED' | 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  bookingCode?: string;
}

export interface UseNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  addNotification: (notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>) => void;
  sendNotification: (request: NotificationRequest) => Promise<boolean>;
  sendBookingNotification: (
    email: string,
    name: string,
    bookingCode: string,
    type: 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED'
  ) => Promise<boolean>;
  testNotification: () => Promise<boolean>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isConnected] = useState(true); // API-based notifications are always "connected"

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((
    notification: Omit<NotificationData, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const sendNotification = useCallback(async (request: NotificationRequest): Promise<boolean> => {
    try {
      await notificationService.sendNotification(request);
      console.log('✅ Notification sent successfully');
      
      // Add to local notifications for UI feedback
      addNotification({
        type: 'success',
        title: 'Notification Sent',
        message: `Email notification sent to ${request.recipientEmail}`,
        bookingCode: request.bookingCode,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      
      // Add error notification to UI
      addNotification({
        type: 'error',
        title: 'Notification Failed',
        message: `Failed to send notification to ${request.recipientEmail}`,
        bookingCode: request.bookingCode,
      });
      
      return false;
    }
  }, [addNotification]);

  const sendBookingNotification = useCallback(async (
    email: string,
    name: string,
    bookingCode: string,
    type: 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED'
  ): Promise<boolean> => {
    try {
      await notificationService.sendBookingNotification(email, name, bookingCode, type);
      
      // Also add to local notifications for UI
      const typeMap = {
        BOOKING_CREATED: 'info' as const,
        BOOKING_APPROVED: 'success' as const,
        BOOKING_REJECTED: 'error' as const,
        PAYMENT_REQUIRED: 'warning' as const,
        BOOKING_COMPLETED: 'success' as const,
      };

      const titleMap = {
        BOOKING_CREATED: 'Booking Created',
        BOOKING_APPROVED: 'Booking Approved',
        BOOKING_REJECTED: 'Booking Rejected',
        PAYMENT_REQUIRED: 'Payment Required',
        BOOKING_COMPLETED: 'Journey Complete',
      };

      addNotification({
        type: typeMap[type],
        title: titleMap[type],
        message: `Email sent to ${email} for booking ${bookingCode}`,
        bookingCode,
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send booking notification:', error);
      
      addNotification({
        type: 'error',
        title: 'Notification Failed',
        message: `Failed to send ${type} notification for booking ${bookingCode}`,
        bookingCode,
      });
      
      return false;
    }
  }, [addNotification]);

  const testNotification = useCallback(async (): Promise<boolean> => {
    try {
      await notificationService.testNotification();
      console.log('✅ Test notification sent successfully');
      
      addNotification({
        type: 'success',
        title: 'Test Notification',
        message: 'Test notification sent successfully',
      });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
      
      addNotification({
        type: 'error',
        title: 'Test Failed',
        message: 'Failed to send test notification',
      });
      
      return false;
    }
  }, [addNotification]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    addNotification,
    sendNotification,
    sendBookingNotification,
    testNotification,
  };
}
