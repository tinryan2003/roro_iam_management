import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirectUri') || '/';

    // If no session, redirect to the requested URI
    if (!session) {
      return NextResponse.redirect(new URL(redirectUri, request.url));
    }

    // If we have an access token, call backend logout for token blacklisting
    if (session.accessToken) {
      try {
        const backendLogoutUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/auth/logout`;
        
        await fetch(backendLogoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      } catch (error) {
        console.warn('Backend logout failed:', error);
        // Continue with logout even if backend call fails
      }
    }

    // If we have an id_token, perform Keycloak logout
    if (session.id_token) {
      // Choose issuer per provider
      const sessionWithProvider = session as typeof session & { provider?: string };
      const provider = sessionWithProvider.provider || "unknown";
      let issuer = process.env.EMPLOYEE_KEYCLOAK_ISSUER || process.env.KEYCLOAK_ISSUER;
      if (provider === 'customer-keycloak') {
        issuer = process.env.CUSTOMER_KEYCLOAK_ISSUER || issuer;
      }
      const keycloakLogoutUrl = `${issuer}/protocol/openid-connect/logout`;
      
      // Determine which client ID to use based on the session
      let clientId = process.env.KEYCLOAK_ID; // Default fallback
      
      // Check if we can determine the client from the session
      // provider is already computed above
      
      if (provider === 'customer-keycloak') {
        clientId = process.env.CUSTOMER_KEYCLOAK_ID;
      } else if (provider === 'employee-keycloak') {
        clientId = process.env.EMPLOYEE_KEYCLOAK_ID || process.env.KEYCLOAK_ID;
      }
      
      if (!clientId) {
        console.error('Keycloak client ID not configured');
        // Fallback to NextAuth signout
        const signoutUrl = new URL('/api/auth/signout', request.url);
        signoutUrl.searchParams.set('callbackUrl', redirectUri);
        return NextResponse.redirect(signoutUrl);
      }

      // Validate ID token
      if (!session.id_token || typeof session.id_token !== 'string' || session.id_token.trim() === '') {
        console.error('Invalid ID token for logout');
        // Fallback to NextAuth signout
        const signoutUrl = new URL('/api/auth/signout', request.url);
        signoutUrl.searchParams.set('callbackUrl', redirectUri);
        return NextResponse.redirect(signoutUrl);
      }

      const logoutParams = new URLSearchParams({
        id_token_hint: session.id_token,
        post_logout_redirect_uri: new URL(redirectUri, request.url).toString(),
        client_id: clientId
      });

      const keycloakFullLogoutUrl = `${keycloakLogoutUrl}?${logoutParams.toString()}`;
      
      console.log('Redirecting to Keycloak logout:', keycloakFullLogoutUrl);
      console.log('Client ID:', clientId);
      console.log('Provider:', provider);
      
      // Redirect to Keycloak logout which will handle NextAuth session cleanup
      return NextResponse.redirect(keycloakFullLogoutUrl);
    }

    // Fallback: redirect to NextAuth signout
    const signoutUrl = new URL('/api/auth/signout', request.url);
    signoutUrl.searchParams.set('callbackUrl', redirectUri);
    
    return NextResponse.redirect(signoutUrl);

  } catch (error) {
    console.error('Logout API error:', error);
    
    // Fallback redirect to requested URI
    const redirectUri = new URL(request.nextUrl.searchParams.get('redirectUri') || '/', request.url);
    return NextResponse.redirect(redirectUri);
  }
}

// POST method for API-style logout calls
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    // Call backend logout for token blacklisting
    if (session.accessToken) {
      try {
        const backendLogoutUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/auth/logout`;
        
        const response = await fetch(backendLogoutUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.warn('Backend logout failed with status:', response.status);
        }
      } catch (error) {
        console.warn('Backend logout failed:', error);
      }
    }

    return NextResponse.json({ success: true, message: 'Logout successful' });

  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
} 