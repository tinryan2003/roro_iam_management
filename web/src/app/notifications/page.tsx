'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, Filter, RefreshCw } from 'lucide-react';

interface InternalNotification {
  id: number;
  title: string;
  message: string;
  priority: string;
  status: string;
  read: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: string;
}

interface NotificationPageData {
  content: InternalNotification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

// Mock internal notification service for demo
class MockInternalNotificationService {
  async getMyNotifications(page = 0, size = 20): Promise<NotificationPageData> {
    // Mock data for demo
    const mockNotifications: InternalNotification[] = [
      {
        id: 1,
        title: "Booking Created Successfully",
        message: "Your booking BK12345 has been created and is pending approval.",
        priority: "NORMAL",
        status: "UNREAD",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        metadata: '{"type":"BOOKING_CREATED","bookingCode":"BK12345"}'
      },
      {
        id: 2,
        title: "New Booking Requires Approval",
        message: "Booking BK12346 is waiting for your approval.",
        priority: "HIGH",
        status: "UNREAD",
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        metadata: '{"type":"BOOKING_APPROVAL_REQUIRED","bookingCode":"BK12346"}'
      },
      {
        id: 3,
        title: "Booking Approved",
        message: "Your booking BK12340 has been approved. You can now proceed with payment.",
        priority: "NORMAL",
        status: "READ",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        metadata: '{"type":"BOOKING_APPROVED","bookingCode":"BK12340"}'
      },
      {
        id: 4,
        title: "Payment Confirmed",
        message: "Payment of $150.00 for booking BK12340 has been confirmed.",
        priority: "NORMAL",
        status: "READ",
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        readAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 10).toISOString(),
        metadata: '{"type":"PAYMENT_CONFIRMED","bookingCode":"BK12340","amount":"$150.00"}'
      }
    ];

    const start = page * size;
    const end = start + size;
    const paginatedNotifications = mockNotifications.slice(start, end);

    return {
      content: paginatedNotifications,
      totalElements: mockNotifications.length,
      totalPages: Math.ceil(mockNotifications.length / size),
      currentPage: page,
      size: size
    };
  }

  async getUnreadCount(): Promise<number> {
    const data = await this.getMyNotifications(0, 100);
    return data.content.filter(n => !n.read).length;
  }

  async markAsRead(notificationId: number): Promise<void> {
    console.log(`Marking notification ${notificationId} as read`);
    return Promise.resolve();
  }

  async markAllAsRead(): Promise<void> {
    console.log('Marking all notifications as read');
    return Promise.resolve();
  }

  async deleteNotification(notificationId: number): Promise<void> {
    console.log(`Deleting notification ${notificationId}`);
    return Promise.resolve();
  }

  async deleteAllNotifications(): Promise<void> {
    console.log('Deleting all notifications');
    return Promise.resolve();
  }
}

const mockService = new MockInternalNotificationService();

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<InternalNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await mockService.getMyNotifications(currentPage, 10);
      setNotifications(data.content);
      setTotalPages(data.totalPages);
      
      const count = await mockService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await mockService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true, status: 'READ' } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await mockService.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, status: 'READ' }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await mockService.deleteNotification(id);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'URGENT':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'NORMAL':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'LOW':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBookingCode = (metadata?: string) => {
    if (!metadata) return null;
    try {
      const parsed = JSON.parse(metadata);
      return parsed.bookingCode;
    } catch {
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Notifications
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchNotifications}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <div className="flex space-x-2">
              {(['all', 'unread', 'read'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm">
                {filter === 'unread' ? 'You have no unread notifications' : 
                 filter === 'read' ? 'You have no read notifications' : 
                 'You have no notifications yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => {
                const bookingCode = getBookingCode(notification.metadata);
                
                return (
                  <div
                    key={notification.id}
                    className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-medium ${
                            !notification.read 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {notification.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                            getPriorityColor(notification.priority)
                          }`}>
                            {notification.priority}
                          </span>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                          {bookingCode && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                              {bookingCode}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}