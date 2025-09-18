"use client";

import React, { useState } from 'react';
import { X, Ship, Calendar, Users, Car, Edit2, Trash2 } from 'lucide-react';

interface Ferry {
  id: number;
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

interface FerryDetailModalProps {
  ferry: Ferry;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (ferry: Ferry) => void;
  onDelete?: (ferry: Ferry) => void;
}

const FerryDetailModal: React.FC<FerryDetailModalProps> = ({
  ferry,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'MAINTENANCE':
        return 'bg-yellow-500';
      case 'INACTIVE':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'MAINTENANCE':
        return 'In Maintenance';
      case 'INACTIVE':
        return 'Inactive';
      default:
        return 'Unknown';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600';
      case 'MAINTENANCE':
        return 'text-yellow-600';
      case 'INACTIVE':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleEdit = () => {
    onEdit?.(ferry);
    onClose();
  };

  const handleDeleteConfirm = () => {
    onDelete?.(ferry);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Ferry Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed information for {ferry.ferryCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Ferry Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Ship className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Ferry Code</p>
                    <p className="text-base text-gray-900 font-medium">{ferry.ferryCode}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Ship className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Ferry Name</p>
                    <p className="text-base text-gray-900 font-medium">{ferry.ferryName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 ${getStatusColor(ferry.status)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className={`text-base font-medium ${getStatusTextColor(ferry.status)}`}>
                      {getStatusText(ferry.status)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Capacity Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Capacity Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Passenger Capacity</p>
                    <p className="text-base text-gray-900 font-medium">{ferry.capacityPassengers} passengers</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Car className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Vehicle Capacity</p>
                    <p className="text-base text-gray-900 font-medium">{ferry.capacityVehicles} vehicles</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Ship className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Total Capacity</p>
                    <p className="text-base text-gray-900 font-medium">
                      {ferry.capacityPassengers + ferry.capacityVehicles} total units
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-6">
              System Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Created At</p>
                  <p className="text-base text-gray-900 font-medium">{formatDate(ferry.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Ship className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Ferry ID</p>
                  <p className="text-base text-gray-900 font-medium">{ferry.id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <h3 className="text-sm font-medium text-red-800">Delete Ferry</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Are you sure you want to delete this ferry? This action cannot be undone.</p>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="bg-red-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCancel}
                      className="bg-white text-gray-700 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FerryDetailModal; 