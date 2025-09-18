"use client";

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface BookingData {
  id?: number;
  bookingCode?: string;
  customerId?: number;
  routeId?: number;
  ferryId?: number;
  vehicleId?: number[];
  passengerCount: number;
  totalAmount: number;
  departureTime?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
  route?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  vehicleType?: string;
}

interface BookingDeleteModalProps {
  booking: BookingData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingDeleteModal: React.FC<BookingDeleteModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Here you would typically make an API call to delete the booking
      // For now, we'll simulate a successful deletion
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete booking');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Booking
              </h2>
              <p className="text-sm text-gray-500">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start space-x-3 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Warning: Permanent Deletion
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                This booking will be permanently deleted and cannot be recovered. All associated data will be lost.
              </p>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Booking to be deleted:
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Code:</span>
                <span className="font-medium text-gray-900">
                  {booking.bookingCode || `#${booking.id}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span className="font-medium text-gray-900">
                  #{booking.customerId || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Passengers:</span>
                <span className="font-medium text-gray-900">
                  {booking.passengerCount || booking.passengers || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(booking.totalAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Departure:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(booking.departureTime || booking.departureDate)}
                </span>
              </div>
              {booking.status && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">
                    {booking.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this booking? This action cannot be undone.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            <span>{isLoading ? 'Deleting...' : 'Delete Booking'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDeleteModal;