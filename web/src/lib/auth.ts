import type { AuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

// Import auth modules
import { authProviders } from "./auth/providers";
import { AUTH_CONFIG, validateEnvVars } from "./auth/config";
import { 
  doFinalSignoutHandshake, 
  extractRolesFromToken, 
  calculateTokenExpiration,
  refreshKeycloakAccessToken
} from "./auth/utils";
import type { KeycloakToken } from "./auth/types";
// Import types to ensure TypeScript declarations are loaded
import "./auth/types";

// Validate environment variables on startup (server-side only)
if (typeof window === 'undefined') {
  validateEnvVars();
}

export const authOptions: AuthOptions = {
    providers: authProviders,
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
        async jwt({ token, account, user }) {
            if (account) {
                token.access_token = account.access_token || "";
                token.refresh_token = account.refresh_token || "";
                token.id_token = account.id_token || "";
                token.expires_in = Number(account.expires_in) || 0;
                token.refresh_expires_in = Number(account.refresh_expires_in) || 0;
                
                // Store provider information
                token.provider = account.provider || "unknown";
                
                // Set token expiration timestamps
                const { accessTokenExpires, refreshTokenExpires } = calculateTokenExpiration(
                    token.expires_in, 
                    token.refresh_expires_in
                );
                token.accessTokenExpires = accessTokenExpires;
                token.refreshTokenExpires = refreshTokenExpires;
                
                // Format user data - store minimal user info
                if (user) {
                    token.user = {
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

                // Extract roles from the access_token
                if (account.access_token) {
                    token.role = extractRolesFromToken(account.access_token);

                    // Also capture detailed roles including ALL client roles (from resource_access)
                    try {
                        const decoded = jwtDecode<KeycloakToken>(account.access_token);
                        const realmRoles: string[] = decoded?.realm_access?.roles ?? [];
                        const resourceAccess: Record<string, { roles?: string[] }> = decoded?.resource_access ?? {};
                        const clientRoles: string[] = Object.values(resourceAccess)
                          .flatMap((r) => Array.isArray(r?.roles) ? r.roles as string[] : []);

                        // Store separately for consumers that need detail
                        (token as unknown as { realmRoles?: string[]; apiClientRoles?: string[] }).realmRoles = realmRoles;
                        (token as unknown as { realmRoles?: string[]; apiClientRoles?: string[] }).apiClientRoles = clientRoles; // kept for backward compat naming

                        // Merge ALL client roles into legacy token.role, uppercase and unique
                        const toUpper = (r: string) => r?.toUpperCase?.() ?? r;
                        const merged = Array.from(new Set([...(token.role || []), ...clientRoles.map(toUpper)]));
                        token.role = merged;
                    } catch {
                        // ignore decode errors
                    }
                }
            }
            
            // Refresh if expired or expiring very soon
            const nowMs = Date.now();
            const accessExpMs = token.accessTokenExpires ? token.accessTokenExpires * 1000 : 0;
            const isExpired = accessExpMs > 0 && nowMs >= accessExpMs;
            const expiringSoon = accessExpMs > 0 && accessExpMs - nowMs < 5 * 60_000; // < 5 min

            if (isExpired || expiringSoon) {
                try {
                    token = await refreshKeycloakAccessToken(token as unknown as JWT);
                } catch {
                    // Fallback: mark expired so UI can handle logout gracefully
                    token.error = "TokenExpired";
                }
            }
            
            return token;
        },
        async session({ session, token }) {
            // Check if token is expired
            if (token.error === "TokenExpired") {
                // Don't return null, instead return session with error
                return {
                    ...session,
                    error: "TokenExpired"
                };
            }
            
            // Pass minimal session data to reduce cookie size
            if (session.user) {
                session.user.role = token.role || [];
                session.user.id = token.user?.id || "";
            }
            
            // Store access token in session for API calls
            session.accessToken = token.access_token;
            session.id_token = token.id_token; // Keep id_token for logout
            
            // Store provider information for logout
            const sessionWithProvider = session as typeof session & { provider?: string };
            sessionWithProvider.provider = (token.provider as string) || "unknown";
            
            // Store expiration time
            session.expires = token.accessTokenExpires ? new Date(token.accessTokenExpires * 1000).toISOString() : "";

            // Expose detailed roles to session
            (session as unknown as { realmRoles?: string[]; apiClientRoles?: string[] }).realmRoles = (token as unknown as { realmRoles?: string[] }).realmRoles ?? [];
            (session as unknown as { realmRoles?: string[]; apiClientRoles?: string[] }).apiClientRoles = (token as unknown as { apiClientRoles?: string[] }).apiClientRoles ?? [];
            
            return session;
        }
    },
    events: {
        signOut: ({ token }) => {
            console.log("NextAuth signOut event triggered");
            doFinalSignoutHandshake(token as JWT);
        }
    },
    pages: {
        signIn: AUTH_CONFIG.EMPLOYEE_SIGN_IN_PAGE
    },
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours
    },
    jwt: {
        maxAge: 24 * 60 * 60, // 24 hours
    },
}
