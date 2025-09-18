// Main auth module exports

// Export the main auth configuration
export { authOptions } from "../auth";

// Export auth utilities
export {
  doFinalSignoutHandshake,
  buildKeycloakLogoutUrl,
  performKeycloakLogout,
  logoutUser,
  clearStorage,
  emergencyLogout,
  extractRolesFromToken,
  calculateTokenExpiration,
  formatUserData,
  hasRequiredRole,
} from "./utils";

// Export configuration
export { AUTH_CONFIG, ENV_VARS, validateEnvVars, ENV_IS_VALID } from "./config";

// Export providers
export { authProviders, keycloakProvider } from "./providers";

// Export types
export type {
  KeycloakToken,
  CustomUser,
  UserRole,
  UserRoleType,
} from "./types";

// Export constants
export {
  USER_ROLES,
  ROLE_PRIORITY,
  ROLE_ACCESS,
} from "./types";

// Re-export commonly used types from NextAuth
export type { AuthOptions } from "next-auth";
export type { JWT } from "next-auth/jwt"; 