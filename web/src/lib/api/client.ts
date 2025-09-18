import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { getSession, signOut } from 'next-auth/react';

// Extend the InternalAxiosRequestConfig interface to include _retry
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Create axios instance with default configuration
export const apiClient = axios.create({
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.set('Authorization', `Bearer ${session.accessToken}`);
      }
    } catch (error) {
      console.error('Error getting session for API request:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 Unauthorized errors (token expired/invalid)
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - Token likely expired');
      
      try {
        // Try to get fresh session
        const session = await getSession();
        
        if (!session || session.error === 'TokenExpired') {
          console.log('Session expired, forcing logout');
          
          // Clear any stored tokens
          if (typeof window !== 'undefined') {
            localStorage.clear();
            sessionStorage.clear();
          }
          
          // Force logout and redirect
          await signOut({ 
            redirect: true,
            callbackUrl: session?.user?.role?.includes("CUSTOMER") ? "/customer-sign-in" : "/employee-sign-in"
          });
          
          return Promise.reject(new Error('Session expired'));
        }
        
        // If we have a valid session, retry the original request with new token
        if (session?.accessToken && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest.headers.set('Authorization', `Bearer ${session.accessToken}`);
          
          return apiClient(originalRequest);
        }
      } catch (sessionError) {
        console.error('Error handling 401 response:', sessionError);
        
        // Fallback: force logout
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = '/employee-sign-in';
        }
      }
    }
    
    // Handle 403 Forbidden errors (insufficient permissions)
    if (error.response?.status === 403) {
      console.log('403 Forbidden - Insufficient permissions');
      
      // Optionally dispatch an event that components can listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('authorizationError', {
          detail: { 
            status: 403, 
            message: 'Insufficient permissions',
            url: originalRequest?.url 
          }
        }));
      }
    }

    return Promise.reject(error);
  }
);

// Utility function to manually refresh session and retry failed requests
export const refreshSessionAndRetry = async (originalRequest: ExtendedAxiosRequestConfig) => {
  try {
    // Force session refresh
    const session = await getSession();
    
    if (session?.accessToken) {
      // Update request with new token
      originalRequest.headers.set('Authorization', `Bearer ${session.accessToken}`);
      
      // Retry the request
      return await apiClient(originalRequest);
    } else {
      throw new Error('No valid session after refresh');
    }
  } catch (error) {
    console.error('Failed to refresh session and retry request:', error);
    throw error;
  }
};

// Utility function to check if an error is a token expiration error
export const isTokenExpirationError = (error: AxiosError): boolean => {
  return error.response?.status === 401 || error.response?.status === 403;
};

// Utility function to make authenticated API calls with automatic retry
export const authenticatedRequest = async <T = unknown>(
  config: ExtendedAxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    return await apiClient(config);
  } catch (error) {
    const axiosError = error as AxiosError;
    
    if (isTokenExpirationError(axiosError) && config && !config._retry) {
      console.log('Request failed due to token expiration, attempting refresh and retry...');
      return await refreshSessionAndRetry(config);
    }
    
    throw error;
  }
};

// Export the configured axios instance as default
export default apiClient;
