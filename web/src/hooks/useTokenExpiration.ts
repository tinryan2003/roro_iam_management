"use client";

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { logoutUser } from '@/lib/auth/utils';
import { AUTH_CONFIG } from '@/lib/auth/config';
import type { Session } from 'next-auth';

export const useTokenExpiration = () => {
  const { data: session, status, update } = useSession();
  const logoutInProgress = useRef(false);

  // Function to handle token expiration - redirect to home page
  const handleTokenExpiration = useCallback(async () => {
    if (logoutInProgress.current) {
      console.log('Logout already in progress, skipping...');
      return;
    }

    logoutInProgress.current = true;
    console.log('Token has expired, performing logout...');
    
    try {
      await logoutUser('/home');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/home';
      }
    } finally {
      logoutInProgress.current = false;
    }
  }, []);

  //check if token is expired
  const isTokenExpired = useCallback((session: Session): boolean => {
    if (!session) return true;
    
    if (session.error === 'TokenExpired') {
      return true;
    }

    if (session.expires) {
      try {
        const expirationTime = new Date(session.expires).getTime();
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;
        
        // Consider expired if less than 2 minutes remaining
        return timeUntilExpiration <= 2 * 60 * 1000;
      } catch (error) {
        console.error('Error parsing expiration time:', error);
        return true;
      }
    }

    // If no expiration time, check if we have a valid access token
    if (!session.accessToken) {
      return true;
    }

    return false;
  }, []);

  // Function to check if token will expire soon (within 5 minutes)
  const isTokenExpiringSoon = useCallback((session: Session): boolean => {
    if (!session?.expires) return false;
    
    try {
      const expirationTime = new Date(session.expires).getTime();
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;
      
      // Consider expiring soon if less than 5 minutes remaining
      return timeUntilExpiration <= 5 * 60 * 1000 && timeUntilExpiration > 0;
    } catch (error) {
      console.error('Error checking if token expires soon:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    // Only proceed if we have a session
    if (status !== 'authenticated' || !session) {
      return;
    }

    // Check if token is expired
    if (isTokenExpired(session)) {
      console.log('Token expired detected, initiating logout...');
      handleTokenExpiration();
      return;
    }

    // Check if token will expire soon and show warning
    if (isTokenExpiringSoon(session)) {
      console.warn('Token will expire soon, consider refreshing...');
      
      // Dispatch custom event for components that want to show expiration warnings
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tokenExpirationWarning', {
          detail: { 
            expiresAt: session.expires,
            timeUntilExpiration: new Date(session.expires).getTime() - Date.now()
          }
        }));
      }
    }

    // Set up periodic checks
    const checkInterval = setInterval(() => {
      if (isTokenExpired(session)) {
        console.log('Periodic check: Token expired, logging out...');
        handleTokenExpiration();
      } else if (isTokenExpiringSoon(session)) {
        console.warn('Periodic check: Token expiring soon...');
      }
    }, AUTH_CONFIG.TOKEN_CHECK_INTERVAL); // Use configured interval

    return () => clearInterval(checkInterval);
  }, [session, status, isTokenExpired, isTokenExpiringSoon, handleTokenExpiration]);

  // Function that can be called by other hooks to handle auth errors
  const handleAuthError = useCallback(async (errorStatus: number) => {
    if (errorStatus === 401 || errorStatus === 403) {
      console.log(`Authentication error (${errorStatus}) - token likely expired`);
      
      // Try to refresh the session first
      try {
        await update();
      } catch (error) {
        console.error('Error during session refresh:', error);
        console.log('Session refresh failed, proceeding with logout');
      }
      
      // Check if the session is still valid after refresh
      if (session && isTokenExpired(session)) {
        await handleTokenExpiration();
        return true; // Indicates that auth error was handled
      }
    }
    return false; // Not an auth error or session is still valid
  }, [session, isTokenExpired, handleTokenExpiration, update]);

  // Function to force logout (useful for manual logout)
  const forceLogout = useCallback(async () => {
    console.log('Force logout requested');
    await handleTokenExpiration();
  }, [handleTokenExpiration]);

  // Function specifically for "no matching key found" scenarios
  const handleNoMatchingKey = useCallback(async () => {
    console.log('No matching key found - logging out and redirecting to home');
    await handleTokenExpiration();
  }, [handleTokenExpiration]);

  return {
    isExpired: session ? isTokenExpired(session) : false,
    isExpiringSoon: session ? isTokenExpiringSoon(session) : false,
    session,
    status,
    handleAuthError,
    forceLogout,
    handleNoMatchingKey,
    logoutUser
  };
};
