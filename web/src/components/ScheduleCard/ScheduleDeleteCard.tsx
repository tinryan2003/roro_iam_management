"use client";

import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Calendar } from 'lucide-react';

interface Schedule {
  id: number;
  scheduleCode?: string;
  departureTime: string;
  arrivalTime: string;
  status: string;
  
  route?: {
    routeName: string;
    departurePort: { portName: string };
    arrivalPort: { portName: string };
  };
  ferry?: {
    ferryName: string;
  };
}

interface ScheduleDeleteCardProps {
  schedule: Schedule;
  onClose: () => void;
  onScheduleDeleted: () => void;
}

const ScheduleDeleteCard: React.FC<ScheduleDeleteCardProps> = ({ 
  schedule, 
  onClose, 
  onScheduleDeleted 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>('');

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError('');

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schedule');
      }

      onScheduleDeleted();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      setError('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Trash2 className="h-5 w-5 mr-2 text-red-600" />
            Delete Schedule
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

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Are you sure you want to delete this schedule?
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  This action cannot be undone. The schedule will be permanently removed 
                  from the system and any associated bookings may be affected.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Information
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Schedule Code:</span>
                <span className="font-medium text-gray-900">
                  {schedule.scheduleCode || `Schedule #${schedule.id}`}
                </span>
              </div>
              
              {schedule.route && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Route:</span>
                  <span className="font-medium text-gray-900">{schedule.route.routeName}</span>
                </div>
              )}
              
              {schedule.ferry && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Ferry:</span>
                  <span className="font-medium text-gray-900">{schedule.ferry.ferryName}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-500">Departure:</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(schedule.departureTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Arrival:</span>
                <span className="font-medium text-gray-900">
                  {formatDateTime(schedule.arrivalTime)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium text-gray-900">{schedule.status}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2 inline-block" />
                  Delete Schedule
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDeleteCard;
