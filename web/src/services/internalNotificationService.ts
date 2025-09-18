/**
 * Internal notification service for frontend
 * Handles communication with backend notification API
 */

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface InternalNotificationData {
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

export interface NotificationPageData {
  content: InternalNotificationData[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}

class InternalNotificationService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/notifications`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for authentication
    this.apiClient.interceptors.request.use(
      (config) => {
        // Add auth token if available (could be from localStorage or session)
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get user's notifications with pagination
   */
  async getMyNotifications(page = 0, size = 20): Promise<NotificationPageData> {
    try {
      const response = await this.apiClient.get(`/my?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Get user's unread notifications
   */
  async getUnreadNotifications(): Promise<{ notifications: InternalNotificationData[]; count: number }> {
    try {
      const response = await this.apiClient.get('/my/unread');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await this.apiClient.get('/my/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<void> {
    try {
      await this.apiClient.patch(`/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await this.apiClient.patch('/my/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: number): Promise<void> {
    try {
      await this.apiClient.delete(`/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications
   */
  async deleteAllNotifications(): Promise<void> {
    try {
      await this.apiClient.delete('/my');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      throw error;
    }
  }

  /**
   * Convert internal notification data to frontend format
   */
  convertToFrontendFormat(notification: InternalNotificationData) {
    let type: 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED' | 'info' | 'success' | 'warning' | 'error' = 'info';
    let bookingCode: string | undefined;

    if (notification.metadata) {
      try {
        const metadata = JSON.parse(notification.metadata);
        bookingCode = metadata.bookingCode;
        
        switch (metadata.type) {
          case 'BOOKING_CREATED':
            type = 'info';
            break;
          case 'BOOKING_APPROVED':
            type = 'BOOKING_APPROVED';
            break;
          case 'BOOKING_REJECTED':
            type = 'BOOKING_REJECTED';
            break;
          case 'PAYMENT_CONFIRMED':
            type = 'success';
            break;
          case 'BOOKING_APPROVAL_REQUIRED':
            type = 'warning';
            break;
          default:
            type = 'info';
        }
      } catch (e) {
        console.warn('Failed to parse notification metadata:', e);
      }
    }

    return {
      id: notification.id.toString(),
      title: notification.title,
      message: notification.message,
      type,
      timestamp: notification.createdAt,
      read: notification.read,
      bookingCode,
      priority: notification.priority,
    };
  }
}

export const internalNotificationService = new InternalNotificationService();
export default internalNotificationService;