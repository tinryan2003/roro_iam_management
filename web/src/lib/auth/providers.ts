// Authentication providers configuration

import KeycloakProvider from "next-auth/providers/keycloak";
import { ENV_VARS } from "./config";

// Type for environment variables
interface EnvVars {
  EMPLOYEE_KEYCLOAK_ISSUER?: string;
  CUSTOMER_KEYCLOAK_ISSUER?: string;
  [key: string]: string | undefined;
}

// Employee Portal Keycloak Provider
export const employeeKeycloakProvider = KeycloakProvider({
  id: "employee-keycloak",
  name: "Employee Portal",
  clientId: ENV_VARS.EMPLOYEE_KEYCLOAK_ID as string,
  clientSecret: ENV_VARS.EMPLOYEE_KEYCLOAK_SECRET as string,
  issuer: (ENV_VARS as EnvVars).EMPLOYEE_KEYCLOAK_ISSUER as string,
  authorization: {
    params: {
      scope: "openid email profile roles",
    },
  },
  checks: ["pkce", "state"],
  client: {
    id_token_signed_response_alg: "RS256",
  },
  profile: (profile, tokens) => {
    return {
      id: profile.sub,
      name: profile.name ?? profile.preferred_username,
      email: profile.email,
      image: profile.picture,
      preferred_username: profile.preferred_username,
      portal: "employee",
      accessToken: tokens?.access_token || '',
      refreshToken: tokens?.refresh_token || '',
      idToken: tokens?.id_token || '',
    };
  },
});

// Debug logging for provider configuration
if (typeof window === 'undefined') {
  console.log('Employee Keycloak Provider Config:', {
    clientId: ENV_VARS.EMPLOYEE_KEYCLOAK_ID,
    issuer: (ENV_VARS as EnvVars).EMPLOYEE_KEYCLOAK_ISSUER,
    hasSecret: !!ENV_VARS.EMPLOYEE_KEYCLOAK_SECRET
  });
}

// Customer Portal Keycloak Provider
export const customerKeycloakProvider = KeycloakProvider({
  id: "customer-keycloak",
  name: "Customer Portal",
  clientId: ENV_VARS.CUSTOMER_KEYCLOAK_ID as string,
  clientSecret: ENV_VARS.CUSTOMER_KEYCLOAK_SECRET as string,
  issuer: ENV_VARS.CUSTOMER_KEYCLOAK_ISSUER as string,
  authorization: {
    params: {
      scope: "openid email profile roles",
    },
  },
  checks: ["pkce", "state"],
  client: {
    id_token_signed_response_alg: "RS256",
  },
  profile: (profile, tokens) => {
    return {
      id: profile.sub,
      name: profile.name ?? profile.preferred_username,
      email: profile.email,
      image: profile.picture,
      preferred_username: profile.preferred_username,
      portal: "customer",
      accessToken: tokens?.access_token || '',
      refreshToken: tokens?.refresh_token || '',
      idToken: tokens?.id_token || '',
    };
  },
});

// Legacy provider for backward compatibility
export const keycloakProvider = employeeKeycloakProvider;

// All providers
export const authProviders = [
  employeeKeycloakProvider,
  customerKeycloakProvider,
]; 