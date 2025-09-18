'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import ToastNotification, { ToastNotificationData } from './ToastNotification';

interface NotificationContextType {
  // Toast notifications
  showToast: (notification: Omit<ToastNotificationData, 'id'>) => void;
  dismissToast: (id: string) => void;
  clearAllToasts: () => void;
  
  // Convenience methods for common notification types
  notifyBookingCreated: (bookingCode: string) => void;
  notifyBookingApproved: (bookingCode: string) => void;
  notifyBookingRejected: (bookingCode: string, reason?: string) => void;
  notifyPaymentConfirmed: (bookingCode: string, amount: string) => void;
  notifyNewBookingForApproval: (bookingCode: string) => void;
  
  // Unread count and fetching
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationManager = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationManager must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

// Mock service for demo - replace with real internalNotificationService
const mockGetUnreadCount = async (): Promise<number> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.floor(Math.random() * 5)); // Random count for demo
    }, 500);
  });
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastNotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate unique ID for notifications
  const generateId = useCallback(() => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }, []);

  // Show toast notification
  const showToast = useCallback((notification: Omit<ToastNotificationData, 'id'>) => {
    const id = generateId();
    const newToast: ToastNotificationData = {
      ...notification,
      id,
      duration: notification.duration ?? 5000, // Default 5 seconds
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Update unread count when showing new notifications
    setUnreadCount(prev => prev + 1);
  }, [generateId]);

  // Dismiss specific toast
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Refresh unread count from backend
  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await mockGetUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to refresh unread count:', error);
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  // Convenience methods for common notification types
  const notifyBookingCreated = useCallback((bookingCode: string) => {
    showToast({
      title: 'Booking Created Successfully',
      message: `Your booking ${bookingCode} has been created and is pending approval.`,
      type: 'success',
      bookingCode,
      duration: 6000
    });
  }, [showToast]);

  const notifyBookingApproved = useCallback((bookingCode: string) => {
    showToast({
      title: 'Booking Approved',
      message: `Your booking ${bookingCode} has been approved. You can now proceed with payment.`,
      type: 'success',
      bookingCode,
      duration: 8000
    });
  }, [showToast]);

  const notifyBookingRejected = useCallback((bookingCode: string, reason?: string) => {
    showToast({
      title: 'Booking Rejected',
      message: reason || `Your booking ${bookingCode} has been rejected. Please contact support for more information.`,
      type: 'error',
      bookingCode,
      duration: 10000
    });
  }, [showToast]);

  const notifyPaymentConfirmed = useCallback((bookingCode: string, amount: string) => {
    showToast({
      title: 'Payment Confirmed',
      message: `Payment of ${amount} for booking ${bookingCode} has been confirmed successfully.`,
      type: 'success',
      bookingCode,
      duration: 6000
    });
  }, [showToast]);

  const notifyNewBookingForApproval = useCallback((bookingCode: string) => {
    showToast({
      title: 'New Booking Requires Approval',
      message: `Booking ${bookingCode} is waiting for your approval.`,
      type: 'info',
      bookingCode,
      duration: 0 // Don't auto-dismiss important notifications
    });
  }, [showToast]);

  const contextValue: NotificationContextType = {
    showToast,
    dismissToast,
    clearAllToasts,
    notifyBookingCreated,
    notifyBookingApproved,
    notifyBookingRejected,
    notifyPaymentConfirmed,
    notifyNewBookingForApproval,
    unreadCount,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      
      {/* Render toast notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {toasts.map((toast) => (
          <ToastNotification
            key={toast.id}
            notification={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;