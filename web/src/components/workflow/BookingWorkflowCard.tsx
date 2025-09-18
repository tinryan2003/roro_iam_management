"use client";

import React, { useState } from 'react';
import { BookingData } from '@/hooks/useApi';
import BookingStatusBadge, { getNextAction, canPerformAction } from './BookingStatusBadge';

interface BookingWorkflowCardProps {
  booking: BookingData;
  userRole?: string;
  onApprove?: (id: number, notes: string) => void;
  onReject?: (id: number, reason: string) => void;
  onPay?: (id: number) => void;
  onComplete?: (id: number) => void;
  onCancel?: (id: number, reason: string) => void;
  onConfirmArrival?: (id: number) => void;
  onApproveReview?: (id: number, notes: string) => void;
  onProcessRefund?: (id: number, amount: number, notes: string) => void;
  loading?: boolean;
  showActions?: boolean;
}

export default function BookingWorkflowCard({
  booking,
  userRole,
  onApprove,
  onReject,
  onPay,
  onComplete,
  onCancel,
  onConfirmArrival,
  onApproveReview,
  onProcessRefund,
  loading = false,
  showActions = true
}: BookingWorkflowCardProps) {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showReviewApprovalForm, setShowReviewApprovalForm] = useState(false);
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showRefundForm, setShowRefundForm] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [refundAmount, setRefundAmount] = useState(booking.totalAmount);
  const [refundNotes, setRefundNotes] = useState('');

  const nextAction = getNextAction(booking.status, userRole);

  const handleApprove = () => {
    if (onApprove) {
      onApprove(booking.id, notes);
      setShowApprovalForm(false);
      setNotes('');
    }
  };

  const handleReject = () => {
    if (onReject && reason.trim()) {
      onReject(booking.id, reason);
      setShowRejectionForm(false);
      setReason('');
    }
  };

  const handleCancel = () => {
    if (onCancel && reason.trim()) {
      onCancel(booking.id, reason);
      setShowCancelForm(false);
      setReason('');
    }
  };

  const handleProcessRefund = () => {
    if (onProcessRefund && refundAmount > 0) {
      onProcessRefund(booking.id, refundAmount, refundNotes);
      setShowRefundForm(false);
      setRefundNotes('');
    }
  };

  const handleApproveReview = () => {
    if (onApproveReview) {
      onApproveReview(booking.id, notes);
      setShowReviewApprovalForm(false);
      setNotes('');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date Format';
    }
    
    // Format as YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Booking #{booking.bookingCode}
          </h3>
          <p className="text-sm text-gray-600">
            {booking.passengerCount} passenger{booking.passengerCount > 1 ? 's' : ''}
            {booking.vehicleId && ' + Vehicle'}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium">{formatCurrency(booking.totalAmount)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Departure</p>
          <p className="font-medium">{formatDate(booking.departureTime)}</p>
        </div>
      </div>

      {/* Workflow Information */}
      <div className="space-y-3 mb-4">
        {/* Payment Deadline */}
        {booking.paymentDeadline && booking.status === 'WAITING_FOR_PAYMENT' && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-sm text-orange-800">
              <span className="font-medium">Payment Deadline:</span> {formatDate(booking.paymentDeadline)}
            </p>
          </div>
        )}

        {/* Approval Information */}
        {booking.approvedBy && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Approved by:</span> {booking.approvedBy} 
              {booking.approvedAt && <span> on {formatDate(booking.approvedAt)}</span>}
            </p>
            {booking.approvalNotes && (
              <p className="text-sm text-green-700 mt-1">
                <span className="font-medium">Notes:</span> {booking.approvalNotes}
              </p>
            )}
          </div>
        )}

        {/* Rejection Information */}
        {booking.rejectedBy && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">
              <span className="font-medium">Rejected by:</span> {booking.rejectedBy}
              {booking.rejectedAt && <span> on {formatDate(booking.rejectedAt)}</span>}
            </p>
            {booking.rejectionReason && (
              <p className="text-sm text-red-700 mt-1">
                <span className="font-medium">Reason:</span> {booking.rejectionReason}
              </p>
            )}
          </div>
        )}

        {/* Payment Information */}
        {booking.paidAt && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Paid on:</span> {formatDate(booking.paidAt)}
            </p>
          </div>
        )}

        {/* Arrival Confirmation */}
        {booking.confirmedArrivalBy && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
            <p className="text-sm text-indigo-800">
              <span className="font-medium">Arrival confirmed by:</span> {booking.confirmedArrivalBy}
              {booking.confirmedArrivalAt && <span> on {formatDate(booking.confirmedArrivalAt)}</span>}
            </p>
          </div>
        )}

        {/* Completion Information */}
        {booking.completedAt && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-800">
              <span className="font-medium">Completed on:</span> {formatDate(booking.completedAt)}
            </p>
          </div>
        )}

        {/* Cancellation Information */}
        {booking.cancelledBy && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-800">
              <span className="font-medium">Cancelled by:</span> {booking.cancelledBy}
              {booking.cancelledAt && <span> on {formatDate(booking.cancelledAt)}</span>}
            </p>
            {booking.cancellationReason && (
              <p className="text-sm text-gray-700 mt-1">
                <span className="font-medium">Reason:</span> {booking.cancellationReason}
              </p>
            )}
          </div>
        )}

        {/* Refund Information */}
        {booking.refundRequestedAt && (
          <div className="bg-purple-50 border border-purple-200 rounded-md p-3">
            <p className="text-sm text-purple-800">
              <span className="font-medium">Refund requested on:</span> {formatDate(booking.refundRequestedAt)}
            </p>
            {booking.refundAmount && (
              <p className="text-sm text-purple-700">
                <span className="font-medium">Amount:</span> {formatCurrency(booking.refundAmount)}
              </p>
            )}
            {booking.refundProcessedBy && (
              <p className="text-sm text-purple-700">
                <span className="font-medium">Processed by:</span> {booking.refundProcessedBy}
                {booking.refundProcessedAt && <span> on {formatDate(booking.refundProcessedAt)}</span>}
              </p>
            )}
            {booking.refundNotes && (
              <p className="text-sm text-purple-700 mt-1">
                <span className="font-medium">Notes:</span> {booking.refundNotes}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Next Action Indicator */}
      {nextAction && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Next:</span> {nextAction.description}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-wrap gap-2">
          {canPerformAction(booking.status, 'APPROVE', userRole) && onApprove && (
            <button
              onClick={() => setShowApprovalForm(true)}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Approve
            </button>
          )}

          {canPerformAction(booking.status, 'REJECT', userRole) && onReject && (
            <button
              onClick={() => setShowRejectionForm(true)}
              disabled={loading}
              className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          )}

          {canPerformAction(booking.status, 'PAY', userRole) && onPay && (
            <button
              onClick={() => onPay(booking.id)}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Pay Now
            </button>
          )}

          {canPerformAction(booking.status, 'APPROVE_REVIEW', userRole) && onApproveReview && (
            <button
              onClick={() => setShowReviewApprovalForm(true)}
              disabled={loading}
              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Approve Review
            </button>
          )}

          {canPerformAction(booking.status, 'COMPLETE', userRole) && onComplete && (
            <button
              onClick={() => onComplete(booking.id)}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              Mark Complete
            </button>
          )}

          {canPerformAction(booking.status, 'CONFIRM_ARRIVAL', userRole) && onConfirmArrival && (
            <button
              onClick={() => onConfirmArrival(booking.id)}
              disabled={loading}
              className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Confirm Arrival
            </button>
          )}

          {canPerformAction(booking.status, 'PROCESS_REFUND', userRole) && onProcessRefund && (
            <button
              onClick={() => setShowRefundForm(true)}
              disabled={loading}
              className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Process Refund
            </button>
          )}

          {canPerformAction(booking.status, 'CANCEL', userRole) && onCancel && (
            <button
              onClick={() => setShowCancelForm(true)}
              disabled={loading}
              className="px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Approval Form Modal */}
      {showApprovalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Approve Booking</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add approval notes (optional)..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApprovalForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Form Modal */}
      {showRejectionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reject Booking</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRejectionForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !reason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Approval Form Modal */}
      {showReviewApprovalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Approve Review</h3>
            <p className="text-gray-600 mb-4">
              Approve this booking to move it to &quot;In Progress&quot; status.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter review notes (optional)..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowReviewApprovalForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveReview}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Approve Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Form Modal */}
      {showCancelForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter cancellation reason..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCancelForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCancel}
                disabled={loading || !reason.trim()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Form Modal */}
      {showRefundForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Process Refund</h3>
            <div className="mb-4">
              <label htmlFor="refund-amount" className="block text-sm font-medium text-gray-700 mb-2">
                Refund Amount
              </label>
              <input
                id="refund-amount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(Number(e.target.value))}
                className="w-full p-3 border border-gray-300 rounded-md"
                min="0"
                max={booking.totalAmount}
                step="0.01"
              />
            </div>
            <textarea
              value={refundNotes}
              onChange={(e) => setRefundNotes(e.target.value)}
              placeholder="Add refund notes..."
              className="w-full p-3 border border-gray-300 rounded-md mb-4"
              rows={3}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRefundForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessRefund}
                disabled={loading || refundAmount <= 0}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
