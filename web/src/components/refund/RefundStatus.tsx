"use client";

import React from 'react';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface RefundStatusProps {
  booking: {
    refundRequested?: boolean;
    refundApproved?: boolean;
    refundRejected?: boolean;
    refundReason?: string;
    refundRequestedAt?: string;
    refundProcessedAt?: string;
    refundProcessedBy?: string;
    refundNotes?: string;
  };
}

const RefundStatus: React.FC<RefundStatusProps> = ({ booking }) => {
  if (!booking.refundRequested) {
    return null;
  }

  const getRefundStatus = () => {
    if (booking.refundApproved) {
      return {
        status: 'approved',
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: <CheckCircle className="h-4 w-4" />,
        text: 'Refund Approved'
      };
    } else if (booking.refundRejected) {
      return {
        status: 'rejected',
        color: 'text-red-600 bg-red-50 border-red-200',
        icon: <XCircle className="h-4 w-4" />,
        text: 'Refund Rejected'
      };
    } else {
      return {
        status: 'pending',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        icon: <Clock className="h-4 w-4" />,
        text: 'Refund Pending Review'
      };
    }
  };

  const statusInfo = getRefundStatus();

  return (
    <div className="mt-3 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-2 mb-3">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="text-sm font-medium">{statusInfo.text}</span>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1">
          <span className="font-medium text-gray-700">Requested:</span>
          <span className="text-gray-600">
            {booking.refundRequestedAt 
              ? new Date(booking.refundRequestedAt).toLocaleString()
              : 'Unknown'
            }
          </span>
        </div>

        {booking.refundReason && (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-gray-700">Reason:</span>
            <span className="text-gray-600 bg-white p-2 rounded border text-xs">
              {booking.refundReason}
            </span>
          </div>
        )}

        {(booking.refundApproved || booking.refundRejected) && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1">
              <span className="font-medium text-gray-700">Processed:</span>
              <span className="text-gray-600">
                {booking.refundProcessedAt 
                  ? new Date(booking.refundProcessedAt).toLocaleString()
                  : 'Unknown'
                }
              </span>
            </div>

            {booking.refundProcessedBy && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                <span className="font-medium text-gray-700">Processed by:</span>
                <span className="text-gray-600">{booking.refundProcessedBy}</span>
              </div>
            )}

            {booking.refundNotes && (
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-700">Notes:</span>
                <span className="text-gray-600 bg-white p-2 rounded border text-xs">
                  {booking.refundNotes}
                </span>
              </div>
            )}
          </>
        )}

        {statusInfo.status === 'pending' && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-yellow-800">
              Your refund request is being reviewed by our accounting team. 
              You will be notified once a decision is made.
            </span>
          </div>
        )}

        {statusInfo.status === 'approved' && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-green-800">
              Your refund has been approved. The amount will be credited to your original 
              payment method within 3-5 business days.
            </span>
          </div>
        )}

        {statusInfo.status === 'rejected' && (
          <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded">
            <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-red-800">
              Your refund request has been rejected. If you have questions, 
              please contact our customer service team.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundStatus;