import React from 'react';
import { AlertTriangle, X, Calendar, Ship, Users, Car } from 'lucide-react';
import { CapacityError } from '@/hooks/useCapacity';

interface CapacityErrorAlertProps {
  error: CapacityError;
  onClose?: () => void;
  onRetry?: () => void;
  className?: string;
}

export const CapacityErrorAlert: React.FC<CapacityErrorAlertProps> = ({
  error,
  onClose,
  onRetry,
  className = ''
}) => {
  const getErrorIcon = () => {
    switch (error.type) {
      case 'VEHICLE_CAPACITY_EXCEEDED':
        return <Car className="h-5 w-5 text-red-500" />;
      case 'PASSENGER_CAPACITY_EXCEEDED':
        return <Users className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'VEHICLE_CAPACITY_EXCEEDED':
        return 'Vehicle Capacity Full';
      case 'PASSENGER_CAPACITY_EXCEEDED':
        return 'Passenger Capacity Full';
      default:
        return 'Booking Error';
    }
  };

  const getSuggestionIcon = (suggestion: string) => {
    if (suggestion.toLowerCase().includes('ferry')) {
      return <Ship className="h-4 w-4 text-blue-500" />;
    } else if (suggestion.toLowerCase().includes('date')) {
      return <Calendar className="h-4 w-4 text-blue-500" />;
    } else if (suggestion.toLowerCase().includes('vehicle')) {
      return <Car className="h-4 w-4 text-blue-500" />;
    } else if (suggestion.toLowerCase().includes('passenger')) {
      return <Users className="h-4 w-4 text-blue-500" />;
    }
    return <div className="h-4 w-4 rounded-full bg-blue-500" />;
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getErrorIcon()}
          <div>
            <h3 className="text-sm font-semibold text-red-800">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error.message}
            </p>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 transition-colors"
            title="Close error message"
            aria-label="Close error message"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Capacity Info */}
      {error.capacityInfo && (
        <div className="mt-3 p-3 bg-white rounded border border-red-100">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Current Capacity:</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-600">Vehicles:</span>
              <span className="ml-2 font-medium">
                {error.capacityInfo.currentVehicles}/{error.capacityInfo.maxVehicles}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Passengers:</span>
              <span className="ml-2 font-medium">
                {error.capacityInfo.currentPassengers}/{error.capacityInfo.maxPassengers}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {error.suggestions && error.suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">
            Try these alternatives:
          </h4>
          <ul className="space-y-2">
            {error.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-center space-x-2">
                {getSuggestionIcon(suggestion)}
                <span className="text-sm text-red-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 flex space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        )}
        
        <button
          onClick={() => window.history.back()}
          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
        >
          Go Back
        </button>
      </div>

      {/* Quick Actions */}
      {(error.type === 'VEHICLE_CAPACITY_EXCEEDED' || error.type === 'PASSENGER_CAPACITY_EXCEEDED') && (
        <div className="mt-4 pt-3 border-t border-red-200">
          <p className="text-xs text-red-600 mb-2">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
              <Calendar className="h-3 w-3 inline mr-1" />
              Change Date
            </button>
            <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
              <Ship className="h-3 w-3 inline mr-1" />
              Different Ferry
            </button>
            {error.type === 'VEHICLE_CAPACITY_EXCEEDED' && (
              <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                <Car className="h-3 w-3 inline mr-1" />
                Reduce Vehicles
              </button>
            )}
            {error.type === 'PASSENGER_CAPACITY_EXCEEDED' && (
              <button className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                <Users className="h-3 w-3 inline mr-1" />
                Reduce Passengers
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CapacityErrorAlert;
