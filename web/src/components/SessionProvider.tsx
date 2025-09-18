"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useTokenExpiration } from "@/hooks/useTokenExpiration";
import { logoutUser } from "@/lib/auth/utils";

interface AuthSessionProviderProps {
  children: React.ReactNode;
  session: Session | null;
}

// Component to handle logout detection and session cleanup
function LogoutHandler() {
  const { data: session, status, update } = useSession();
  const { isExpired, isExpiringSoon, handleAuthError } = useTokenExpiration();
  const logoutAttempted = useRef(false);

  // Debug logging
  useEffect(() => {
    console.log('SessionProvider - Session state:', {
      status,
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasIdToken: !!session?.id_token,
      sessionKeys: session ? Object.keys(session) : [],
      userRole: session?.user?.role,
      expires: session?.expires,
      isExpired,
      isExpiringSoon
    });
  }, [session, status, isExpired, isExpiringSoon]);

  // Handle session refresh
  useEffect(() => {
    const refreshSession = async () => {
      if (status === 'authenticated' && session) {
        try {
          await update();
          console.log('Session refreshed successfully');
        } catch (error) {
          console.error('Failed to refresh session:', error);
        }
      }
    };

    // Refresh session every 2 minutes to keep it alive (since timeout is 30 minutes)
    const interval = setInterval(refreshSession, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [status, session, update]);

  // Handle token expiration
  useEffect(() => {
    if (logoutAttempted.current) {
      return; // Prevent multiple logout attempts
    }

    if (isExpired && status === 'authenticated') {
      console.log("Token expired detected in SessionProvider, performing logout...");
      logoutAttempted.current = true;
      
      logoutUser('/employee-sign-in').catch((error) => {
        console.error('Error during logout:', error);
        // Force redirect as fallback
        if (typeof window !== 'undefined') {
          window.location.href = '/employee-sign-in';
        }
      });
    }
  }, [session, status, isExpired]);

  // Handle token expiration warnings
  useEffect(() => {
    if (isExpiringSoon && status === 'authenticated') {
      console.warn('Token will expire soon, showing warning...');
      
      // You can show a notification to the user here
      if (typeof window !== 'undefined') {
        // Dispatch event for components that want to show warnings
        window.dispatchEvent(new CustomEvent('tokenExpirationWarning', {
          detail: { 
            expiresAt: session?.expires,
            timeUntilExpiration: session?.expires ? 
              new Date(session.expires).getTime() - Date.now() : 0
          }
        }));
      }
    }
  }, [isExpiringSoon, status, session]);

  // Global error handler for authentication errors
  useEffect(() => {
    const handleGlobalAuthError = (evt: Event) => {
      const status = (evt as CustomEvent<{ status?: number }>).detail?.status ?? 401;
      void handleAuthError(status);
    };

    // Listen for global auth errors
    window.addEventListener('authError', handleGlobalAuthError);
    
    return () => {
      window.removeEventListener('authError', handleGlobalAuthError);
    };
  }, [handleAuthError]);

  return null;
}

export default function SessionProvider({ children, session }: AuthSessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={2 * 60} // Refresh every 2 minutes (since timeout is 30 minutes)
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      <LogoutHandler />
      {children}
    </NextAuthSessionProvider>
  );
} 