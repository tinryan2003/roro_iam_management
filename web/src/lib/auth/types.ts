// Authentication-related TypeScript type definitions

export interface KeycloakToken {
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  exp?: number; // Token expiration timestamp
  iat?: number; // Token issued at timestamp
}

export interface CustomUser {
  sub: string;
  email_verified: boolean;
  name: string;
  telephone: string;
  preferred_username: string;
  org_name: string;
  given_name: string;
  family_name: string;
  email: string;
  id: string;
}

export interface UserRole {
  ADMIN: 'ADMIN';
  ACCOUNTANT: 'ACCOUNTANT';
  GUARD: 'GUARD';
  OPERATOR: 'OPERATOR';
  CUSTOMER: 'CUSTOMER';
}

export const USER_ROLES: UserRole = {
  ADMIN: 'ADMIN',
  ACCOUNTANT: 'ACCOUNTANT',
  GUARD: 'GUARD',
  OPERATOR: 'OPERATOR',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRoleType = keyof UserRole;

// Role hierarchy for dashboard routing
export const ROLE_PRIORITY: UserRoleType[] = [
  'ADMIN',
  'ACCOUNTANT',
  'GUARD',
  'OPERATOR',
  'CUSTOMER'
] as const;

// Role-based access mapping
export const ROLE_ACCESS = {
  ADMIN: ['admin', 'accountant', 'guard', 'operator', 'customer'],
  ACCOUNTANT: ['accountant'],
  GUARD: ['guard'],
  OPERATOR: ['operator'],
  CUSTOMER: ['customer'],
} as const;

// NextAuth.js type extensions
declare module "next-auth/jwt" {
  interface JWT {
    access_token: string;
    refresh_token: string;
    refresh_expires_in: number;
    expires_in: number;
    id_token: string;
    role?: string[];
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
    user: CustomUser;
    error?: string | null;
  }
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    id_token?: string;
    error?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string[];
    }
  }
} 