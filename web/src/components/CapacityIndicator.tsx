import React from 'react';
import { Loader, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFerryCapacity, getCapacityStatus } from '@/hooks/useCapacity';

interface CapacityIndicatorProps {
  ferryId: number;
  ferryName?: string;
  selectedDate: string;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  ferryId,
  ferryName,
  selectedDate,
  className = '',
  showDetails = true,
  compact = false
}) => {
  const { data: capacity, loading, error } = useFerryCapacity(ferryId, selectedDate);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Loader className="h-4 w-4 animate-spin text-blue-500" />
        <span className="text-sm text-gray-600">Checking capacity...</span>
      </div>
    );
  }

  if (error || !capacity) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span className="text-sm text-gray-600">Capacity info unavailable</span>
      </div>
    );
  }

  const vehicleStatus = getCapacityStatus(capacity.vehicleUtilizationPercent);
  const passengerStatus = getCapacityStatus(capacity.passengerUtilizationPercent);

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="flex items-center space-x-1">
          <span className="text-xs">{vehicleStatus.icon}</span>
          <span className={`text-xs font-medium ${vehicleStatus.color}`}>
            {capacity.maxVehicles - capacity.currentVehicles} vehicles
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs">{passengerStatus.icon}</span>
          <span className={`text-xs font-medium ${passengerStatus.color}`}>
            {capacity.maxPassengers - capacity.currentPassengers} passengers
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-gray-900">
          {ferryName || `Ferry ${ferryId}`} - Capacity Status
        </h4>
        <span className="text-xs text-gray-500">{selectedDate}</span>
      </div>

      {/* Vehicle Capacity */}
      <div className={`rounded-md border p-3 mb-3 ${vehicleStatus.bgColor}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{vehicleStatus.icon}</span>
            <span className="text-sm font-medium text-gray-700">Vehicles</span>
          </div>
          <span className={`text-sm font-semibold ${vehicleStatus.color}`}>
            {vehicleStatus.status}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {capacity.currentVehicles}/{capacity.maxVehicles} booked
          </span>
          <span className={vehicleStatus.color}>
            {capacity.vehicleUtilizationPercent.toFixed(0)}% full
          </span>
        </div>

        {/* Progress bar for vehicles */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              capacity.vehicleUtilizationPercent >= 95 ? 'bg-red-500 w-full' :
              capacity.vehicleUtilizationPercent >= 80 ? 'bg-yellow-500' :
              capacity.vehicleUtilizationPercent >= 50 ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={capacity.vehicleUtilizationPercent < 95 ? { width: `${Math.min(capacity.vehicleUtilizationPercent, 100)}%` } : undefined}
          ></div>
        </div>

        {showDetails && (
          <div className="mt-2 text-xs text-gray-600">
            {capacity.maxVehicles - capacity.currentVehicles} spaces remaining
          </div>
        )}
      </div>

      {/* Passenger Capacity */}
      <div className={`rounded-md border p-3 ${passengerStatus.bgColor}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{passengerStatus.icon}</span>
            <span className="text-sm font-medium text-gray-700">Passengers</span>
          </div>
          <span className={`text-sm font-semibold ${passengerStatus.color}`}>
            {passengerStatus.status}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            {capacity.currentPassengers}/{capacity.maxPassengers} booked
          </span>
          <span className={passengerStatus.color}>
            {capacity.passengerUtilizationPercent.toFixed(0)}% full
          </span>
        </div>

        {/* Progress bar for passengers */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              capacity.passengerUtilizationPercent >= 95 ? 'bg-red-500 w-full' :
              capacity.passengerUtilizationPercent >= 80 ? 'bg-yellow-500' :
              capacity.passengerUtilizationPercent >= 50 ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={capacity.passengerUtilizationPercent < 95 ? { width: `${Math.min(capacity.passengerUtilizationPercent, 100)}%` } : undefined}
          ></div>
        </div>

        {showDetails && (
          <div className="mt-2 text-xs text-gray-600">
            {capacity.maxPassengers - capacity.currentPassengers} spaces remaining
          </div>
        )}
      </div>

      {/* Overall Status Alert */}
      {(capacity.vehicleUtilizationPercent >= 95 || capacity.passengerUtilizationPercent >= 95) && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-700 font-medium">
              Ferry is nearly full - book quickly to secure your spot!
            </span>
          </div>
        </div>
      )}

      {(capacity.vehicleUtilizationPercent < 50 && capacity.passengerUtilizationPercent < 50) && (
        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-700 font-medium">
              Plenty of space available for your booking
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacityIndicator;
