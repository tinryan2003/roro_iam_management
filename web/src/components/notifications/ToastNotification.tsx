/**
 * Toast notification component for showing popup notifications
 */

'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastNotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // Auto-dismiss after this many milliseconds (default: 5000)
  bookingCode?: string;
}

interface ToastNotificationProps {
  notification: ToastNotificationData;
  onDismiss: (id: string) => void;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleDismiss = React.useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300); // Animation duration
  }, [notification.id, onDismiss]);

  useEffect(() => {
    // Show animation
    const showTimer = setTimeout(() => setIsVisible(true), 50);
    
    // Auto-dismiss timer
    const autoDismissTimer = setTimeout(() => {
      handleDismiss();
    }, notification.duration || 5000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(autoDismissTimer);
    };
  }, [notification.duration, handleDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-900 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900 dark:border-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-900 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 w-96 max-w-sm mx-auto transition-all duration-300 ease-in-out transform ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`p-4 rounded-lg border shadow-lg ${getColorClasses()}`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {notification.title}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {notification.message}
                </p>
                {notification.bookingCode && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Booking: {notification.bookingCode}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleDismiss}
                title="Dismiss notification"
                className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification;