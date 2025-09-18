import { JWT } from "next-auth/jwt";
import axios, { AxiosError } from "axios";
import { jwtDecode } from "jwt-decode";
import { KeycloakToken } from "./types";
import { keycloakProvider } from "./providers";
import { AUTH_CONFIG } from "./config";

/**
 * Performs final logout handshake with Keycloak (fallback method)
 */
export async function doFinalSignoutHandshake(jwt: JWT): Promise<void> {
  const { provider, id_token } = jwt;

  if (provider && id_token) {
    try {
      // Determine which client ID to use based on the provider
      let clientId = process.env.KEYCLOAK_ID; // Default fallback
      
      if (provider === 'customer-keycloak') {
        clientId = process.env.CUSTOMER_KEYCLOAK_ID;
      } else if (provider === 'employee-keycloak') {
        clientId = process.env.EMPLOYEE_KEYCLOAK_ID || process.env.KEYCLOAK_ID;
      }
      
      if (!clientId) {
        console.error('Keycloak client ID not configured for provider:', provider);
        return;
      }

      // Get the issuer from the provider configuration
      // Select issuer per provider
      let issuer = process.env.EMPLOYEE_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER;
      if (provider === 'customer-keycloak') {
        issuer = process.env.CUSTOMER_KEYCLOAK_ISSUER || issuer;
      }
      if (!issuer) {
        console.error('Keycloak issuer not configured');
        return;
      }

      // Add the id_token_hint to the query string
      const params = new URLSearchParams();
      params.append('id_token_hint', id_token);
      params.append('client_id', clientId);
      
      const logoutUrl = `${issuer}/protocol/openid-connect/logout?${params.toString()}`;
      
      console.log("Performing post-logout handshake for provider:", provider);
      console.log("Client ID:", clientId);
      
      const { status, statusText } = await axios.get(logoutUrl);

      console.log("Completed post-logout handshake", status, statusText);
    } catch (e: unknown) {
      console.error("Unable to perform post-logout handshake for provider:", provider, (e as AxiosError)?.code || e);
    }
  } else {
    console.log("No provider or id_token available for logout handshake");
  }
}

/**
 * Constructs a proper Keycloak logout URL with redirect
 */
export function buildKeycloakLogoutUrl(idToken: string, postLogoutRedirectUri: string, provider?: string): string {
  // Choose issuer by provider
  let keycloakIssuer = process.env.EMPLOYEE_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER || keycloakProvider.options?.issuer;
  if (provider === 'customer-keycloak') {
    keycloakIssuer = process.env.CUSTOMER_KEYCLOAK_ISSUER || keycloakIssuer;
  }
  
  // Determine which client ID to use based on the provider
  let clientId = process.env.KEYCLOAK_ID; // Default fallback
  
  if (provider === 'customer-keycloak') {
    clientId = process.env.CUSTOMER_KEYCLOAK_ID;
  } else if (provider === 'employee-keycloak') {
    clientId = process.env.EMPLOYEE_KEYCLOAK_ID || process.env.KEYCLOAK_ID;
  }
  
  if (!keycloakIssuer) {
    throw new Error("Keycloak issuer not configured");
  }

  if (!clientId) {
    throw new Error("Keycloak client ID not configured");
  }

  // Validate ID token
  if (!idToken || idToken.trim() === '') {
    throw new Error("Invalid ID token provided for logout");
  }

  // Clean the redirect URI - don't add extra parameters yet as they might interfere
  const cleanRedirectUri = postLogoutRedirectUri.split('?')[0];

  const params = new URLSearchParams();
  params.append('id_token_hint', idToken);
  params.append('post_logout_redirect_uri', cleanRedirectUri);
  // Add client_id to ensure proper logout
  params.append('client_id', clientId);
  
  const logoutUrl = `${keycloakIssuer}/protocol/openid-connect/logout?${params.toString()}`;
  
  console.log("Built Keycloak logout URL:", logoutUrl);
  console.log("ID Token (first 50 chars):", idToken?.substring(0, 50) + "...");
  console.log("Will redirect back to:", cleanRedirectUri);
  console.log("Client ID:", clientId);
  console.log("Provider:", provider || "unknown");
  
  return logoutUrl;
}

/**
 * Performs complete Keycloak logout by redirecting to Keycloak logout endpoint
 */
