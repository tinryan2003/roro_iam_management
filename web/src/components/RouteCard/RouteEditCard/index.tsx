"use client";

import React, { useState, useEffect } from 'react';
import { X, Navigation, Save, MapPin, Clock, DollarSign } from 'lucide-react';

interface Route {
  id: number;
  routeName: string;
  departurePort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  arrivalPort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  durationHours: number;
  price: number;
  isActive: boolean;
}

interface Port {
  id: number;
  portName: string;
  city: string;
  country: string;
}

interface RouteEditModalProps {
  route: Route;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RouteEditModal: React.FC<RouteEditModalProps> = ({
  route,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ports, setPorts] = useState<Port[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    routeName: route.routeName,
    departurePortId: route.departurePort.id,
    arrivalPortId: route.arrivalPort.id,
    durationHours: route.durationHours,
    price: route.price,
    isActive: route.isActive
  });

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load ports when component mounts
  useEffect(() => {
    if (isOpen) {
      fetchPorts();
    }
  }, [isOpen]);

  const fetchPorts = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/api/ports`);
      if (response.ok) {
        const data = await response.json();
        setPorts(data);
      }
    } catch (err) {
      console.error('Failed to fetch ports:', err);
    }
  };

  if (!isOpen) return null;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.routeName.trim()) {
      errors.routeName = 'Route name is required';
    } else if (formData.routeName.length < 3) {
      errors.routeName = 'Route name must be at least 3 characters';
    }

    if (!formData.departurePortId) {
      errors.departurePortId = 'Departure port is required';
    }

    if (!formData.arrivalPortId) {
      errors.arrivalPortId = 'Arrival port is required';
    }

    if (formData.departurePortId === formData.arrivalPortId) {
      errors.arrivalPortId = 'Arrival port must be different from departure port';
    }

    if (!formData.durationHours || formData.durationHours <= 0) {
      errors.durationHours = 'Duration must be greater than 0';
    } else if (formData.durationHours > 168) { // 7 days
      errors.durationHours = 'Duration cannot exceed 168 hours (7 days)';
    }

    if (!formData.price || formData.price <= 0) {
      errors.price = 'Price must be greater than 0';
    } else if (formData.price > 10000) {
      errors.price = 'Price cannot exceed $10,000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/api/routes/${route.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          routeName: formData.routeName,
          departurePortId: formData.departurePortId,
          arrivalPortId: formData.arrivalPortId,
          durationHours: formData.durationHours,
          price: formData.price,
          isActive: formData.isActive
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update route');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Edit Route</h3>
              <p className="text-sm text-gray-500">Route ID: {route.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
            title="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mx-6 mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Save className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Route updated successfully!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Route Name */}
          <div>
            <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 mb-2">
              Route Name *
            </label>
            <input
              type="text"
              id="routeName"
              value={formData.routeName}
              onChange={(e) => handleInputChange('routeName', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.routeName ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter route name"
              disabled={loading}
            />
            {validationErrors.routeName && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.routeName}</p>
            )}
          </div>

          {/* Ports */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Departure Port */}
            <div>
              <label htmlFor="departurePort" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline text-green-600 mr-1" />
                Departure Port *
              </label>
              <select
                id="departurePort"
                value={formData.departurePortId}
                onChange={(e) => handleInputChange('departurePortId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.departurePortId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select departure port</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.portName} - {port.city}, {port.country}
                  </option>
                ))}
              </select>
              {validationErrors.departurePortId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.departurePortId}</p>
              )}
            </div>

            {/* Arrival Port */}
            <div>
              <label htmlFor="arrivalPort" className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline text-red-600 mr-1" />
                Arrival Port *
              </label>
              <select
                id="arrivalPort"
                value={formData.arrivalPortId}
                onChange={(e) => handleInputChange('arrivalPortId', parseInt(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.arrivalPortId ? 'border-red-300' : 'border-gray-300'
                }`}
                disabled={loading}
              >
                <option value="">Select arrival port</option>
                {ports.map((port) => (
                  <option key={port.id} value={port.id}>
                    {port.portName} - {port.city}, {port.country}
                  </option>
                ))}
              </select>
              {validationErrors.arrivalPortId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.arrivalPortId}</p>
              )}
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline text-blue-600 mr-1" />
                Duration (hours) *
              </label>
              <input
                type="number"
                id="duration"
                min="1"
                max="168"
                value={formData.durationHours}
                onChange={(e) => handleInputChange('durationHours', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.durationHours ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter duration in hours"
                disabled={loading}
              />
              {validationErrors.durationHours && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.durationHours}</p>
              )}
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline text-green-600 mr-1" />
                Base Price (USD) *
              </label>
              <input
                type="number"
                id="price"
                min="0.01"
                max="10000"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.price ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter base price"
                disabled={loading}
              />
              {validationErrors.price && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={formData.isActive ? 'active' : 'inactive'}
              onChange={(e) => handleInputChange('isActive', e.target.value === 'active')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Route
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteEditModal;