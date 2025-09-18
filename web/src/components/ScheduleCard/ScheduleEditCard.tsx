"use client";

import React, { useState } from 'react';
import { X, Edit, AlertTriangle, CheckCircle, MapPin, Ship, Clock, Users, Car } from 'lucide-react';
import { RouteData, FerryData } from '@/hooks/useApi';
import { useRoutes, useFerries } from '@/hooks/useApi';

// Helper function to safely convert date to ISO string for input[type="datetime-local"]
const safeToISOString = (dateValue: string | null | undefined): string => {
  if (!dateValue) return '';
  
  try {
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value:', dateValue);
      return '';
    }
    return date.toISOString().slice(0, 16);
  } catch (error) {
    console.warn('Error converting date:', dateValue, error);
    return '';
  }
};

interface Schedule {
  id: number;
  scheduleCode?: string;
  departureTime: string;
  arrivalTime: string;
  availablePassengerSpaces: number;
  availableVehicleSpaces: number;
  bookingDeadline: string;
  checkInStartTime?: string;
  checkInEndTime?: string;
  status: string;
  notes?: string;
  
  // Flat structure from backend
  routeId?: number;
  routeName?: string;
  departurePortName?: string;
  arrivalPortName?: string;
  ferryId?: number;
  ferryName?: string;
  ferryCode?: string;
  
  // Legacy nested structures
  route?: {
    id: number;
    routeName: string;
    departurePort: { portName: string };
    arrivalPort: { portName: string };
  };
  ferry?: {
    id: number;
    ferryName: string;
    capacityPassengers: number;
    capacityVehicles: number;
  };
}

interface ScheduleEditCardProps {
  schedule: Schedule;
  onClose: () => void;
  onScheduleUpdated: () => void;
}

interface ScheduleFormData {
  scheduleCode: string;
  routeId: string;
  ferryId: string;
  departureTime: string;
  arrivalTime: string;
  availablePassengerSpaces: number;
  availableVehicleSpaces: number;
  bookingDeadline: string;
  checkInStartTime: string;
  checkInEndTime: string;
  status: string;
  notes: string;
}

