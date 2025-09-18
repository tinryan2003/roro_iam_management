"use client";

import React, { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/auth/utils';

interface RealmProtectedProps {
  children: React.ReactNode;
  realm: 'customer' | 'employee' | 'both';
  fallbackUrl?: string;
  showFallback?: boolean;
}

/**
 * Component that protects routes based on realm authentication
 * 
 * @param children Content to render if user is authenticated with the right realm
 * @param realm Required realm ('customer', 'employee', or 'both')
 * @param fallbackUrl URL to redirect to if user doesn't have the right realm
 * @param showFallback Whether to show a fallback UI instead of redirecting
 */
const RealmProtected: React.FC<RealmProtectedProps> = ({ 
  children, 
  realm, 
  fallbackUrl = "/home",
  showFallback = false 
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Extract provider from session
  const sessionProvider = (session as Session & { provider?: string })?.provider;
  
  // Function to check if the user has the correct realm access
  const hasCorrectRealm = useCallback((): boolean => {
    if (!session) return false;
    
    // Check realm specific access
    switch (realm) {
      case 'customer':
        return sessionProvider === 'customer-keycloak';
      case 'employee':
        return sessionProvider === 'employee-keycloak';
      case 'both':
        return !!sessionProvider && ['customer-keycloak', 'employee-keycloak'].includes(sessionProvider);
      default:
        return false;
    }
  }, [session, sessionProvider, realm]);

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    const hasRealm = hasCorrectRealm();
    const appropriateSignInPage = realm === 'customer' 
      ? '/customer-sign-in' 
      : '/employee-sign-in';
    
    if (status === "unauthenticated") {
      router.push(appropriateSignInPage);
    } else if (status === "authenticated" && !hasRealm && !showFallback) {
      router.push(fallbackUrl);
    }
  }, [status, router, fallbackUrl, showFallback, realm, hasCorrectRealm]);

  // Show loading state while session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting for unauthenticated users
  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  // Check if user has the correct realm
  if (!hasCorrectRealm()) {
    if (!showFallback) {
      // Show loading while redirecting
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }

    // Show fallback UI
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/10" aria-hidden="true"></div>
        <div className="relative max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Incorrect Authentication Realm</h1>
            <p className="text-gray-600 mb-6">
              You are authenticated with the wrong authentication realm. This page requires:
            </p>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <span className="font-medium text-blue-800">
                {realm === 'customer' ? 'Customer Realm' : 
                 realm === 'employee' ? 'Employee Realm' : 
                 'Valid Authentication'}
              </span>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Your current authentication</h3>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                {sessionProvider === 'customer-keycloak' ? 'Customer Realm' : 
                 sessionProvider === 'employee-keycloak' ? 'Employee Realm' : 
                 'Unknown Authentication'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {realm === 'customer' && sessionProvider === 'employee-keycloak' && (
              <button
                onClick={async () => {
                  await logoutUser('/customer-sign-in');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to Customer Portal
              </button>
            )}
            
            {realm === 'employee' && sessionProvider === 'customer-keycloak' && (
              <button
                onClick={async () => {
                  await logoutUser('/employee-sign-in');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Switch to Employee Portal
              </button>
            )}
            
            <button
              onClick={() => router.push(fallbackUrl)}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go to safe page
            </button>
            
            <button
              onClick={async () => {
                await logoutUser();
              }}
              className="w-full px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // User has the right realm, render the protected content
  return <>{children}</>;
};

export default RealmProtected;
