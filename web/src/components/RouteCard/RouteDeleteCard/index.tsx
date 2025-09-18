"use client";

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Navigation } from 'lucide-react';

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

interface RouteDeleteModalProps {
  route: Route;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RouteDeleteModal: React.FC<RouteDeleteModalProps> = ({
  route,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmationText !== route.routeName) {
      setError('Route name confirmation does not match');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/api/routes/${route.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      // Success - close modal and trigger refresh
      onSuccess?.();
      onClose();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete route');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  const isConfirmationValid = confirmationText === route.routeName;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Delete Route</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
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
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Warning: This action is permanent
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    Deleting this route will remove it permanently from the system.
                    Any associated schedules and bookings may be affected.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Route to be deleted:</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Navigation className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{route.routeName}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>
                  <span className="font-medium">From:</span> {route.departurePort.portName}, {route.departurePort.city}
                </p>
                <p>
                  <span className="font-medium">To:</span> {route.arrivalPort.portName}, {route.arrivalPort.city}
                </p>
                <p>
                  <span className="font-medium">Duration:</span> {formatDuration(route.durationHours)}
                </p>
                <p>
                  <span className="font-medium">Price:</span> {formatCurrency(route.price)}
                </p>
                <p>
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 ${route.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {route.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              To confirm deletion, type the route name: <span className="font-bold text-red-600">{route.routeName}</span>
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Enter route name to confirm"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                confirmationText && !isConfirmationValid
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              disabled={loading}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="mt-1 text-sm text-red-600">Route name does not match</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

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
            onClick={handleDelete}
            disabled={loading || !isConfirmationValid}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Route
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteDeleteModal;