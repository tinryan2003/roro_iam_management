'use client';

import React from 'react';
import { Bell, CheckCircle, XCircle, AlertTriangle, Info, Send } from 'lucide-react';
import { useNotificationManager } from '@/components/notifications/NotificationManager';

export default function NotificationDemoPage() {
  const {
    showToast,
    notifyBookingCreated,
    notifyBookingApproved,
    notifyBookingRejected,
    notifyPaymentConfirmed,
    notifyNewBookingForApproval,
    unreadCount,
    refreshUnreadCount,
    clearAllToasts
  } = useNotificationManager();

  const handleTestToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Success!', message: 'Operation completed successfully.' },
      error: { title: 'Error!', message: 'Something went wrong. Please try again.' },
      warning: { title: 'Warning!', message: 'Please check your input and try again.' },
      info: { title: 'Information', message: 'Here is some important information for you.' }
    };

    showToast({
      ...messages[type],
      type,
      bookingCode: `BK${Math.floor(Math.random() * 10000)}`
    });
  };

  const handleBookingDemo = () => {
    const bookingCode = `BK${Math.floor(Math.random() * 100000)}`;
    
    // Simulate booking creation workflow
    notifyBookingCreated(bookingCode);
    
    // After 3 seconds, show approval notification
    setTimeout(() => {
      notifyBookingApproved(bookingCode);
    }, 3000);
    
    // After 6 seconds, show payment confirmation
    setTimeout(() => {
      notifyPaymentConfirmed(bookingCode, '$150.00');
    }, 6000);
  };

  const handleRejectionDemo = () => {
    const bookingCode = `BK${Math.floor(Math.random() * 100000)}`;
    notifyBookingRejected(bookingCode, 'Invalid vehicle registration number');
  };

  const handleApprovalDemo = () => {
    const bookingCode = `BK${Math.floor(Math.random() * 100000)}`;
    notifyNewBookingForApproval(bookingCode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Bell className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Notification System Demo
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Test the internal notification system with live examples
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unread Count:
              </span>
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            </div>
            
            <button
              onClick={refreshUnreadCount}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Refresh Count
            </button>
            
            <button
              onClick={clearAllToasts}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear All Toasts
            </button>
          </div>
        </div>

        {/* Demo Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Toast Types */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Basic Toast Notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Test different types of toast notifications
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleTestToast('success')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Show Success Toast</span>
              </button>
              
              <button
                onClick={() => handleTestToast('error')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Show Error Toast</span>
              </button>
              
              <button
                onClick={() => handleTestToast('warning')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Show Warning Toast</span>
              </button>
              
              <button
                onClick={() => handleTestToast('info')}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>Show Info Toast</span>
              </button>
            </div>
          </div>

          {/* Booking Workflow Demos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Booking Workflow Notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Test booking-specific notification sequences
            </p>
            
            <div className="space-y-3">
              <button
                onClick={handleBookingDemo}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Complete Booking Flow</span>
              </button>
              
              <button
                onClick={handleRejectionDemo}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Booking Rejection</span>
              </button>
              
              <button
                onClick={handleApprovalDemo}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Approval Required</span>
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Complete Booking Flow:
              </h3>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>1. Booking created (immediate)</li>
                <li>2. Booking approved (after 3 seconds)</li>
                <li>3. Payment confirmed (after 6 seconds)</li>
              </ol>
            </div>
          </div>

          {/* Navigation to Full Page */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Full Notification Management
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              View and manage all notifications in a dedicated page
            </p>
            
            <div className="flex space-x-4">
              <a
                href="/notifications"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>View All Notifications</span>
              </a>
              
              <button
                onClick={() => {
                  // Simulate multiple notifications for demo
                  notifyBookingCreated('BK12345');
                  setTimeout(() => notifyNewBookingForApproval('BK12346'), 1000);
                  setTimeout(() => notifyPaymentConfirmed('BK12340', '$89.50'), 2000);
                }}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Generate Sample Notifications</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How It Works
          </h3>
          <div className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>• <strong>Toast Notifications:</strong> Popup notifications appear in the top-right corner</p>
            <p>• <strong>Auto-dismiss:</strong> Most notifications disappear after 5-10 seconds</p>
            <p>• <strong>Manual dismiss:</strong> Click the X button to close immediately</p>
            <p>• <strong>Persistent notifications:</strong> Important notifications (like approval requests) don&apos;t auto-dismiss</p>
            <p>• <strong>Unread count:</strong> Shows in the navbar bell icon and updates automatically</p>
            <p>• <strong>Full management:</strong> View all notifications in the dedicated notifications page</p>
          </div>
        </div>
      </div>
    </div>
  );
}