"use client";

import React, { useState, useEffect } from 'react';
import { X, Ship, Users, Car } from 'lucide-react';
import { useUpdateFerry } from '@/hooks/useApi';

interface Ferry {
  id: number;
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

interface FerryEditModalProps {
  ferry: Ferry;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

interface FormErrors {
  [key: string]: string;
}

const FerryEditModal: React.FC<FerryEditModalProps> = ({
  ferry,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    ferryName: '',
    ferryCode: '',
    capacityVehicles: 0,
    capacityPassengers: 0,
    status: 'ACTIVE'
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateFerry, loading } = useUpdateFerry();

  // Status options
  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'MAINTENANCE', label: 'In Maintenance' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  // Initialize form data when ferry changes
  useEffect(() => {
    if (ferry && isOpen) {
      setFormData({
        ferryName: ferry.ferryName,
        ferryCode: ferry.ferryCode,
        capacityVehicles: ferry.capacityVehicles,
        capacityPassengers: ferry.capacityPassengers,
        status: ferry.status
      });
      setErrors({});
    }
  }, [ferry, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Ferry name validation
    if (!formData.ferryName.trim()) {
      newErrors.ferryName = 'Ferry name is required';
    } else if (formData.ferryName.length < 2) {
      newErrors.ferryName = 'Ferry name must be at least 2 characters';
    }

    // Ferry code validation
    if (!formData.ferryCode.trim()) {
      newErrors.ferryCode = 'Ferry code is required';
    } else if (formData.ferryCode.length < 3) {
      newErrors.ferryCode = 'Ferry code must be at least 3 characters';
    }

    // Capacity validation
    if (!formData.capacityPassengers || formData.capacityPassengers <= 0) {
      newErrors.capacityPassengers = 'Passenger capacity must be a positive number';
    }

    if (!formData.capacityVehicles || formData.capacityVehicles <= 0) {
      newErrors.capacityVehicles = 'Vehicle capacity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
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
    
    try {
      await updateFerry(ferry.id, formData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating ferry:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update ferry' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      ferryName: '',
      ferryCode: '',
      capacityVehicles: 0,
      capacityPassengers: 0,
      status: 'ACTIVE'
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Ship className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Ferry</h2>
              <p className="text-sm text-gray-600 mt-1">
                Update ferry information for {ferry.ferryCode}
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ferryName" className="block text-sm font-medium text-gray-700 mb-1">
                    Ferry Name *
                  </label>
                  <input
                    type="text"
                    id="ferryName"
                    value={formData.ferryName}
                    onChange={(e) => handleInputChange('ferryName', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ferryName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter ferry name"
                  />
                  {errors.ferryName && (
                    <p className="mt-1 text-sm text-red-600">{errors.ferryName}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="ferryCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Ferry Code *
                  </label>
                  <input
                    type="text"
                    id="ferryCode"
                    value={formData.ferryCode}
                    onChange={(e) => handleInputChange('ferryCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.ferryCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter ferry code"
                  />
                  {errors.ferryCode && (
                    <p className="mt-1 text-sm text-red-600">{errors.ferryCode}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Capacity Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Capacity Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="capacityPassengers" className="block text-sm font-medium text-gray-700 mb-1">
                    Passenger Capacity *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      id="capacityPassengers"
                      value={formData.capacityPassengers}
                      onChange={(e) => handleInputChange('capacityPassengers', parseInt(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.capacityPassengers ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="1"
                    />
                  </div>
                  {errors.capacityPassengers && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacityPassengers}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="capacityVehicles" className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Capacity *
                  </label>
                  <div className="relative">
                    <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      id="capacityVehicles"
                      value={formData.capacityVehicles}
                      onChange={(e) => handleInputChange('capacityVehicles', parseInt(e.target.value) || 0)}
                      className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        errors.capacityVehicles ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0"
                      min="1"
                    />
                  </div>
                  {errors.capacityVehicles && (
                    <p className="mt-1 text-sm text-red-600">{errors.capacityVehicles}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{errors.submit}</div>
              </div>
            )}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={isSubmitting || loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <>
                <Ship className="w-4 h-4" />
                <span>Update Ferry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FerryEditModal; 