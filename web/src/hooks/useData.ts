"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTokenExpiration } from './useTokenExpiration';
import { handleNoMatchingKey } from '@/lib/auth/utils';

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

export function useData<T>(url: string) {
  const { data: session } = useSession();
  const { handleAuthError } = useTokenExpiration();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        // Handle authentication errors (token expired)
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed in useData - token may be expired');
          const wasHandled = await handleAuthError(response.status);
          if (wasHandled) {
            return; // Auth error was handled, don't continue processing
          }
        }

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Failed to fetch data');
          
          // Check if this is a "no matching key" error and handle it specially
          if (isNoMatchingKeyError(errorText)) {
            console.log('No matching key detected in useData, triggering logout to home');
            await handleNoMatchingKey(`Data fetch error: ${errorText}`);
            return; // Don't continue processing after logout
          }
          
          throw new Error(errorText);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error occurred';
        
        // Check if this is a "no matching key" error and handle it specially
        if (isNoMatchingKeyError(errorMessage)) {
          console.log('No matching key detected in useData error, triggering logout to home');
          await handleNoMatchingKey(`Data fetch error: ${errorMessage}`);
          return; // Don't continue processing after logout
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, session?.accessToken, handleAuthError]);

  return { data, loading, error };
}

// Simple usage examples:
// const { data: routes } = useData<Route[]>('/api/routes');
// const { data: vehicles } = useData<Vehicle[]>('/api/vehicles'); 