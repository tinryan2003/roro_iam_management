"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface AdditionalCustomerData {
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  companyName?: string;
}

interface CustomerRegistrationResponse {
  success: boolean;
  message: string;
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    customerCode: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
    companyName?: string;
    isActive: boolean;
  };
  customerCode: string;
}

export function useKeycloakRegistration() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerFromKeycloak = async (additionalData?: AdditionalCustomerData): Promise<CustomerRegistrationResponse> => {
    if (!session?.accessToken) {
      throw new Error('No access token available');
    }

    setLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiUrl}/api/auth/customer/register-from-jwt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(additionalData || {}),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMessage = result.error || 'Registration failed';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkIfCustomerExists = async (): Promise<boolean> => {
    if (!session?.accessToken) {
      return false;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      
      const response = await fetch(`${apiUrl}/api/auth/customer/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        return result.customer !== null;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking customer existence:', error);
      return false;
    }
  };

  return { 
    registerFromKeycloak, 
    checkIfCustomerExists,
    loading, 
    error 
  };
}