const ScheduleEditCard: React.FC<ScheduleEditCardProps> = ({ schedule, onClose, onScheduleUpdated }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const { data: routesData, loading: routesLoading } = useRoutes();
  const { data: ferriesData, loading: ferriesLoading } = useFerries();

  // Convert schedule to form data
  const [formData, setFormData] = useState<ScheduleFormData>({
    scheduleCode: schedule.scheduleCode || '',
    routeId: schedule.routeId?.toString() || schedule.route?.id.toString() || '',
    ferryId: schedule.ferryId?.toString() || schedule.ferry?.id.toString() || '',
    departureTime: safeToISOString(schedule.departureTime),
    arrivalTime: safeToISOString(schedule.arrivalTime),
    availablePassengerSpaces: schedule.availablePassengerSpaces || 0,
    availableVehicleSpaces: schedule.availableVehicleSpaces || 0,
    bookingDeadline: safeToISOString(schedule.bookingDeadline),
    checkInStartTime: safeToISOString(schedule.checkInStartTime),
    checkInEndTime: safeToISOString(schedule.checkInEndTime),
    status: schedule.status || 'SCHEDULED',
    notes: schedule.notes || ''
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.scheduleCode.trim()) {
      newErrors.scheduleCode = 'Schedule code is required';
    }

    if (!formData.routeId) {
      newErrors.routeId = 'Route is required';
    }

    if (!formData.ferryId) {
      newErrors.ferryId = 'Ferry is required';
    }

    if (!formData.departureTime) {
      newErrors.departureTime = 'Departure time is required';
    }

    if (!formData.arrivalTime) {
      newErrors.arrivalTime = 'Arrival time is required';
    }

    if (formData.departureTime && formData.arrivalTime && 
        new Date(formData.departureTime) >= new Date(formData.arrivalTime)) {
      newErrors.arrivalTime = 'Arrival time must be after departure time';
    }

    if (!formData.bookingDeadline) {
      newErrors.bookingDeadline = 'Booking deadline is required';
    }

    if (formData.bookingDeadline && formData.departureTime && 
        new Date(formData.bookingDeadline) >= new Date(formData.departureTime)) {
      newErrors.bookingDeadline = 'Booking deadline must be before departure time';
    }

    if (formData.availablePassengerSpaces < 0) {
      newErrors.availablePassengerSpaces = 'Passenger spaces cannot be negative';
    }

    if (formData.availableVehicleSpaces < 0) {
      newErrors.availableVehicleSpaces = 'Vehicle spaces cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const scheduleData = {
        ...formData,
        routeId: parseInt(formData.routeId),
        ferryId: parseInt(formData.ferryId),
        departureTime: new Date(formData.departureTime).toISOString(),
        arrivalTime: new Date(formData.arrivalTime).toISOString(),
        bookingDeadline: new Date(formData.bookingDeadline).toISOString(),
        checkInStartTime: formData.checkInStartTime ? new Date(formData.checkInStartTime).toISOString() : null,
        checkInEndTime: formData.checkInEndTime ? new Date(formData.checkInEndTime).toISOString() : null,
      };

      // TODO: Replace with actual API call
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scheduleData),
      });

      if (!response.ok) {
        throw new Error('Failed to update schedule');
      }

      setSuccess(true);
      setTimeout(() => {
        onScheduleUpdated();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating schedule:', error);
      setErrors({ submit: 'Failed to update schedule. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ScheduleFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Helper function to safely extract array from either format
  const extractArray = <T,>(data: T[] | { content: T[] } | null | undefined): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as { content: T[] }).content || [];
  };

  const routes = extractArray(routesData);
  const ferries = extractArray(ferriesData);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Edit className="h-5 w-5 mr-2 text-blue-600" />
            Edit Schedule
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Messages */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Schedule updated successfully!
            </div>
          )}

          {/* Basic Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Schedule Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.scheduleCode}
                  onChange={handleInputChange('scheduleCode')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.scheduleCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Schedule code"
                />
                {errors.scheduleCode && (
                  <p className="text-sm text-red-600 mt-1">{errors.scheduleCode}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  title="Select status"
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="BOARDING">Boarding</option>
                  <option value="DEPARTED">Departed</option>
                  <option value="ARRIVED">Arrived</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DELAYED">Delayed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Route and Ferry Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Route and Ferry
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Route <span className="text-red-500">*</span>
                </label>
                <select
                  title="Select route"
                  value={formData.routeId}
                  onChange={handleInputChange('routeId')}
                  disabled={routesLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.routeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{routesLoading ? "Loading routes..." : "Select route"}</option>
                  {routes.map((route: RouteData) => (
                    <option key={route.id} value={route.id.toString()}>
                      {route.routeName}
                    </option>
                  ))}
                </select>
                {errors.routeId && (
                  <p className="text-sm text-red-600 mt-1">{errors.routeId}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Ship className="h-4 w-4 mr-1" />
                  Ferry <span className="text-red-500">*</span>
                </label>
                <select
                  title="Select ferry"
                  value={formData.ferryId}
                  onChange={handleInputChange('ferryId')}
                  disabled={ferriesLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.ferryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">{ferriesLoading ? "Loading ferries..." : "Select ferry"}</option>
                  {ferries.map((ferry: FerryData) => (
                    <option key={ferry.id} value={ferry.id.toString()}>
                      {ferry.ferryName}
                    </option>
                  ))}
                </select>
                {errors.ferryId && (
                  <p className="text-sm text-red-600 mt-1">{errors.ferryId}</p>
                )}
              </div>
            </div>
          </div>

          {/* Time Information Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              Time Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-green-600" />
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  title="Departure time"
                  value={formData.departureTime}
                  onChange={handleInputChange('departureTime')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.departureTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.departureTime && (
                  <p className="text-sm text-red-600 mt-1">{errors.departureTime}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                  Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  title="Arrival time"
                  value={formData.arrivalTime}
                  onChange={handleInputChange('arrivalTime')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.arrivalTime ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.arrivalTime && (
                  <p className="text-sm text-red-600 mt-1">{errors.arrivalTime}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Booking Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  title="Booking deadline"
                  value={formData.bookingDeadline}
                  onChange={handleInputChange('bookingDeadline')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.bookingDeadline ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.bookingDeadline && (
                  <p className="text-sm text-red-600 mt-1">{errors.bookingDeadline}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Check-in Start Time
                </label>
                <input
                  type="datetime-local"
                  title="Check-in start time"
                  value={formData.checkInStartTime}
                  onChange={handleInputChange('checkInStartTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-1">
                <label className="text-sm font-medium text-gray-700 mb-1">
                  Check-in End Time
                </label>
                <input
                  type="datetime-local"
                  title="Check-in end time"
                  value={formData.checkInEndTime}
                  onChange={handleInputChange('checkInEndTime')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Capacity Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              Capacity
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Available Passenger Spaces <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  title="Available passenger spaces"
                  value={formData.availablePassengerSpaces}
                  onChange={handleInputChange('availablePassengerSpaces')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.availablePassengerSpaces ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.availablePassengerSpaces && (
                  <p className="text-sm text-red-600 mt-1">{errors.availablePassengerSpaces}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Available Vehicle Spaces <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  title="Available vehicle spaces"
                  value={formData.availableVehicleSpaces}
                  onChange={handleInputChange('availableVehicleSpaces')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.availableVehicleSpaces ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.availableVehicleSpaces && (
                  <p className="text-sm text-red-600 mt-1">{errors.availableVehicleSpaces}</p>
                )}
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Notes</h4>
            <textarea
              value={formData.notes}
              onChange={handleInputChange('notes')}
              placeholder="Optional notes about this schedule..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2 inline-block" />
                  Update Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleEditCard;
