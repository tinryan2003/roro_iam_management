"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { extendSession } from '@/lib/auth/utils';
import { useTokenExpiration } from '@/hooks/useTokenExpiration';

interface TokenExpirationWarningProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export default function TokenExpirationWarning({ onExtend, onLogout }: TokenExpirationWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExtending, setIsExtending] = useState(false);
  const { forceLogout } = useTokenExpiration();

  useEffect(() => {
    const handleTokenExpirationWarning = (event: CustomEvent) => {
      const { timeUntilExpiration } = event.detail;
      setTimeRemaining(timeUntilExpiration);
      setShowWarning(true);
    };

    // Listen for token expiration warnings
    window.addEventListener('tokenExpirationWarning', handleTokenExpirationWarning as EventListener);
    
    return () => {
      window.removeEventListener('tokenExpirationWarning', handleTokenExpirationWarning as EventListener);
    };
  }, []);

  useEffect(() => {
    if (showWarning && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1000; // Decrease by 1 second
          if (newTime <= 0) {
            setShowWarning(false);
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showWarning, timeRemaining]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      const success = await extendSession();
      if (success) {
        setShowWarning(false);
        if (onExtend) {
          onExtend();
        }
      } else {
        // If extension failed, force logout
        await handleLogout();
      }
    } catch (error) {
      console.error('Error extending session:', error);
      await handleLogout();
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = async () => {
    if (onLogout) {
      onLogout();
    } else {
      await forceLogout();
    }
    setShowWarning(false);
  };

  const handleDismiss = () => {
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-yellow-800">
              Session Expiring Soon
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Your session will expire in <span className="font-semibold">{formatTime(timeRemaining)}</span>.
                Please save your work and refresh your session.
              </p>
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={handleExtend}
                disabled={isExtending}
                className="bg-yellow-600 text-white px-3 py-1.5 text-xs font-medium rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExtending ? 'Extending...' : 'Extend Session'}
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-3 py-1.5 text-xs font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Logout Now
              </button>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleDismiss}
              title="Dismiss warning"
              className="text-yellow-400 hover:text-yellow-500 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 