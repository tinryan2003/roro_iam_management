"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTokenExpiration } from './useTokenExpiration';
import { handleNoMatchingKey } from '@/lib/auth/utils';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Helper function to check if error message indicates no matching key
const isNoMatchingKeyError = (errorMessage: string): boolean => {
  const noKeyPatterns = [
    'no matching key',
    'key not found',
    'invalid key',
    'authentication key expired',
    'key does not exist',
    'unauthorized key',
    'token invalid',
    'invalid token',
    'token expired',
    'session expired'
  ];
  
  const message = errorMessage.toLowerCase();
  return noKeyPatterns.some(pattern => message.includes(pattern));
};

export function useApi<T>(endpoint: string, options?: RequestInit, enabled: boolean = true): ApiResponse<T> {
  const { data: session, status } = useSession();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { handleAuthError } = useTokenExpiration();

  const fetchData = useCallback(async (allowRetry: boolean = true) => {
    // Don't proceed if not enabled or session is still loading
    if (!enabled || status === 'loading') {
      setLoading(false);
      return;
    }

    // If session is unauthenticated, set appropriate state and don't retry
    if (status === 'unauthenticated') {
      setError('Authentication required');
      setLoading(false);
      return;
    }

    if (!session?.accessToken) {
      // Only log once when session status is stable but no token available
      if (status === 'authenticated') {
        console.warn('Session authenticated but no access token available');
      }
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use environment variable for API URL with fallback
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      console.log('Fetching:', `${apiUrl}${endpoint}`, 'with token:', session.accessToken.substring(0, 20) + '...'); // Debug log

      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
          ...options?.headers,
        },
      });

      // Handle authentication/authorization errors without forcing global logout
      if (response.status === 401) {
        console.warn('Unauthorized (401) - attempting token refresh via handleAuthError');
        const wasHandled = await handleAuthError(401);
        if (wasHandled && allowRetry) {
          // Retry once after token refresh
          await fetchData(false);
          return;
        }
        setError('Unauthorized');
        setLoading(false);
        return;
      } else if (response.status === 403) {
        console.warn('Authorization failed (403) - not enough permissions');
        setError('Forbidden');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        
        // Check if this is a "no matching key" error and handle it specially
        if (isNoMatchingKeyError(errorText)) {
          console.log('No matching key detected in API response, triggering logout to home');
          await handleNoMatchingKey(`API Error: ${errorText}`);
          return; // Don't continue processing after logout
        }
        
        throw new Error(errorText);
      }

      // Handle empty responses (like 204 No Content)
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (response.status === 204 || contentLength === '0' || 
          (!contentType || !contentType.includes('application/json'))) {
        setData(null); // Set null for empty responses
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      
      // Check if this is a "no matching key" error and handle it specially
      if (isNoMatchingKeyError(errorMessage)) {
        console.log('No matching key detected in error, triggering logout to home');
        await handleNoMatchingKey(`API Error: ${errorMessage}`);
        return; // Don't continue processing after logout
      }
      
      setError(errorMessage);
      console.error('API Error:', {
        endpoint,
        error: err,
        session: !!session?.accessToken
      });
    } finally {
      setLoading(false);
    }
  }, [endpoint, session, options, handleAuthError, enabled, status]);

  useEffect(() => {
    // Only run if enabled and session status is not loading
    if (!enabled || status === 'loading') {
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, enabled, status]);

  return { data, loading, error, refetch: fetchData };
}

