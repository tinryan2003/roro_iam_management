import React from 'react';
import { Calendar, Ship, Users, Car, TrendingUp } from 'lucide-react';
import { CapacityInfo } from '@/hooks/useCapacity';

interface CapacitySuggestionsProps {
  capacityInfo: CapacityInfo;
  requestedVehicles: number;
  requestedPassengers: number;
  className?: string;
}

export const CapacitySuggestions: React.FC<CapacitySuggestionsProps> = ({
  capacityInfo,
  requestedVehicles,
  requestedPassengers,
  className = ''
}) => {
  const vehicleUtilization = capacityInfo.vehicleUtilizationPercent;
  const passengerUtilization = capacityInfo.passengerUtilizationPercent;
  
  const canAccommodateVehicles = (capacityInfo.currentVehicles + requestedVehicles) <= capacityInfo.maxVehicles;
  const canAccommodatePassengers = (capacityInfo.currentPassengers + requestedPassengers) <= capacityInfo.maxPassengers;
  
  const suggestions = [];

  // Generate suggestions based on capacity status
  if (!canAccommodateVehicles) {
    suggestions.push({
      type: 'vehicle-reduce',
      icon: <Car className="h-4 w-4 text-orange-500" />,
      title: 'Reduce Vehicle Count',
      description: `Try booking ${Math.max(0, capacityInfo.maxVehicles - capacityInfo.currentVehicles)} or fewer vehicles`,
      priority: 'high'
    });
    
    suggestions.push({
      type: 'no-vehicle',
      icon: <Users className="h-4 w-4 text-blue-500" />,
      title: 'Travel Without Vehicle',
      description: 'Consider passenger-only booking for this sailing',
      priority: 'medium'
    });
  }

  if (!canAccommodatePassengers) {
    suggestions.push({
      type: 'passenger-reduce',
      icon: <Users className="h-4 w-4 text-orange-500" />,
      title: 'Reduce Passenger Count',
      description: `Try booking ${Math.max(1, capacityInfo.maxPassengers - capacityInfo.currentPassengers)} or fewer passengers`,
      priority: 'high'
    });
  }

  if (vehicleUtilization > 70 || passengerUtilization > 70) {
    suggestions.push({
      type: 'different-date',
      icon: <Calendar className="h-4 w-4 text-green-500" />,
      title: 'Try Different Date',
      description: 'This ferry is getting full. Other dates may have more availability',
      priority: 'medium'
    });
    
    suggestions.push({
      type: 'different-ferry',
      icon: <Ship className="h-4 w-4 text-green-500" />,
      title: 'Choose Different Ferry',
      description: 'Other ferries on this route may have better availability',
      priority: 'medium'
    });
  }

  if (vehicleUtilization > 85 || passengerUtilization > 85) {
    suggestions.push({
      type: 'book-quickly',
      icon: <TrendingUp className="h-4 w-4 text-red-500" />,
      title: 'Book Quickly!',
      description: 'This ferry is almost full. Spaces are filling up fast',
      priority: 'urgent'
    });
  }

  // If no issues, show positive message
  if (canAccommodateVehicles && canAccommodatePassengers && vehicleUtilization < 70 && passengerUtilization < 70) {
    return (
      <div className={`p-4 bg-green-50 border border-green-200 rounded-lg ${className}`}>
        <div className="flex items-center space-x-2">
          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-800">Good availability</span>
        </div>
        <p className="text-sm text-green-700 mt-1">
          Plenty of space available for your booking. You can proceed with confidence!
        </p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-200 bg-red-50';
      case 'high': return 'border-orange-200 bg-orange-50';
      case 'medium': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700';
      case 'high': return 'text-orange-700';
      case 'medium': return 'text-blue-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-sm font-medium text-gray-800 flex items-center">
        <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
        Capacity Suggestions
      </h4>
      
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
        >
          <div className="flex items-start space-x-3">
            {suggestion.icon}
            <div className="flex-1">
              <h5 className={`text-sm font-medium ${getPriorityTextColor(suggestion.priority)}`}>
                {suggestion.title}
              </h5>
              <p className={`text-xs mt-1 ${getPriorityTextColor(suggestion.priority)}`}>
                {suggestion.description}
              </p>
            </div>
            
            {suggestion.priority === 'urgent' && (
              <div className="flex items-center">
                <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>
        </div>
      ))}
      
      {/* Capacity Summary */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
        <h5 className="text-xs font-medium text-gray-600 mb-2">Current Status:</h5>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-gray-500">Vehicles:</span>
            <div className={`font-medium ${
              canAccommodateVehicles ? 'text-green-600' : 'text-red-600'
            }`}>
              {capacityInfo.currentVehicles + (canAccommodateVehicles ? requestedVehicles : 0)}/{capacityInfo.maxVehicles}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Passengers:</span>
            <div className={`font-medium ${
              canAccommodatePassengers ? 'text-green-600' : 'text-red-600'
            }`}>
              {capacityInfo.currentPassengers + (canAccommodatePassengers ? requestedPassengers : 0)}/{capacityInfo.maxPassengers}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapacitySuggestions;
