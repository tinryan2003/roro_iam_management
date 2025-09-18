"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export interface EmployeeProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
}

export interface CustomerProfileUpdateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  companyName: string;
}

interface CustomerProfileUpdateRequest extends Omit<CustomerProfileUpdateData, 'postalCode'> {
  postalCode?: string | number;
}

export function useEmployeeProfile() {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateEmployeeProfile = async (data: EmployeeProfileUpdateData) => {
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }

    setIsUpdating(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiUrl}/api/auth/employee/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: result.message || 'Profile updated successfully',
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateEmployeeProfile,
    isUpdating,
  };
} 

export function useCustomerProfile() {
  const { data: session } = useSession();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateCustomerProfile = async (data: CustomerProfileUpdateData) => {
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }

    setIsUpdating(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      // Convert postal code to string number if provided and valid
      const requestData: CustomerProfileUpdateRequest = { ...data };
      if (requestData.postalCode) {
        const postalCodeNum = parseInt(requestData.postalCode.toString());
        if (isNaN(postalCodeNum) || postalCodeNum < 10000 || postalCodeNum > 999999999) {
          throw new Error('Postal code must be between 10000 and 999999999 (5-9 digits)');
        }
        requestData.postalCode = postalCodeNum.toString();
      }
      
      const response = await fetch(`${apiUrl}/api/auth/customer/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        message: result.message || 'Profile updated successfully',
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      };
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateCustomerProfile,
    isUpdating,
  };
}