// API mutation functions
export function useApiMutation() {
  const { data: session, status } = useSession();
  const { handleAuthError } = useTokenExpiration();
  const [loading, setLoading] = useState(false);

  const mutate = async <T>(endpoint: string, options: RequestInit): Promise<T | null> => {
    if (status === 'loading') {
      throw new Error('Session is still loading');
    }
    
    if (status === 'unauthenticated') {
      throw new Error('Authentication required');
    }
    
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }

    setLoading(true);
    try {
      // Use environment variable for API URL with fallback
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
          ...options.headers,
        },
      });

      // Handle authentication/authorization errors
      if (response.status === 401) {
        console.error('Authentication failed in useApiMutation (401) - token may be expired');
        const wasHandled = await handleAuthError(response.status);
        if (wasHandled) {
          throw new Error('Authentication failed - please log in again');
        }
        throw new Error('Unauthorized: You need to log in with admin privileges to create employees');
      } else if (response.status === 403) {
        console.warn('Authorization failed in useApiMutation (403) - not enough permissions');
        throw new Error('Forbidden: You do not have admin privileges to create employees');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        
        // Handle specific error cases
        if (response.status === 400) {
          errorMessage = errorData.error || errorData.message || 'Bad Request: Please check your input data';
        } else if (response.status === 409) {
          errorMessage = errorData.error || 'Conflict: This data already exists';
        }
        
        // Check if this is a "no matching key" error and handle it specially
        if (isNoMatchingKeyError(errorMessage)) {
          console.log('No matching key detected in mutation response, triggering logout to home');
          await handleNoMatchingKey(`API Mutation Error: ${errorMessage}`);
          return null; // Return null after logout
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (like 204 No Content for DELETE operations)
      const contentLength = response.headers.get('content-length');
      const contentType = response.headers.get('content-type');
      
      if (response.status === 204 || contentLength === '0' || 
          (!contentType || !contentType.includes('application/json'))) {
        return null; // Return null for empty responses
      }

      return await response.json();
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}


// Vehicle response interface
export interface VehicleResponse {
  id: number;
  vehicleType: string;
  make: string;
  model: string;
  quantity: number;
  isActive: boolean;
  createdAt?: string;
  customerId?: number;
  customerName?: string;
  bookingId?: number;
  bookingCode?: string;
  price?: number;
}

// Backend response interfaces
export interface BookingData {
  id: number;
  customerId: number;
  routeId: number;
  ferryId: number;
  vehicleId?: number | number[]; // Can be single or array
  bookingCode: string;
  passengerCount: number;
  totalAmount: number;
  departureTime: string;
  status: string;
  note: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Workflow fields
  paymentDeadline?: string;
  approvalNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  rejectedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  paidAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  
  // Refund fields
  refundRequested?: boolean;
  refundApproved?: boolean;
  refundRejected?: boolean;
  refundReason?: string;
  refundAmount?: number;
  refundNotes?: string;
  refundProcessedBy?: string;
  refundProcessedAt?: string;
  refundRequestedAt?: string;
  refundRequestedBy?: string;
  refundDecisionNotes?: string;
  
  // Arrival confirmation
  confirmedArrivalBy?: string;
  confirmedArrivalAt?: string;
  
  // Vehicle information
  vehicles?: VehicleResponse[];
}

// Booking creation payload matching backend BookingCreateRequest
export interface BookingCreatePayload {
  customerId: number
  scheduleId: number;
  passengerCount: number;
  vehicleId?: number; // Optional: Can be null if no vehicle is being booked
  vehicleIds?: number[]; // New: For multiple vehicles
  totalAmount: number;
}

export interface EmployeeData {
  employeeId: number;          
  employeeCode: string;
  accountId: number;
  position: string;
  hireDate: string;
  salary: number;               
  active: boolean;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  fullName?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  displayPosition?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CustomerData {
  id: number;
  customerCode?: string;
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FerryData {
  id: number;
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

export function useBookings(enabled: boolean = true) {
  return useApi<BookingData[]>('/api/bookings/my-bookings', undefined, enabled);
}

// Admin/Operator: get all bookings with pagination
export function useAllBookings(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/bookings?page=${page}&limit=${limit}`);
}

export function useBookingStats() {
  return useApi<{
    totalBookings: number;
    todayBookings: number;
    thisWeekBookings: number;
    thisMonthBookings: number;
  }>('/api/bookings/stats');
}

export function useEmployees(page = 0, limit = 10) {
  return useApi<{ content: EmployeeData[]; totalElements: number }>(`/api/employees?page=${page}&limit=${limit}`);
}

export function useCustomers(page = 0, limit = 10) {
  return useApi<{ content: CustomerData[]; totalElements: number }>(`/api/customers?page=${page}&limit=${limit}`);
}

export interface CurrentEmployeeData {
  message: string;
  employee: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  };
  token: string;
}



export interface CurrentCustomerData {
  message: string;
  user: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    isActive: boolean;
    username?: string;
  };
  customer?: {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    companyName?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    isActive: boolean;
    username?: string;
  } | null;
  token: string;
}


export function useCurrentEmployeeUser() {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated' && !!session?.accessToken;
  const result = useApi<CurrentEmployeeData>('/api/auth/employee/me', undefined, enabled);

  return {
    ...result,
    employee: result.data?.employee,
    isAuthenticated: !!session,
  };
}

export function useCurrentCustomerUser() {
  const { data: session, status } = useSession();
  const enabled = status === 'authenticated' && !!session?.accessToken;
  const result = useApi<CurrentCustomerData>('/api/auth/customer/me', undefined, enabled);
  return {
    ...result,
    customer: result.data?.customer,
    user: result.data?.user,
    isAuthenticated: !!session,
  };
}

// Specialized mutation hook for employee creation
export function useCreateEmployee() {
  const { mutate, loading } = useApiMutation();

  const createEmployee = async (employeeData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string; 
    dateOfBirth: string; 
    address: string;
    city: string;
    country: string;
    postalCode: string;
    employeeCode: string;
    position: string;
    hireDate: string;
    salary: number;
  }) => {
    return mutate('/api/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  };

  return { createEmployee, loading };
}

// Get single employee by ID
export function useEmployee(id: number | string) {
  return useApi<EmployeeData>(`/api/employees/${id}`);
}

// Update employee hook
export function useUpdateEmployee() {
  const { mutate, loading } = useApiMutation();

  const updateEmployee = async (id: number, updateData: {
    employeeCode?: string;
    position?: string;
    hireDate?: string;
    salary?: number;
  }) => {
    return mutate(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  };

  return { updateEmployee, loading };
}

// Delete employee hook
export function useDeleteEmployee() {
  const { mutate, loading } = useApiMutation();

  const deleteEmployee = async (id: number): Promise<void> => {
    await mutate(`/api/employees/${id}`, {
      method: 'DELETE'
    });
    // DELETE operations return null/void, so we don't return anything
  };

  return { deleteEmployee, loading };
}

// Reactivate employee hook
export function useReactivateEmployee() {
  const { mutate, loading } = useApiMutation();

  const reactivateEmployee = async (id: number): Promise<void> => {
    await mutate(`/api/employees/${id}/reactivate`, {
      method: 'PATCH'
    });
    // PATCH reactivation returns success message, but we don't need to return it
  };

  return { reactivateEmployee, loading };
}

// Specialized mutation hook for customer creation
export function useCreateCustomer() {
  const { mutate, loading } = useApiMutation();

  const createCustomer = async (customerData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    dateOfBirth: string;
    customerCode?: string;
    companyName?: string;
    address: string;
    city: string;
    country: string;
    postalCode?: string;
  }) => {
    return mutate('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerData)
    });
  };

  return { createCustomer, loading };
}

// Ferry hooks
export function useFerries(page = 0, limit = 10) {
  return useApi<{
    content: FerryData[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }>(`/api/ferries?page=${page}&limit=${limit}`);
}

export function useFerry(id: number | string) {
  return useApi<FerryData>(`/api/ferries/${id}`);
}


// Vehicles by customer
export interface VehicleData {
  id: number;
  vehicleType: string;
  make?: string;
  model?: string;
  quantity: number;  // Added quantity for RoRo operations
  isActive: boolean;
  price: number; // Price of the vehicle based on its type
}

export function useVehiclesByCustomer(customerId?: number) {
  const enabled = !!customerId;
  return useApi<VehicleData[]>(customerId ? `/api/vehicles/by-customer/${customerId}` : '', undefined, enabled);
}

export function useCreateVehicle(customerId?: number) {
  const { mutate, loading } = useApiMutation();
  const createVehicle = async (data: { vehicleType: string; make?: string; model?: string; quantity?: number; }) => {
    if (!customerId) throw new Error('Missing customerId');
    return mutate<VehicleData>(`/api/vehicles/by-customer/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };
  return { createVehicle, loading };
}

export function useAddVehicleToBooking() {
  const { mutate, loading } = useApiMutation();
  const addVehicle = async (bookingId: number, vehicleId: number) => {
    return mutate(`/api/bookings/${bookingId}/vehicles/${vehicleId}`, {
      method: 'POST',
    });
  };
  return { addVehicle, loading };
}

export function useRemoveVehicleFromBooking() {
  const { mutate, loading } = useApiMutation();
  const removeVehicle = async (bookingId: number, vehicleId: number) => {
    return mutate(`/api/bookings/${bookingId}/vehicles/${vehicleId}`, {
      method: 'DELETE',
    });
  };
  return { removeVehicle, loading };
}

export function useCreateFerry() {
  const { mutate, loading } = useApiMutation();

  const createFerry = async (ferryData: {
    ferryName: string;
    ferryCode: string;
    capacityVehicles: number;
    capacityPassengers: number;
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  }) => {
    return mutate('/api/ferries', {
      method: 'POST',
      body: JSON.stringify(ferryData)
    });
  };

  return { createFerry, loading };
}

export function useUpdateFerry() {
  const { mutate, loading } = useApiMutation();

  const updateFerry = async (id: number, updateData: {
    ferryName?: string;
    ferryCode?: string;
    capacityVehicles?: number;
    capacityPassengers?: number;
    status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  }) => {
    return mutate(`/api/ferries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  };

  return { updateFerry, loading };
}

export function useDeleteFerry() {
  const { mutate, loading } = useApiMutation();

  const deleteFerry = async (id: number): Promise<void> => {
    await mutate(`/api/ferries/${id}`, {
      method: 'DELETE'
    });
  };

  return { deleteFerry, loading };
}

// Create booking hook (customer/admin/operator)
// Routes hooks
export interface RouteData {
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
  price: number;
  durationHours: number;
  isActive: boolean;
}

export function useRoutes(activeOnly: boolean = true) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const endpoint = activeOnly ? '/api/routes/active' : '/api/routes?page=0&limit=1000';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (activeOnly) {
        // /api/routes/active returns RouteData[]
        setRoutes(data);
      } else {
        // /api/routes returns Page<RouteData> - extract content
        setRoutes(data.content || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch routes');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchRoutes();
  }, [fetchRoutes]);

  return { data: routes, loading, error, refetch: fetchRoutes };
}

// Schedule interfaces and hooks
export interface ScheduleData {
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
  
  // Route information (flat structure from backend)
  routeId?: number;
  routeName?: string;
  departurePortName?: string;
  arrivalPortName?: string;
  
  // Ferry information (flat structure from backend)
  ferryId?: number;
  ferryName?: string;
  ferryCode?: string;
  
  // Legacy nested structures for backward compatibility
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

export function useSchedules(page = 0, limit = 10, upcomingOnly = false, status?: string, fromDate?: string, toDate?: string) {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    upcomingOnly: upcomingOnly.toString(),
    sortDirection: 'asc' // Default to ascending for timeline view
  });

  if (status && status !== 'all') {
    queryParams.append('status', status);
  }
  
  if (fromDate) {
    queryParams.append('fromDate', fromDate);
  }
  
  if (toDate) {
    queryParams.append('toDate', toDate);
  }

  return useApi<{
    content: ScheduleData[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  }>(`/api/schedules?${queryParams.toString()}`);
}

export function useSchedule(id: number | string) {
  return useApi<ScheduleData>(`/api/schedules/${id}`);
}

export function useCreateBooking() {
  const [loading, setLoading] = useState(false);

  const createBooking = async (bookingData: BookingCreatePayload) => {
    setLoading(true);
    try {
      // Get customer token from localStorage
      const customerToken = typeof window !== 'undefined' ? localStorage.getItem('customerToken') : null;
      if (!customerToken) {
        throw new Error('Customer authentication required to create booking');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      console.log('Creating booking with customer token:', customerToken.substring(0, 20) + '...');

      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${customerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
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
      console.error('Booking creation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading };
}

/**
 * Public booking creation hook (no authentication required)
 * For public ferry booking demo interface
 */
export function useCreatePublicBooking() {
  const [loading, setLoading] = useState(false);

  const createBooking = async (bookingData: BookingCreatePayload) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      console.log('Creating public booking:', bookingData);

      const response = await fetch(`${apiUrl}/api/bookings/public/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => `HTTP ${response.status}: ${response.statusText}`);
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Public booking created successfully:', result);
      return result;
    } catch (error) {
      console.error('Public booking creation error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading };
}

// ==================== WORKFLOW HOOKS ====================

// ACCOUNTANT HOOKS

export function usePendingBookings(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/booking-workflow/pending-approval?page=${page}&limit=${limit}`);
}

export function useApproveBooking() {
  const { mutate, loading } = useApiMutation();
  
  const approveBooking = async (bookingId: number, notes: string) => {
    return mutate(`/api/booking-workflow/${bookingId}/approve`, {
      method: 'PATCH',
      body: JSON.stringify({ notes })
    });
  };
  
  return { approveBooking, loading };
}

export function useRejectBooking() {
  const { mutate, loading } = useApiMutation();
  
  const rejectBooking = async (bookingId: number, reason: string) => {
    return mutate(`/api/booking-workflow/${bookingId}/reject`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  };
  
  return { rejectBooking, loading };
}

export function useRefundRequests(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/booking-workflow/refund-requests?page=${page}&limit=${limit}`);
}

export function useProcessRefund() {
  const { mutate, loading } = useApiMutation();
  
  const processRefund = async (bookingId: number, amount: number, notes: string) => {
    return mutate(`/api/booking-workflow/${bookingId}/process-refund`, {
      method: 'PATCH',
      body: JSON.stringify({ amount, notes })
    });
  };
  
  return { processRefund, loading };
}

// CUSTOMER HOOKS

export function useAwaitingPaymentBookings(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/booking-workflow/awaiting-payment?page=${page}&limit=${limit}`);
}

export function useMarkBookingAsPaid() {
  const { mutate, loading } = useApiMutation();
  
  const markAsPaid = async (bookingId: number) => {
    return mutate(`/api/booking-workflow/${bookingId}/mark-paid`, {
      method: 'PATCH'
    });
  };
  
  return { markAsPaid, loading };
}

export function useCompleteBooking() {
  const { mutate, loading } = useApiMutation();
  
  const completeBooking = async (bookingId: number) => {
    return mutate(`/api/booking-workflow/${bookingId}/complete`, {
      method: 'PATCH'
    });
  };
  
  return { completeBooking, loading };
}

export function useCancelBooking() {
  const { mutate, loading } = useApiMutation();
  
  const cancelBooking = async (bookingId: number, reason: string) => {
    return mutate(`/api/booking-workflow/${bookingId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason })
    });
  };
  
  return { cancelBooking, loading };
}

// OPERATION MANAGER / PLANNER HOOKS

export function useInReviewBookings(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/booking-workflow/in-review?page=${page}&limit=${limit}`);
}

export function useApproveReview() {
  const { mutate, loading } = useApiMutation();

  const approveReview = async (bookingId: number, notes: string) => {
    return mutate(`/api/booking-workflow/${bookingId}/approve-review`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  };

  return { approveReview, loading };
}

export function useInProgressBookings(page = 0, limit = 10) {
  return useApi<{ content: BookingData[]; totalElements: number }>(`/api/booking-workflow/in-progress?page=${page}&limit=${limit}`);
}

export function useConfirmArrival() {
  const { mutate, loading } = useApiMutation();
  
  const confirmArrival = async (bookingId: number) => {
    return mutate(`/api/booking-workflow/${bookingId}/confirm-arrival`, {
      method: 'PATCH'
    });
  };
  
  return { confirmArrival, loading };
}

// SHARED WORKFLOW UTILITIES

export function useBookingWorkflowStats() {
  return useApi<{
    pendingCount: number;
    awaitingPaymentCount: number;
    inProgressCount: number;
    refundRequestsCount: number;
    completedTodayCount: number;
  }>('/api/booking-workflow/stats');
}