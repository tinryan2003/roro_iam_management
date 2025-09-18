import { useState } from 'react';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  companyName?: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  dateOfBirth: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

type AuthRealm = 'customer' | 'employee';

interface AuthOptions {
  realm?: AuthRealm;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);

  const registerCustomer = async (data: RegisterData, options?: AuthOptions): Promise<ApiResponse<{ message: string; customer: object }>> => {
    setIsLoading(true);
    
    try {
      // Determine the API endpoint based on the realm
      const realm = options?.realm || 'customer';
      const endpoint = realm === 'employee' 
        ? `/auth/employee/register`
        : `/auth/register`;
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          data: result,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Registration failed. Please try again.',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'An error occurred. Please try again later.',
      };
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string, options?: AuthOptions): Promise<ApiResponse<{exists: boolean}>> => {
    try {
      // Determine the API endpoint based on the realm
      const realm = options?.realm || 'customer';
      const endpoint = realm === 'employee' 
        ? `/accounts/employee/check-username/${username}`
        : `/accounts/check-username/${username}`;
        
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      const result = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: result,
        };
      } else {
        return {
          success: false,
          error: 'Unable to check username availability',
        };
      }
         } catch {
       return {
         success: false,
         error: 'Unable to check username availability',
       };
     }
  };

  return {
    isLoading,
    registerCustomer,
    checkUsernameAvailability,
  };
}; 