"use client";

import React, { useState } from 'react';
import { X, Calendar, Users, CreditCard, MapPin, Ship, Clock, Edit2, Trash2, FileText } from 'lucide-react';

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

interface BookingDetailModalProps {
  booking: BookingData;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (booking: BookingData) => void;
  onDelete?: (booking: BookingData) => void;
}

const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  booking,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-500';
      case 'PENDING':
        return 'bg-yellow-500';
      case 'CANCELLED':
        return 'bg-red-500';
      case 'COMPLETED':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Confirmed';
      case 'PENDING':
        return 'Pending';
      case 'CANCELLED':
        return 'Cancelled';
      case 'COMPLETED':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Booking Details
              </h2>
              <p className="text-sm text-gray-500">
                {booking.bookingCode || `Booking #${booking.id}`}
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
          {/* Status Badge */}
          <div className="flex items-center mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(booking.status)}`}></div>
              <span className="text-sm font-medium text-gray-700">
                Status: {getStatusText(booking.status)}
              </span>
            </div>
          </div>

          {/* Booking Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h3>
              
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Booking Code</p>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.bookingCode || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Customer ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    #{booking.customerId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Passengers</p>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.passengerCount || booking.passengers || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <CreditCard className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Total Amount</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Trip Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Trip Information
              </h3>

              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Route ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    #{booking.routeId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Ship className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Ferry ID</p>
                  <p className="text-sm font-medium text-gray-900">
                    #{booking.ferryId || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Departure Time</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDate(booking.departureTime || booking.departureDate)}
                  </p>
                </div>
              </div>

              {booking.returnDate && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Return Date</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(booking.returnDate)}
                    </p>
                  </div>
                </div>
              )}

              {booking.vehicleType && (
                <div className="flex items-center space-x-3">
                  <div className="h-5 w-5 text-gray-400">🚗</div>
                  <div>
                    <p className="text-sm text-gray-500">Vehicle Type</p>
                    <p className="text-sm font-medium text-gray-900">
                      {booking.vehicleType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle IDs */}
          {booking.vehicleId && booking.vehicleId.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                Vehicle Information
              </h3>
              <div className="flex flex-wrap gap-2">
                {booking.vehicleId.map((vehicleId, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    Vehicle #{vehicleId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {booking.note && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                Notes
              </h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {booking.note}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
              System Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(booking.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Last Updated:</span>
                <span className="ml-2 text-gray-900">
                  {formatDate(booking.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          {!showDeleteConfirm ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(booking)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit2 className="h-4 w-4" />
                  <span>Edit</span>
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete?.(booking);
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailModal;