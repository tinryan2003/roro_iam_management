"use client";

import React, { useEffect } from 'react';
import type { Session } from 'next-auth';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { logoutUser } from '@/lib/auth/utils';

interface RoleProtectedProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackUrl?: string;
  showFallback?: boolean;
}

const RoleProtected: React.FC<RoleProtectedProps> = ({ 
  children, 
  allowedRoles, 
  fallbackUrl = "/home",
  showFallback = true 
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Extract user roles from session (normalize to uppercase for robust checks)
  const userRoles = (session?.user?.role || []).map((r: string) => r.toUpperCase());

  // Helper function to check if user has any of the required roles
  const hasRequiredRole = (): boolean => {
    if (!userRoles || userRoles.length === 0) return false;
    const required = allowedRoles.map(r => r.toUpperCase());
    return required.some(requiredRole => 
      userRoles.some(userRole => userRole.includes(requiredRole))
    );
  };

  // Handle navigation in useEffect to avoid setState during render
  useEffect(() => {
    // Check if user has any of the required roles
    const required = allowedRoles.map(r => r.toUpperCase());
    const hasRole = userRoles.length > 0 && required.some(requiredRole => 
      userRoles.some(userRole => userRole.includes(requiredRole))
    );
    
    if (status === "unauthenticated") {
      // Determine which sign-in page to redirect to based on the allowed roles
      // If the roles contain customer-specific roles, redirect to customer sign-in
      const isCustomerRolePage = allowedRoles.some(role => 
        role.toLowerCase().includes('customer'));
      
      router.push(isCustomerRolePage ? "/customer-sign-in" : "/employee-sign-in");
    } else if (status === "authenticated" && !hasRole && !showFallback) {
      router.push(fallbackUrl);
    }
  }, [status, userRoles, allowedRoles, router, fallbackUrl, showFallback]);

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
          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Redirecting to sign-in...</p>
        </div>
      </div>
    );
  }

  // Check if user has required role
  if (!hasRequiredRole()) {
    if (!showFallback) {
      // Show loading while redirecting
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Redirecting...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-50 bg-gray-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/10" aria-hidden="true"></div>
        <div className="relative max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-100 rounded-full">
              <Shield className="h-12 w-12 text-red-600" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not Authorized</h1>
          <p className="text-gray-600 mb-6">
            You do not have sufficient permissions to access this page. This area is restricted to users with the following roles:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Required Roles</h3>
            <div className="flex flex-wrap gap-2">
              {allowedRoles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your Current Roles</h3>
            {userRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full"
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Do not have any roles assigned.</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push(fallbackUrl)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </button>
            <button
              onClick={() => router.back()}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại
            </button>
            <button
              onClick={async () => {
                // Determine appropriate sign-in page for logout redirect
                const sessionProvider = (session as Session & { provider?: string })?.provider;
                const redirectPage = sessionProvider === 'customer-keycloak' 
                  ? '/customer-sign-in' 
                  : '/employee-sign-in';
                
                await logoutUser(redirectPage);
              }}
              className="w-full px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
            >
              Đăng xuất
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-left">
            <p className="text-sm text-gray-500">
              If you need access, please contact your administrator to obtain the appropriate permissions.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // User has required role, render the protected content
  return <>{children}</>;
};

export default RoleProtected; 