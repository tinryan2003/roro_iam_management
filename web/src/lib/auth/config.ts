// Authentication configuration constants and validation

export const AUTH_CONFIG = {
  // Pages
  EMPLOYEE_SIGN_IN_PAGE: '/employee-sign-in',
  CUSTOMER_SIGN_IN_PAGE: '/customer-sign-in',
  SIGN_OUT_REDIRECT: '/home',
  
  DEFAULT_ACCESS_TOKEN_EXPIRY: 86400, // 24 hours
  DEFAULT_REFRESH_TOKEN_EXPIRY: 172800, // 48 hours
  
  EXPIRATION_WARNING_THRESHOLD: 5 * 60 * 1000, 
  
  TOKEN_CHECK_INTERVAL: 120 * 1000,
} as const;

const isServer = typeof window === 'undefined';

export const ENV_VARS = isServer ? {
  CUSTOMER_KEYCLOAK_ID: process.env.CUSTOMER_KEYCLOAK_ID,
  CUSTOMER_KEYCLOAK_SECRET: process.env.CUSTOMER_KEYCLOAK_SECRET,
  CUSTOMER_KEYCLOAK_ISSUER: process.env.CUSTOMER_KEYCLOAK_ISSUER,
  
  EMPLOYEE_KEYCLOAK_ID: process.env.EMPLOYEE_KEYCLOAK_ID || process.env.KEYCLOAK_ID,
  EMPLOYEE_KEYCLOAK_SECRET: process.env.EMPLOYEE_KEYCLOAK_SECRET || process.env.KEYCLOAK_SECRET,
  EMPLOYEE_KEYCLOAK_ISSUER: process.env.EMPLOYEE_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER,

  KEYCLOAK_URL: process.env.KEYCLOAK_URL,
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM,

  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
} as const : {} as const;

// Validate required environment variables (server-side only)
export function validateEnvVars(): { isValid: boolean; missingVars: string[] } {
  // Skip validation on client side
  if (!isServer) {
    return { isValid: true, missingVars: [] };
  }

  // Check for either legacy or new variable names
  const hasEmployeeConfig = ENV_VARS.EMPLOYEE_KEYCLOAK_ID && ENV_VARS.EMPLOYEE_KEYCLOAK_SECRET;
  const hasCustomerConfig = ENV_VARS.CUSTOMER_KEYCLOAK_ID && ENV_VARS.CUSTOMER_KEYCLOAK_SECRET;
  
  const missingVars: string[] = [];
  
  // Check for NextAuth secret
  if (!ENV_VARS.NEXTAUTH_SECRET) {
    missingVars.push('NEXTAUTH_SECRET');
  }  

  if (!hasEmployeeConfig && !hasCustomerConfig) {
    missingVars.push('EMPLOYEE_KEYCLOAK_ID', 'EMPLOYEE_KEYCLOAK_SECRET', 'CUSTOMER_KEYCLOAK_ID', 'CUSTOMER_KEYCLOAK_SECRET');
  }

  if (missingVars.length > 0) {
    console.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Please create a .env.local file with the required Keycloak configuration.');
    
    // In development, throw an error to make it obvious
    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars
  };
}

// Environment validation on module load (server-side only)
let ENV_IS_VALID = true;
if (isServer) {
  const envValidation = validateEnvVars();
  ENV_IS_VALID = envValidation.isValid;
}

export { ENV_IS_VALID }; 