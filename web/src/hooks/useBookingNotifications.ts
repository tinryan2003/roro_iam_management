/**
 * Hook for showing booking-related notifications as toasts
 */

import { useCallback } from 'react';
import { useToastNotifications } from '@/components/notifications/NotificationProvider';

export const useBookingNotifications = () => {
  const { showNotification } = useToastNotifications();

  const showBookingNotification = useCallback((
    type: 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_CONFIRMED',
    bookingCode: string,
    message?: string
  ) => {
    let title: string;
    let notificationType: 'success' | 'error' | 'warning' | 'info';
    let defaultMessage: string;

    switch (type) {
      case 'BOOKING_CREATED':
        title = 'Booking Created';
        notificationType = 'info';
        defaultMessage = `Your booking ${bookingCode} has been created and is pending approval.`;
        break;
      case 'BOOKING_APPROVED':
        title = 'Booking Approved';
        notificationType = 'success';
        defaultMessage = `Your booking ${bookingCode} has been approved!`;
        break;
      case 'BOOKING_REJECTED':
        title = 'Booking Rejected';
        notificationType = 'error';
        defaultMessage = `Your booking ${bookingCode} has been rejected.`;
        break;
      case 'PAYMENT_CONFIRMED':
        title = 'Payment Confirmed';
        notificationType = 'success';
        defaultMessage = `Payment for booking ${bookingCode} has been confirmed.`;
        break;
      default:
        title = 'Booking Update';
        notificationType = 'info';
        defaultMessage = `Booking ${bookingCode} has been updated.`;
    }

    showNotification({
      title,
      message: message || defaultMessage,
      type: notificationType,
      bookingCode,
      duration: 6000, // Show for 6 seconds for booking notifications
    });
  }, [showNotification]);

  const showApprovalNotification = useCallback((bookingCode: string) => {
    showNotification({
      title: 'New Booking Approval Required',
      message: `Booking ${bookingCode} is waiting for your approval.`,
      type: 'warning',
      bookingCode,
      duration: 8000, // Show for 8 seconds for approval notifications
    });
  }, [showNotification]);

  const showGeneralNotification = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info',
    duration = 5000
  ) => {
    showNotification({
      title,
      message,
      type,
      duration,
    });
  }, [showNotification]);

  return {
    showBookingNotification,
    showApprovalNotification,
    showGeneralNotification,
  };
};