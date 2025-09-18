"use client";

import React, { useState } from 'react';
import { X, Navigation, Calendar, Clock, DollarSign, MapPin, Edit2, Trash2 } from 'lucide-react';

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
  createdAt?: string;
}

interface RouteDetailModalProps {
  route: Route;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (route: Route) => void;
  onDelete?: (route: Route) => void;
}

const RouteDetailModal: React.FC<RouteDetailModalProps> = ({
  route,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string | undefined) => {
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
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 
        ? `${days} day${days === 1 ? '' : 's'} ${remainingHours} hour${remainingHours === 1 ? '' : 's'}`
        : `${days} day${days === 1 ? '' : 's'}`;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(route);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(route);
      onClose();
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
              <h3 className="text-lg font-medium text-gray-900">Route Details</h3>
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Route Status */}
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">{route.routeName}</h4>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(route.isActive)}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {getStatusText(route.isActive)}
              </span>
            </div>
          </div>

          {/* Route Path */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Route Path</h5>
            <div className="flex items-center justify-between">
              {/* Departure Port */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Departure</span>
                </div>
                <div className="ml-6">
                  <p className="font-medium text-gray-900">{route.departurePort.portName}</p>
                  <p className="text-sm text-gray-500">
                    {route.departurePort.city}, {route.departurePort.country}
                  </p>
                </div>
              </div>

              {/* Arrow */}
              <div className="px-4">
                <div className="w-8 h-px bg-gray-300 relative">
                  <div className="absolute right-0 top-0 w-0 h-0 border-l-4 border-l-gray-300 border-t-2 border-b-2 border-t-transparent border-b-transparent transform -translate-y-1/2"></div>
                </div>
              </div>

              {/* Arrival Port */}
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-gray-900">Arrival</span>
                </div>
                <div className="ml-6">
                  <p className="font-medium text-gray-900">{route.arrivalPort.portName}</p>
                  <p className="text-sm text-gray-500">
                    {route.arrivalPort.city}, {route.arrivalPort.country}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Route Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duration */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDuration(route.durationHours)}
                  </p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Base Price</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(route.price)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Created Date */}
          {route.createdAt && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(route.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Route
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Route
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h4>
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete this route? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteDetailModal;