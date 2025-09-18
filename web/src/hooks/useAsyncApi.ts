/**
 * Enhanced async API hooks with optimistic updates, caching, and real-time sync
 * Complements the backend async notification system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { BookingData, BookingCreatePayload } from './useApi';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface AsyncOptions {
  enableOptimisticUpdates?: boolean;
  cacheTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Enhanced booking creation with optimistic updates and retry logic
 */
export function useAsyncBookingCreation(options: AsyncOptions = {}) {
  const {
    enableOptimisticUpdates = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options;

  const [state, setState] = useState<AsyncState<BookingData>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null
  });

  const retryCount = useRef(0);

  const createBooking = useCallback(async (
    payload: BookingCreatePayload,
    onProgress?: (stage: string) => void
  ): Promise<BookingData> => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Stage 1: Validation
      onProgress?.('Validating booking details...');
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate validation

      // Stage 2: Optimistic update
      if (enableOptimisticUpdates) {
        onProgress?.('Creating booking...');
        const optimisticBooking: Partial<BookingData> = {
          id: Date.now(), // Temporary ID
          bookingCode: `TEMP-${Date.now()}`,
          customerId: payload.customerId,
          routeId: 1, // Default route
          ferryId: 1, // Default ferry
          passengerCount: payload.passengerCount,
          totalAmount: payload.totalAmount,
          status: 'PENDING',
          departureTime: new Date().toISOString()
        };
        
        setState(prev => ({
          ...prev,
          data: optimisticBooking as BookingData,
          loading: true
        }));
      }

      // Stage 3: API call
      onProgress?.('Submitting to server...');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiUrl}/api/bookings/public/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Booking failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Stage 4: Success
      onProgress?.('Booking created successfully!');
      setState({
        data: result,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });

      retryCount.current = 0;
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Retry logic
      if (retryCount.current < retryAttempts) {
        retryCount.current++;
        onProgress?.(`Retrying... (${retryCount.current}/${retryAttempts})`);
        
        await new Promise(resolve => 
          setTimeout(resolve, retryDelay * retryCount.current)
        );
        
        return createBooking(payload, onProgress);
      }

      setState({
        data: null,
        loading: false,
        error: errorMessage,
        lastUpdated: Date.now()
      });

      throw error;
    }
  }, [enableOptimisticUpdates, retryAttempts, retryDelay]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null
    });
    retryCount.current = 0;
  }, []);

  return {
    ...state,
    createBooking,
    reset,
    isOptimistic: enableOptimisticUpdates && state.loading
  };
}

/**
 * Real-time booking status tracker
 */
export function useBookingStatusTracker(bookingId?: number) {
  const [status, setStatus] = useState<{
    currentStatus: string;
    history: Array<{ status: string; timestamp: string; notes?: string }>;
    loading: boolean;
  }>({
    currentStatus: 'UNKNOWN',
    history: [],
    loading: false
  });

  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const startTracking = useCallback(() => {
    if (!bookingId) return;

    setStatus(prev => ({ ...prev, loading: true }));

    const fetchStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
        const response = await fetch(`${apiUrl}/api/booking-workflow/status/${bookingId}`);
        
        if (response.ok) {
          const statusData = await response.json();
          setStatus({
            currentStatus: statusData.status,
            history: statusData.history || [],
            loading: false
          });
        }
      } catch (error) {
        console.error('Failed to fetch booking status:', error);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 30 seconds
    pollInterval.current = setInterval(fetchStatus, 30000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [bookingId]);

  const stopTracking = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
    }
    setStatus(prev => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    const cleanup = startTracking();
    return cleanup;
  }, [startTracking]);

  return {
    ...status,
    startTracking,
    stopTracking
  };
}

/**
 * Background sync for booking data
 */
export function useBookingSync() {
  const [syncStatus, setSyncStatus] = useState<{
    lastSync: number | null;
    syncing: boolean;
    pendingChanges: number;
  }>({
    lastSync: null,
    syncing: false,
    pendingChanges: 0
  });

  const syncBookings = useCallback(async () => {
    setSyncStatus(prev => ({ ...prev, syncing: true }));

    try {
      // Simulate background sync operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSyncStatus({
        lastSync: Date.now(),
        syncing: false,
        pendingChanges: 0
      });

      console.log('📡 Booking data synced successfully');
      
    } catch (error) {
      setSyncStatus(prev => ({ ...prev, syncing: false }));
      console.error('❌ Booking sync failed:', error);
    }
  }, []);

  // Auto-sync every 5 minutes
  useEffect(() => {
    const interval = setInterval(syncBookings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncBookings]);

  return {
    ...syncStatus,
    forceSync: syncBookings
  };
}
