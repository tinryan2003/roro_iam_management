import { useState } from "react";
import { logoutUser } from "@/lib/auth/utils";

/**
 * Simplified logout hook - chỉ cần gọi logout(redirectTo)
 */
export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async (redirectTo?: string) => {
    if (isLoggingOut) return; // Prevent double clicks
    
    setIsLoggingOut(true);
    
    try {
      await logoutUser(redirectTo);
    } catch (error) {
      console.error("Logout failed:", error);
      // Emergency fallback
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo || '/home';
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  return { logout, isLoggingOut };
};

