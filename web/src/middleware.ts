import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware() {
    // Add any additional middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if account is authenticated for protected routes
        const { pathname } = req.nextUrl;
        
        // Allow access to public routes
        if (
          pathname === "/" ||
          pathname === "/home" ||
          pathname === "/about" ||
          pathname === "/employee-sign-in" ||
          pathname === "/customer-sign-in" ||
          pathname === "/contact" ||
          pathname === "/booking" ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }
        
        // Require authentication for dashboard routes
        if (pathname.startsWith("/(daxhboard)") || pathname.startsWith("/admin")) {
          return !!token;
        }
        
        // Default to requiring authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}; 