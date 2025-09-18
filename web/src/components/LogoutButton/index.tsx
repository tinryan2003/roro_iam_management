"use client";

import React from 'react';
import { LogOut, Loader2 } from 'lucide-react';
import { useLogout } from '@/hooks/useLogout';
import { useSession } from 'next-auth/react';

interface LogoutButtonProps {
  redirectTo?: string;
  className?: string;
  children?: React.ReactNode;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  redirectTo = '/',
  className = '',
}) => {
  const { logout, isLoggingOut } = useLogout();
  const { update } = useSession();

  const handleLogout = async () => {
    try {
      await logout(redirectTo);
      // Force session refresh to update UI immediately
      await update();
    } catch (error) {
      console.error('Logout error:', error);
      // Force page refresh as fallback
      window.location.href = redirectTo;
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors ${className}`}
    >
      {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      <span>Log out</span>
    </button>
  );
};

export default LogoutButton; 