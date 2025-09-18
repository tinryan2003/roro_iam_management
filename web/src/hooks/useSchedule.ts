import { useState, useEffect, useCallback } from 'react';
import { ScheduleData, ScheduleSearchParams, ScheduleCapacity, ScheduleStatus } from '../types/schedule';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

/**
 * Hook to fetch schedules for a specific route
 */
export function useSchedulesByRoute(routeId?: number, status: ScheduleStatus = 'SCHEDULED', fromDate?: string) {
  const [data, setData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeId) {
      setData([]);
      return;
    }

    const fetchSchedules = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          status: status
        });
        
        if (fromDate) {
          params.append('fromDate', fromDate);
        }
        
        const response = await fetch(`${API_BASE}/api/schedules/route/${routeId}?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch schedules: ${response.statusText}`);
        }
        
        const schedules: ScheduleData[] = await response.json();
        setData(schedules);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, [routeId, status, fromDate]);

  return { data, loading, error };
}

/**
 * Hook to fetch a single schedule by ID
 */
export function useScheduleById(scheduleId?: number) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) {
      setData(null);
      return;
    }

    const fetchSchedule = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE}/api/schedules/${scheduleId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch schedule: ${response.statusText}`);
        }
        
        const schedule: ScheduleData = await response.json();
        setData(schedule);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, [scheduleId]);

  return { data, loading, error };
}

/**
 * Hook to search schedules with filters
 */
export function useScheduleSearch() {
  const [data, setData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchSchedules = async (params: ScheduleSearchParams) => {
    setLoading(true);
    setError(null);
    
    try {
      const searchParams = new URLSearchParams();
      
      if (params.departurePortId) {
        searchParams.append('departurePortId', params.departurePortId.toString());
      }
      if (params.arrivalPortId) {
        searchParams.append('arrivalPortId', params.arrivalPortId.toString());
      }
      if (params.departureDate) {
        searchParams.append('departureDate', params.departureDate);
      }
      if (params.status) {
        searchParams.append('status', params.status);
      }
      
      const url = `${API_BASE}/api/schedules/search?${searchParams}`;
      console.log('🌐 Making API call to:', url);
      console.log('📋 Search parameters:', params);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error response:', errorText);
        throw new Error(`Failed to search schedules: ${response.status} ${response.statusText}`);
      }
      
      const schedules: ScheduleData[] = await response.json();
      console.log('📊 Received schedules:', schedules.length, schedules);
      setData(schedules);
    } catch (err) {
      console.error('💥 Search error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, searchSchedules };
}

/**
 * Hook to get schedule capacity information
 */
export function useScheduleCapacity(scheduleId?: number) {
  const [data, setData] = useState<ScheduleCapacity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCapacity = useCallback(async (id?: number) => {
    const targetId = id || scheduleId;
    if (!targetId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/schedules/${targetId}/capacity`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch capacity: ${response.statusText}`);
      }
      
      const capacity: ScheduleCapacity = await response.json();
      setData(capacity);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    if (scheduleId) {
      fetchCapacity(scheduleId);
    }
  }, [scheduleId, fetchCapacity]);

  return { data, loading, error, refetch: fetchCapacity };
}

/**
 * Hook to get upcoming departures from a port
 */
export function useUpcomingDepartures(portId?: number, fromDate?: string, days: number = 7) {
  const [data, setData] = useState<ScheduleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portId) {
      setData([]);
      return;
    }

    const fetchDepartures = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          days: days.toString()
        });
        
        if (fromDate) {
          params.append('fromDate', fromDate);
        }
        
        const response = await fetch(`${API_BASE}/api/schedules/port/${portId}/departures?${params}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch departures: ${response.statusText}`);
        }
        
        const schedules: ScheduleData[] = await response.json();
        setData(schedules);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartures();
  }, [portId, fromDate, days]);

  return { data, loading, error };
}