export function performKeycloakLogout(idToken: string, redirectUri?: string, provider?: string): void {
  try {
    console.log('Starting Keycloak logout process...');
    console.log('ID Token length:', idToken?.length || 0);
    console.log('Provider:', provider || 'unknown');
    
    const postLogoutRedirectUri = redirectUri || `${window.location.origin}/home`;
    const logoutUrl = buildKeycloakLogoutUrl(idToken, postLogoutRedirectUri, provider);
    
    console.log("Redirecting to Keycloak logout:", logoutUrl);
    
    // Redirect to Keycloak logout endpoint
    // This will end the Keycloak session and redirect back to our app
    window.location.href = logoutUrl;
  } catch (error) {
    console.error("Error during Keycloak logout:", error);
    // Fallback: redirect to local logout
    console.log("Using fallback logout redirect");
    window.location.href = redirectUri || '/home';
  }
}

/**
 * Extracts and processes roles from Keycloak access token
 */
export function extractRolesFromToken(accessToken: string): string[] {
  try {
    const decoded: KeycloakToken = jwtDecode(accessToken);
    // Convert roles to uppercase for consistency
    return decoded?.realm_access?.roles?.map(role => role.toUpperCase()) ?? [];
  } catch (error) {
    console.error("Error decoding token:", error);
    return [];
  }
}

/**
 * The system automatically:
 * - Calls backend to blacklist tokens
 * - Logs out from Keycloak
 * - Clears all frontend storage
 * - Redirects to appropriate page
 */

/**
 * Main logout function - simplified and comprehensive
 * This is the ONLY logout function you need to use
 */
export async function logoutUser(redirectTo?: string): Promise<void> {
  try {
    console.log('🚪 Starting logout...');
    
    // Get current session
    const { getSession } = await import('next-auth/react');
    const session = await getSession();
    
    // Determine redirect destination
    const sessionWithProvider = session as typeof session & { provider?: string };
    const finalRedirect = redirectTo || (
      sessionWithProvider?.provider === 'customer-keycloak' ? '/customer-sign-in' : '/employee-sign-in'
    );
    
    // Step 1: Backend logout (blacklist tokens)
    if (session?.accessToken) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Backend tokens blacklisted');
      } catch (error) {
        console.warn('⚠️ Backend logout failed:', error);
      }
    }
    
    // Step 2: Clear all frontend storage
    await clearStorage();
    
    // Step 3: Keycloak logout or NextAuth logout
    if (session?.id_token && typeof window !== 'undefined') {
      console.log('🔐 Redirecting to Keycloak logout...');
      const logoutUrl = buildKeycloakLogoutUrl(
        session.id_token, 
        `${window.location.origin}${finalRedirect}`,
        sessionWithProvider?.provider
      );
      window.location.href = logoutUrl;
    } else {
      console.log('📝 Using NextAuth logout...');
      const { signOut } = await import('next-auth/react');
      await signOut({ callbackUrl: finalRedirect, redirect: true });
    }
    
  } catch (error) {
    console.error('❌ Logout failed:', error);
    // Emergency fallback
    await emergencyLogout(redirectTo);
  }
}

/**
 * Clears all browser storage - simplified
 */
