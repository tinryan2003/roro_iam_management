"use client";

import React from 'react';
import { X, Calendar, MapPin, Ship, Clock, Users, Car, FileText } from 'lucide-react';

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
  createdAt?: string;
  updatedAt?: string;
  
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

interface ScheduleDetailCardProps {
  schedule: Schedule;
  onClose: () => void;
}

const ScheduleDetailCard: React.FC<ScheduleDetailCardProps> = ({ schedule, onClose }) => {
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DEPARTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'ARRIVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'DELAYED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Schedule Details
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
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Schedule Code</label>
                <p className="text-base font-medium text-gray-900">
                  {schedule.scheduleCode || `Schedule #${schedule.id}`}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(schedule.status)}`}>
                  {schedule.status}
                </span>
              </div>
            </div>
          </div>

          {/* Route Information */}
          {schedule.route && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                Route Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    Route Name
                  </label>
                  <p className="text-base text-gray-900">{schedule.route.routeName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Route</label>
                  <p className="text-base text-gray-900">
                    {schedule.departurePortName && schedule.arrivalPortName 
                      ? `${schedule.departurePortName} → ${schedule.arrivalPortName}`
                      : schedule.route?.departurePort?.portName && schedule.route?.arrivalPort?.portName
                      ? `${schedule.route.departurePort.portName} → ${schedule.route.arrivalPort.portName}`
                      : 'Route information not available'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Ferry Information */}
          {schedule.ferry && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                Ferry Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Ship className="h-4 w-4 mr-1" />
                    Ferry Name
                  </label>
                  <p className="text-base text-gray-900">{schedule.ferryName || schedule.ferry?.ferryName || 'No ferry assigned'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Passenger Capacity
                  </label>
                  <p className="text-base text-gray-900">{schedule.ferry.capacityPassengers}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                    <Car className="h-4 w-4 mr-1" />
                    Vehicle Capacity
                  </label>
                  <p className="text-base text-gray-900">{schedule.ferry.capacityVehicles}</p>
                </div>
              </div>
            </div>
          )}

          {/* Time Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              Time Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-green-600" />
                  Departure Time
                </label>
                <p className="text-base text-gray-900">{formatDateTime(schedule.departureTime)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-blue-600" />
                  Arrival Time
                </label>
                <p className="text-base text-gray-900">{formatDateTime(schedule.arrivalTime)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Booking Deadline
                </label>
                <p className="text-base text-gray-900">{formatDateTime(schedule.bookingDeadline)}</p>
              </div>
              
              {schedule.checkInStartTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Check-in Start
                  </label>
                  <p className="text-base text-gray-900">{formatDateTime(schedule.checkInStartTime)}</p>
                </div>
              )}
              
              {schedule.checkInEndTime && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Check-in End
                  </label>
                  <p className="text-base text-gray-900">{formatDateTime(schedule.checkInEndTime)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              Availability
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Available Passenger Spaces
                </label>
                <p className="text-2xl font-bold text-blue-600">{schedule.availablePassengerSpaces}</p>
                {schedule.ferry && (
                  <p className="text-sm text-gray-500">
                    out of {schedule.ferry.capacityPassengers} total
                  </p>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                  <Car className="h-4 w-4 mr-1" />
                  Available Vehicle Spaces
                </label>
                <p className="text-2xl font-bold text-green-600">{schedule.availableVehicleSpaces}</p>
                {schedule.ferry && (
                  <p className="text-sm text-gray-500">
                    out of {schedule.ferry.capacityVehicles} total
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {schedule.notes && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                Notes
              </h3>
              
              <div className="flex items-start">
                <FileText className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <p className="text-base text-gray-700 whitespace-pre-wrap">{schedule.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              System Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Schedule ID</label>
                <p className="text-base text-gray-900">#{schedule.id}</p>
              </div>
              
              {schedule.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                  <p className="text-base text-gray-900">{formatDateTime(schedule.createdAt)}</p>
                </div>
              )}
              
              {schedule.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                  <p className="text-base text-gray-900">{formatDateTime(schedule.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailCard;
