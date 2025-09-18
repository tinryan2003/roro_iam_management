"use client";

import { useState, useCallback } from 'react';


interface CustomerLoginData {
  usernameOrEmail: string;
  password: string;
}

interface CustomerAuthResponse {
  token: string;
  tokenType: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  customerCode: string;
  isActive: boolean;
  message: string;
  role?: string;
}

interface CustomerProfile {
  customerId: number;
  customerCode: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
}

// Helper function to decode JWT token and extract claims
const decodeJwtToken = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
};

export function useCustomerAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';


  const login = useCallback(async (data: CustomerLoginData): Promise<CustomerAuthResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/public/customer/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      // Store token in localStorage for customer sessions
      if (result.token) {
        localStorage.setItem('customerToken', result.token);
        
        // Decode token to get role
        const tokenClaims = decodeJwtToken(result.token);
        const role = tokenClaims?.role || 'CUSTOMER';
        
        localStorage.setItem('customerData', JSON.stringify({
          username: result.username,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
          customerCode: result.customerCode,
          isActive: result.isActive,
          role: role
        }));
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const logout = useCallback(() => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    window.location.href = '/customer/login';
  }, []);

  const getProfile = useCallback(async (): Promise<CustomerProfile> => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${apiUrl}/api/public/customer/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, logout
          logout();
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(result.error || 'Failed to get profile');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get profile';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiUrl, logout]);

  const validateToken = useCallback(async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        return false;
      }

      const response = await fetch(`${apiUrl}/api/public/customer/validate-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result.valid === true;
    } catch (err) {
      console.error('Token validation failed:', err);
      return false;
    }
  }, [apiUrl]);

  const isAuthenticated = useCallback((): boolean => {
    return !!localStorage.getItem('customerToken');
  }, []);

  const getStoredCustomerData = useCallback(() => {
    const data = localStorage.getItem('customerData');
    return data ? JSON.parse(data) : null;
  }, []);

  return {
    login,
    logout,
    getProfile,
    validateToken,
    isAuthenticated,
    getStoredCustomerData,
    loading,
    error,
  };
}