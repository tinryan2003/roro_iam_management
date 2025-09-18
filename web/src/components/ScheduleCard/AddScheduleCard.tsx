'use client';

import React, { useState } from 'react';
import { X, Calendar, Plus, AlertTriangle, CheckCircle, MapPin, Ship, Clock, Users, Car } from 'lucide-react';
import { RouteData, FerryData } from '@/hooks/useApi';

interface AddScheduleCardProps {
  onClose: () => void;
  onAdd: (schedule: ScheduleCreateData) => Promise<void>;
  routes: RouteData[] | { content: RouteData[] };
  ferries: FerryData[] | { content: FerryData[] };
  routesLoading?: boolean;
  ferriesLoading?: boolean;
}

interface ScheduleCreateData {
  routeId: number;
  ferryId: number;
  departureTime: string;
  arrivalTime: string;
  status: string;
  maxPassengers: number;
  maxVehicles: number;
  notes?: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

const AddScheduleCard: React.FC<AddScheduleCardProps> = ({
  onClose,
  onAdd,
  routes: routesData,
  ferries: ferriesData,
  routesLoading = false,
  ferriesLoading = false
}) => {
  const [formData, setFormData] = useState<ScheduleCreateData>({
    routeId: 0,
    ferryId: 0,
    departureTime: '',
    arrivalTime: '',
    status: 'SCHEDULED',
    maxPassengers: 0,
    maxVehicles: 0,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [submitMessage, setSubmitMessage] = useState('');

  // Helper function to safely extract array from either format
  const extractArray = <T,>(data: T[] | PaginatedResponse<T> | undefined): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return (data as PaginatedResponse<T>).content || [];
  };

  const routes = extractArray(routesData as RouteData[] | PaginatedResponse<RouteData>);
  const ferries = extractArray(ferriesData as FerryData[] | PaginatedResponse<FerryData>);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.routeId || formData.routeId === 0) {
      newErrors.routeId = 'Route is required';
    }
    if (!formData.ferryId || formData.ferryId === 0) {
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
    if (!formData.maxPassengers || formData.maxPassengers <= 0) {
      newErrors.maxPassengers = 'Max passengers must be greater than 0';
    }
    if (!formData.maxVehicles || formData.maxVehicles < 0) {
      newErrors.maxVehicles = 'Max vehicles cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ScheduleCreateData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage('');

    try {
      await onAdd(formData);
      setSubmitStatus('success');
      setSubmitMessage('Schedule created successfully!');
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'Failed to create schedule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Plus className="h-5 w-5 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Add New Schedule</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-lg flex items-center ${
              submitStatus === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {submitStatus === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2" />
              )}
              {submitMessage}
            </div>
          )}

          <div className="space-y-6">
            {/* Route and Ferry Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Route <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.routeId}
                  onChange={handleInputChange('routeId')}
                  disabled={routesLoading}
                  aria-label="Select Route"
                  title="Select a route for this schedule"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.routeId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Select a route...</option>
                  {routes.map((route: RouteData) => (
                    <option key={route.id} value={route.id}>
                      {route.departurePort.portName} → {route.arrivalPort.portName}
                    </option>
                  ))}
                </select>
                {errors.routeId && <p className="mt-1 text-sm text-red-600">{errors.routeId}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Ship className="h-4 w-4 mr-1" />
                  Ferry <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ferryId}
                  onChange={handleInputChange('ferryId')}
                  disabled={ferriesLoading}
                  aria-label="Select Ferry"
                  title="Select a ferry for this schedule"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.ferryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Select a ferry...</option>
                  {ferries.map((ferry: FerryData) => (
                    <option key={ferry.id} value={ferry.id}>
                      {ferry.ferryName} (Capacity: {ferry.capacityPassengers}p, {ferry.capacityVehicles}v)
                    </option>
                  ))}
                </select>
                {errors.ferryId && <p className="mt-1 text-sm text-red-600">{errors.ferryId}</p>}
              </div>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Departure Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.departureTime}
                  onChange={handleInputChange('departureTime')}
                  title="Select departure date and time"
                  placeholder="Select departure time"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.departureTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.departureTime && <p className="mt-1 text-sm text-red-600">{errors.departureTime}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Arrival Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.arrivalTime}
                  onChange={handleInputChange('arrivalTime')}
                  title="Select arrival date and time"
                  placeholder="Select arrival time"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.arrivalTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.arrivalTime && <p className="mt-1 text-sm text-red-600">{errors.arrivalTime}</p>}
              </div>
            </div>

            {/* Capacity Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Max Passengers <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPassengers}
                  onChange={handleInputChange('maxPassengers')}
                  title="Maximum number of passengers"
                  placeholder="Enter max passengers"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxPassengers ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.maxPassengers && <p className="mt-1 text-sm text-red-600">{errors.maxPassengers}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Max Vehicles <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.maxVehicles}
                  onChange={handleInputChange('maxVehicles')}
                  title="Maximum number of vehicles"
                  placeholder="Enter max vehicles"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.maxVehicles ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.maxVehicles && <p className="mt-1 text-sm text-red-600">{errors.maxVehicles}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={handleInputChange('status')}
                  aria-label="Select Status"
                  title="Select schedule status"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Optional notes about this schedule..."
                title="Optional notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Schedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddScheduleCard;
