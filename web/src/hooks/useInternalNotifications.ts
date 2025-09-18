/**
 * Custom hook for managing internal notifications
 * Integrates with backend API for notification management
 */

import { useState, useEffect, useCallback } from 'react';
import { internalNotificationService } from '@/services/internalNotificationService';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED' | 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  bookingCode?: string;
  priority?: string;
}

export interface UseInternalNotificationsReturn {
  notifications: NotificationData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  removeNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useInternalNotifications(): UseInternalNotificationsReturn {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await internalNotificationService.getMyNotifications(0, 50);
      const formattedNotifications = response.content.map(notification =>
        internalNotificationService.convertToFrontendFormat(notification)
      );
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const count = await internalNotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch initial notifications and unread count
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await internalNotificationService.markAsRead(parseInt(id));
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      setError('Failed to mark notification as read');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await internalNotificationService.markAllAsRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      setError('Failed to mark all notifications as read');
    }
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    try {
      await internalNotificationService.deleteNotification(parseInt(id));
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Decrease unread count if the deleted notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      setError('Failed to delete notification');
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    try {
      await internalNotificationService.deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
      setError('Failed to clear all notifications');
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}