export async function clearStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname};`;
      }
    });
    
    // Clear caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    console.log('🧹 Storage cleared');
  } catch (error) {
    console.warn('⚠️ Storage cleanup failed:', error);
  }
}

/**
 * Emergency logout fallback
 */
export async function emergencyLogout(redirectTo?: string): Promise<void> {
  try {
    await clearStorage();
    const { signOut } = await import('next-auth/react');
    await signOut({ redirect: false });
  } catch {
    // Final fallback
  }
  
  if (typeof window !== 'undefined') {
    window.location.href = redirectTo || '/home';
  }
}

/**
 * Extends the current session by refreshing the token
 */
export async function extendSession(): Promise<boolean> {
  try {
    console.log('Attempting to extend session...');
    
    // Import signIn dynamically to avoid circular dependencies
    const { signIn } = await import('next-auth/react');

    // Try employee provider first, then customer
    const attempt = async (provider: string) => signIn(provider, { redirect: false, callbackUrl: window.location.href });

    let result = await attempt('employee-keycloak');
    if (!result?.ok) {
      result = await attempt('customer-keycloak');
    }

    if (result?.ok) {
      console.log('Session extended successfully');
      return true;
    }
    console.error('Failed to extend session:', result?.error);
    return false;
  } catch (error) {
    console.error('Error extending session:', error);
    return false;
  }
}

/**
 * Checks if the current token appears to be expired based on timestamp
 */
export function isTokenExpiredByTime(expirationTime?: string | number): boolean {
  if (!expirationTime) return false;
  
  const expTime = typeof expirationTime === 'string' 
    ? new Date(expirationTime).getTime() 
    : expirationTime;
    
  return Date.now() >= expTime;
}

/**
 * Handles "no matching key found" scenarios by performing logout
 */
export async function handleNoMatchingKey(reason?: string): Promise<void> {
  const logReason = reason || 'No matching authentication key found';
  console.log(`Authentication failed: ${logReason} - redirecting to home page`);
  
  await logoutUser('/home');
}

/**
 * Calculates token expiration timestamps
 */
export function calculateTokenExpiration(expiresIn: number, refreshExpiresIn: number) {
  const now = Math.floor(Date.now() / 1000);
  
  return {
    accessTokenExpires: now + (expiresIn || AUTH_CONFIG.DEFAULT_ACCESS_TOKEN_EXPIRY),
    refreshTokenExpires: now + (refreshExpiresIn || AUTH_CONFIG.DEFAULT_REFRESH_TOKEN_EXPIRY),
  };
}

/**
 * Refreshes the Keycloak access token using the refresh token
 */
export async function refreshKeycloakAccessToken(token: JWT): Promise<JWT> {
  try {
    // Determine issuer per provider
    let issuer = process.env.EMPLOYEE_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER;
    if ((token as unknown as { provider?: string })?.provider === 'customer-keycloak') {
      issuer = process.env.CUSTOMER_KEYCLOAK_ISSUER || issuer;
    }
    if (!issuer) throw new Error("Keycloak issuer is not configured");

    // Determine client credentials based on provider (employee/customer)
    const provider = (token as unknown as { provider?: string })?.provider;
    let clientId = process.env.KEYCLOAK_ID;
    let clientSecret = process.env.KEYCLOAK_SECRET;

    if (provider === 'customer-keycloak') {
      clientId = process.env.CUSTOMER_KEYCLOAK_ID || clientId;
      clientSecret = process.env.CUSTOMER_KEYCLOAK_SECRET || clientSecret;
    } else if (provider === 'employee-keycloak') {
      clientId = process.env.EMPLOYEE_KEYCLOAK_ID || clientId;
      clientSecret = process.env.EMPLOYEE_KEYCLOAK_SECRET || clientSecret;
    }

    if (!clientId) throw new Error("Keycloak clientId is not configured");
    if (!token?.refresh_token) throw new Error("No refresh token available");

    const url = `${issuer}/protocol/openid-connect/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', String((token as unknown as { refresh_token?: string }).refresh_token));
    params.append('client_id', clientId);
    if (clientSecret) params.append('client_secret', clientSecret);

    const { data } = await axios.post(url, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    // Update token fields
    (token as unknown as { access_token?: string }).access_token = data.access_token;
    (token as unknown as { refresh_token?: string }).refresh_token = data.refresh_token || (token as unknown as { refresh_token?: string }).refresh_token;
    (token as unknown as { id_token?: string }).id_token = data.id_token || (token as unknown as { id_token?: string }).id_token;
    (token as unknown as { expires_in?: number }).expires_in = Number(data.expires_in) || 0;
    (token as unknown as { refresh_expires_in?: number }).refresh_expires_in = Number(data.refresh_expires_in) || 0;

    const { accessTokenExpires, refreshTokenExpires } = calculateTokenExpiration(
      Number(data.expires_in) || 0,
      Number(data.refresh_expires_in) || 0
    );
    (token as unknown as { accessTokenExpires?: number }).accessTokenExpires = accessTokenExpires;
    (token as unknown as { refreshTokenExpires?: number }).refreshTokenExpires = refreshTokenExpires;

    // Clear error marker if any
    (token as unknown as { error?: string }).error = undefined as unknown as string;

    return token;
  } catch (error) {
    console.error('Failed to refresh Keycloak access token:', error);
    (token as unknown as { error?: string }).error = 'TokenExpired';
    return token;
  }
}

/**
 * Formats user data from authentication provider
 */
export function formatUserData(user: { id?: string | null; name?: string | null; email?: string | null }) {
  return {
    sub: user.id || "",
    email_verified: true,
    name: user.name || "",
    telephone: "",
    preferred_username: user.name || "",
    org_name: "",
    given_name: user.name?.split(" ")[0] || "",
    family_name: user.name?.split(" ")[1] || "",
    email: user.email || "",
    id: user.id || "",
  };
}

/**
 * Checks if user has required roles
 */
export function hasRequiredRole(userRoles: string[], requiredRoles: string[]): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return requiredRoles.some(role => userRoles.includes(role));
}