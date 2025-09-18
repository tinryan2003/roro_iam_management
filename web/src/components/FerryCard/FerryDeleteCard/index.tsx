"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, Ship, Trash2 } from 'lucide-react';
import { useDeleteFerry } from '@/hooks/useApi';

interface Ferry {
  id: number;
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

interface FerryDeleteModalProps {
  ferry: Ferry;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FerryDeleteModal: React.FC<FerryDeleteModalProps> = ({
  ferry,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  
  const { deleteFerry, loading } = useDeleteFerry();

  if (!isOpen) return null;

  const requiredConfirmText = ferry.ferryCode;
  const isConfirmValid = confirmText === requiredConfirmText;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      setError('Please type the ferry code exactly as shown to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    setError('');
    
    try {
      await deleteFerry(ferry.id);
      onSuccess();
      onClose();
      // Reset state
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting ferry:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete ferry');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Ferry</h2>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone
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
          <div className="space-y-6">
            {/* Ferry Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <Ship className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{ferry.ferryName}</p>
                  <p className="text-sm text-gray-600">
                    Code: {ferry.ferryCode} | Status: {ferry.status} | Capacity: {ferry.capacityPassengers} passengers, {ferry.capacityVehicles} vehicles
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">Warning: This will permanently delete the ferry</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The ferry will be removed from the system</li>
                    <li>All associated bookings will be affected</li>
                    <li>This action cannot be undone</li>
                    <li>Make sure no active bookings are using this ferry</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type the ferry code: <span className="font-mono bg-gray-100 px-1 rounded">{requiredConfirmText}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${requiredConfirmText}" to confirm`}
                aria-label="Confirmation text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  error && !isConfirmValid ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting || loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isDeleting || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Ferry</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FerryDeleteModal; 