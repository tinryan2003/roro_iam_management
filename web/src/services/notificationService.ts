/**
 * Notification service client for sending notifications via REST API
 */

import axios from 'axios';

const NOTIFICATION_SERVICE_URL = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:8087';

export interface NotificationRequest {
  recipientEmail: string;
  recipientName: string;
  notificationType: 'EMAIL' | 'SMS' | 'PUSH';
  subject: string;
  message: string;
  bookingCode?: string;
  templateData?: Record<string, unknown>;
  templateName?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  channel?: 'WEB' | 'MOBILE' | 'EMAIL';
}

class NotificationServiceClient {
  private apiClient = axios.create({
    baseURL: `${NOTIFICATION_SERVICE_URL}/api/notifications`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  constructor() {
    // Add request interceptor for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        console.log('📤 Sending notification request:', config.url);
        return config;
      },
      (error) => {
        console.error('❌ Notification request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.apiClient.interceptors.response.use(
      (response) => {
        console.log('✅ Notification response:', response.status);
        return response;
      },
      (error) => {
        console.error('❌ Notification response error:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  async sendNotification(request: NotificationRequest): Promise<string> {
    try {
      const response = await this.apiClient.post('/send', request);
      return response.data;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  async testNotification(): Promise<string> {
    try {
      const response = await this.apiClient.post('/test');
      return response.data;
    } catch (error) {
      console.error('Failed to test notification:', error);
      throw error;
    }
  }

  async sendBookingNotification(
    email: string,
    name: string,
    bookingCode: string,
    type: 'BOOKING_CREATED' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'PAYMENT_REQUIRED' | 'BOOKING_COMPLETED'
  ): Promise<string> {
    const templates = {
      BOOKING_CREATED: {
        subject: 'Booking Created Successfully',
        message: `Your ferry booking ${bookingCode} has been created and is being reviewed by our team.`,
      },
      BOOKING_APPROVED: {
        subject: 'Booking Approved',
        message: `Great news! Your ferry booking ${bookingCode} has been approved.`,
      },
      BOOKING_REJECTED: {
        subject: 'Booking Rejected',
        message: `We regret to inform you that your booking ${bookingCode} has been rejected.`,
      },
      PAYMENT_REQUIRED: {
        subject: 'Payment Required',
        message: `Please complete payment for your booking ${bookingCode} within 24 hours.`,
      },
      BOOKING_COMPLETED: {
        subject: 'Journey Complete',
        message: `Thank you for traveling with us! Your booking ${bookingCode} is now complete.`,
      },
    };

    const template = templates[type];
    
    return this.sendNotification({
      recipientEmail: email,
      recipientName: name,
      notificationType: 'EMAIL',
      subject: template.subject,
      message: template.message,
      bookingCode,
      templateData: {
        bookingCode,
        customerName: name,
        type,
      },
    });
  }
}

export const notificationService = new NotificationServiceClient();
export default notificationService;
