"use client";

import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface RefundRequestButtonProps {
  bookingId: number;
  bookingStatus: string;
  isRefundRequested: boolean;
  onRefundRequested: () => void;
}

const RefundRequestButton: React.FC<RefundRequestButtonProps> = ({
  bookingId,
  bookingStatus,
  isRefundRequested,
  onRefundRequested
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  // Check if refund is available (before IN_REVIEW status)
  const isRefundAvailable = () => {
    const unavailableStatuses = ['IN_REVIEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    return !unavailableStatuses.includes(bookingStatus) && !isRefundRequested;
  };

  const handleRefundRequest = async () => {
    if (reason.length < 10) {
      alert('Please provide a reason of at least 10 characters');
      return;
    }

    if (!session?.accessToken) {
      alert('Authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      // Use the correct API endpoint that matches your backend
      const response = await fetch(`http://localhost:8081/api/booking-workflow/${bookingId}/request-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          reason: reason,
        }),
      });

      if (response.ok) {
        alert('Refund request submitted successfully');
        setIsModalVisible(false);
        setReason('');
        onRefundRequested();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Refund request error:', error);
      alert('Failed to submit refund request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showRefundModal = () => {
    if (window.confirm('Are you sure you want to request a refund? This action cannot be undone.')) {
      setIsModalVisible(true);
    }
  };

  if (!isRefundAvailable()) {
    return null;
  }

  return (
    <>
      <button 
        onClick={showRefundModal}
        className="px-3 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
      >
        Request Refund
      </button>

      {/* Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalVisible(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Request Refund</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Refund *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please explain why you need a refund (minimum 10 characters)..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Characters: {reason.length}/500
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <div className="flex">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <strong>Note:</strong> Refund requests will be reviewed by our accounting team. 
                  Processing may take 3-5 business days.
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalVisible(false);
                  setReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={loading || reason.length < 10}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Submit Refund Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RefundRequestButton;