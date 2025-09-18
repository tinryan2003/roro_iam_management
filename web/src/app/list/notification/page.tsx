'use client';

import React, { useState } from 'react';
import { useInternalNotifications, NotificationData } from '@/hooks/useInternalNotifications';
import { useToastNotifications } from '@/components/notifications/NotificationProvider';
import { format } from 'date-fns';

// Icons
const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// Priority badge component
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const getColorClass = () => {
    switch (priority.toUpperCase()) {
      case 'HIGH':
      case 'URGENT':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getColorClass()}`}>
      {priority}
    </span>
  );
};

// Status badge component
const StatusBadge: React.FC<{ read: boolean }> = ({ read }) => (
  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${
    read 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }`}>
    {read ? 'Read' : 'Unread'}
  </span>
);

// Notification item component
const NotificationItem: React.FC<{
  notification: NotificationData;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ notification, onMarkAsRead, onDelete }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = async () => {
    if (notification.read) return;
    setIsLoading(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
      !notification.read ? 'border-l-4 border-l-blue-500' : 'border-gray-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
              {notification.title}
            </h3>
            <PriorityBadge priority={notification.priority || 'NORMAL'} />
            <StatusBadge read={notification.read} />
          </div>
          
          <p className={`text-sm mb-2 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {format(new Date(notification.timestamp), 'MMM dd, yyyy HH:mm')}
            </span>
            {notification.bookingCode && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                Booking: {notification.bookingCode}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1 ml-4">
          {!notification.read && (
            <button
              onClick={handleMarkAsRead}
              disabled={isLoading}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Mark as read"
            >
              <CheckIcon />
            </button>
          )}
          
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Delete notification"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main notification page component
const NotificationPage: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    fetchNotifications
  } = useInternalNotifications();
  
  const { showNotification } = useToastNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'read':
        return notification.read;
      default:
        return true;
    }
  });

  // Handle operations with toast feedback
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      showNotification({
        type: 'success',
        title: 'Notification marked as read',
        message: 'Notification status updated successfully'
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to mark notification as read'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      showNotification({
        type: 'success',
        title: 'All notifications marked as read',
        message: `Marked ${unreadCount} notifications as read`
      });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to mark all notifications as read'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await removeNotification(id);
      showNotification({
        type: 'success',
        title: 'Notification deleted',
        message: 'Notification removed successfully'
      });
    } catch (err) {
      console.error('Error deleting notification:', err);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete notification'
      });
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await clearAll();
        showNotification({
          type: 'success',
          title: 'All notifications cleared',
          message: 'All notifications have been deleted'
        });
      } catch (err) {
        console.error('Error clearing all notifications:', err);
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to clear all notifications'
        });
      }
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchNotifications();
      showNotification({
        type: 'success',
        title: 'Notifications refreshed',
        message: 'Latest notifications loaded'
      });
    } catch (err) {
      console.error('Error refreshing notifications:', err);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to refresh notifications'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BellIcon />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <RefreshIcon />
                Refresh
              </button>
              
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <CheckIcon />
                  Mark All Read
                </button>
              )}
              
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  <TrashIcon />
                  Clear All
                </button>
              )}
            </div>
          </div>
          
          {/* Filter tabs */}
          <div className="flex border-b border-gray-200 mt-6 -mb-6">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'read', label: 'Read', count: notifications.length - unreadCount }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'unread' | 'read')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tab.count > 0 && `(${tab.count})`}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading notifications</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading notifications...</span>
            </div>
          )}

          {/* Empty state */}
          {!loading && filteredNotifications.length === 0 && !error && (
            <div className="text-center py-12">
              <BellIcon />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {filter === 'all' ? 'No notifications' : `No ${filter} notifications`}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {filter === 'all' 
                  ? "You're all caught up! No notifications to display."
                  : `No ${filter} notifications found. Try checking other tabs.`
                }
              </p>
            </div>
          )}

          {/* Notification list */}
          {!loading && filteredNotifications.length > 0 && (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;
