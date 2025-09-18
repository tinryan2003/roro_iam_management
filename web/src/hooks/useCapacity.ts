import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useApi } from './useApi';

// Types for capacity validation
export interface CapacityInfo {
  ferryId: number;
  ferryName: string;
  date: string;
  currentVehicles: number;
  maxVehicles: number;
  currentPassengers: number;
  maxPassengers: number;
  vehicleUtilizationPercent: number;
  passengerUtilizationPercent: number;
}

export interface CapacityCheckResult {
  available: boolean;
  vehicleAvailable: boolean;
  passengerAvailable: boolean;
  remainingVehicleSlots: number;
  remainingPassengerSlots: number;
  requestedVehicles: number;
  requestedPassengers: number;
  capacityInfo: CapacityInfo;
}

export interface CapacityError {
  type: 'VEHICLE_CAPACITY_EXCEEDED' | 'PASSENGER_CAPACITY_EXCEEDED' | 'GENERAL_ERROR';
  message: string;
  suggestions?: string[];
  capacityInfo?: CapacityInfo;
}

/**
 * Hook to get real-time ferry capacity information
 */
export function useFerryCapacity(ferryId?: number, date?: string) {
  const enabled = !!(ferryId && date);
  const endpoint = enabled ? `/api/capacity/ferry/${ferryId}?date=${date}` : '';
  
  return useApi<CapacityInfo>(endpoint, undefined, enabled);
}

/**
 * Hook to check capacity availability before booking
 */
export function useCapacityCheck() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const checkCapacity = async (
    ferryId: number, 
    date: string, 
    vehicles: number = 0, 
    passengers: number = 1
  ): Promise<CapacityCheckResult> => {
    setLoading(true);
    
    try {
      if (!session?.accessToken) {
        throw new Error('Authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const params = new URLSearchParams({
        date,
        vehicles: vehicles.toString(),
        passengers: passengers.toString()
      });

      console.log(`Checking capacity for ferry ${ferryId} on ${date} - vehicles: ${vehicles}, passengers: ${passengers}`);

      const response = await fetch(`${apiUrl}/api/capacity/ferry/${ferryId}/check?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Capacity check result:', result);
      
      return result;
    } catch (error) {
      console.error('Capacity check error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { checkCapacity, loading };
}

/**
 * Hook to parse and handle capacity-related errors
 */
export function useCapacityErrorHandler() {
  const parseCapacityError = (error: unknown): CapacityError => {
    console.log('Parsing capacity error:', error);
    
    // Type guard for error objects
    const isErrorObject = (err: unknown): err is { errorCode?: string; error?: string; message?: string } => {
      return typeof err === 'object' && err !== null;
    };
    
    // Handle structured error response from backend
    if (isErrorObject(error) && error.errorCode) {
      if (error.errorCode === 'VEHICLE_CAPACITY_EXCEEDED') {
        return {
          type: 'VEHICLE_CAPACITY_EXCEEDED',
          message: error.error || 'Ferry is full - no vehicle spaces available.',
          suggestions: [
            'Try a different ferry',
            'Choose another departure date', 
            'Reduce number of vehicles',
            'Consider traveling without vehicle'
          ]
        };
      } else if (error.errorCode === 'PASSENGER_CAPACITY_EXCEEDED') {
        return {
          type: 'PASSENGER_CAPACITY_EXCEEDED',
          message: error.error || 'Ferry is full - not enough passenger capacity.',
          suggestions: [
            'Reduce passenger count',
            'Choose a different ferry',
            'Select another departure date',
            'Split into multiple bookings'
          ]
        };
      }
    }

    // Handle error messages from API responses
    const errorMessage = isErrorObject(error) 
      ? (error.message || error.error || 'Unknown error')
      : typeof error === 'string' 
        ? error 
        : 'Unknown error';
    
    if (typeof errorMessage === 'string') {
      if (errorMessage.toLowerCase().includes('vehicle') && errorMessage.toLowerCase().includes('capacity')) {
        return {
          type: 'VEHICLE_CAPACITY_EXCEEDED',
          message: errorMessage,
          suggestions: [
            'Try a different ferry',
            'Choose another departure date',
            'Reduce number of vehicles'
          ]
        };
      } else if (errorMessage.toLowerCase().includes('passenger') && errorMessage.toLowerCase().includes('capacity')) {
        return {
          type: 'PASSENGER_CAPACITY_EXCEEDED',
          message: errorMessage,
          suggestions: [
            'Reduce passenger count',
            'Choose a different ferry',
            'Select another departure date'
          ]
        };
      }
    }

    // Default generic error
    return {
      type: 'GENERAL_ERROR',
      message: errorMessage,
      suggestions: ['Please try again or contact support']
    };
  };

  return { parseCapacityError };
}

/**
 * Utility function to get capacity status color and text
 */
export function getCapacityStatus(utilizationPercent: number) {
  if (utilizationPercent >= 95) {
    return { 
      color: 'text-red-600', 
      bgColor: 'bg-red-50 border-red-200',
      status: 'Full', 
      icon: '🔴' 
    };
  } else if (utilizationPercent >= 80) {
    return { 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50 border-yellow-200',
      status: 'Nearly Full', 
      icon: '🟡' 
    };
  } else if (utilizationPercent >= 50) {
    return { 
      color: 'text-blue-600', 
      bgColor: 'bg-blue-50 border-blue-200',
      status: 'Moderate', 
      icon: '🔵' 
    };
  } else {
    return { 
      color: 'text-green-600', 
      bgColor: 'bg-green-50 border-green-200',
      status: 'Available', 
      icon: '🟢' 
    };
  }
}

/**
 * Public capacity checking hook (no authentication required)
 * For public ferry booking interface
 */
export function usePublicCapacityCheck() {
  const [loading, setLoading] = useState(false);

  const checkCapacity = async (
    ferryId: number, 
    date: string, 
    vehicles: number = 0, 
    passengers: number = 1
  ): Promise<CapacityCheckResult> => {
    setLoading(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const params = new URLSearchParams({
        date,
        vehicles: vehicles.toString(),
        passengers: passengers.toString()
      });

      console.log(`Public checking capacity for ferry ${ferryId} on ${date} - vehicles: ${vehicles}, passengers: ${passengers}`);

      const response = await fetch(`${apiUrl}/api/capacity/ferry/${ferryId}/check?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Public capacity check result:', result);
      
      return result;
    } catch (error) {
      console.error('Public capacity check error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { checkCapacity, loading };
}

/**
 * Custom hook for customer token-based capacity checking (for customer portal)
 */
export function useCustomerCapacityCheck() {
  const [loading, setLoading] = useState(false);

  const checkCapacity = async (
    ferryId: number, 
    date: string, 
    vehicles: number = 0, 
    passengers: number = 1
  ): Promise<CapacityCheckResult> => {
    setLoading(true);
    
    try {
      // Get customer token from localStorage (for customer portal)
      const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;
      if (!customerToken) {
        throw new Error('Customer authentication required');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const params = new URLSearchParams({
        date,
        vehicles: vehicles.toString(),
        passengers: passengers.toString()
      });

      console.log(`Customer checking capacity for ferry ${ferryId} on ${date}`);

      const response = await fetch(`${apiUrl}/api/capacity/ferry/${ferryId}/check?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('customerToken');
            localStorage.removeItem('customerData');
          }
          throw new Error('Session expired. Please log in again.');
        }
        const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        throw new Error(errorText);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Customer capacity check error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { checkCapacity, loading };
}





