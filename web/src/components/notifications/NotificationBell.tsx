/**
 * Real-time notification component with toast notifications
 * Shows async booking updates from notification service
 */

'use client';

import React, { useState } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Clock, Ship, Send } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED' | 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  bookingCode?: string;
}

interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
  onRead: () => void;
}

function NotificationToast({ notification, onClose, onRead }: NotificationToastProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'BOOKING_APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'BOOKING_REJECTED':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'PAYMENT_REQUIRED':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'BOOKING_COMPLETED':
        return <Ship className="h-5 w-5 text-blue-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'BOOKING_APPROVED':
        return 'bg-green-50 border-green-200';
      case 'BOOKING_REJECTED':
        return 'bg-red-50 border-red-200';
      case 'PAYMENT_REQUIRED':
        return 'bg-yellow-50 border-yellow-200';
      case 'BOOKING_COMPLETED':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`mb-3 p-4 rounded-lg border ${getBgColor()} ${!notification.read ? 'shadow-md' : 'opacity-75'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getIcon()}
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-gray-900">
              {notification.title}
              {notification.bookingCode && (
                <span className="ml-2 text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  {notification.bookingCode}
                </span>
              )}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
            <p className="text-xs text-gray-400 mt-2">
              {new Date(notification.timestamp).toLocaleString()}
            </p>
            {!notification.read && (
              <button
                onClick={onRead}
                className="text-xs text-blue-600 hover:text-blue-800 mt-1"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
          title="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, removeNotification, clearAll, testNotification } = useNotifications();

  const handleTestNotification = async () => {
    await testNotification();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <div className="flex space-x-2">
            <button
              onClick={handleTestNotification}
              className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
              title="Send test notification"
            >
              <Send className="h-3 w-3" />
              Test
            </button>
            {notifications.length > 0 && (
              <>
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear all
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              title="Close notifications panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-xs text-gray-400 mt-1">
              You&apos;ll receive real-time updates here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <NotificationToast
                key={notification.id}
                notification={notification}
                onClose={() => removeNotification(notification.id)}
                onRead={() => markAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount, isConnected } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        title={`${unreadCount} unread notifications`}
      >
        <Bell className="h-6 w-6" />
        
        {/* Connection indicator */}
        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`} />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
}
