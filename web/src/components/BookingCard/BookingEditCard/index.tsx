"use client";

import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Users, CreditCard, MapPin, Ship, FileText } from 'lucide-react';

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

interface BookingEditModalProps {
  booking: BookingData;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BookingEditModal: React.FC<BookingEditModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<BookingData>(booking);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update form data when booking prop changes
  useEffect(() => {
    setFormData(booking);
  }, [booking]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'passengerCount' || name === 'totalAmount' || name === 'customerId' || name === 'routeId' || name === 'ferryId' 
        ? Number(value) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Here you would typically make an API call to update the booking
      // For now, we'll simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

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
                Edit Booking
              </h2>
              <p className="text-sm text-gray-500">
                {formData.bookingCode || `Booking #${formData.id}`}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Basic Information
              </h3>

              <div>
                <label htmlFor="bookingCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Code
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="bookingCode"
                    name="bookingCode"
                    value={formData.bookingCode || ''}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter booking code"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer ID
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="customerId"
                    name="customerId"
                    value={formData.customerId || ''}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter customer ID"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="passengerCount" className="block text-sm font-medium text-gray-700 mb-1">
                  Passenger Count
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="passengerCount"
                    name="passengerCount"
                    value={formData.passengerCount || ''}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter passenger count"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
                  Total Amount ($)
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="totalAmount"
                    name="totalAmount"
                    value={formData.totalAmount || ''}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter total amount"
                  />
                </div>
              </div>
            </div>

            {/* Trip Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                Trip Information
              </h3>

              <div>
                <label htmlFor="routeId" className="block text-sm font-medium text-gray-700 mb-1">
                  Route ID
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="routeId"
                    name="routeId"
                    value={formData.routeId || ''}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter route ID"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="ferryId" className="block text-sm font-medium text-gray-700 mb-1">
                  Ferry ID
                </label>
                <div className="relative">
                  <Ship className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    id="ferryId"
                    name="ferryId"
                    value={formData.ferryId || ''}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter ferry ID"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="departureTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Time
                </label>
                <input
                  type="datetime-local"
                  id="departureTime"
                  name="departureTime"
                  value={formData.departureTime?.slice(0, 16) || formData.departureDate?.slice(0, 16) || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Return Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="returnDate"
                  name="returnDate"
                  value={formData.returnDate?.slice(0, 16) || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Vehicle Type */}
          <div className="mb-6">
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type (Optional)
            </label>
            <input
              type="text"
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter vehicle type"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="note"
              name="note"
              value={formData.note || ''}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any additional notes"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingEditModal;