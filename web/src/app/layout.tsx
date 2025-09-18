import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import SessionProvider from "@/components/SessionProvider";
import TokenExpirationWarning from "@/components/TokenExpirationWarning";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SPCT - RORO Management System",
  description: "A comprehensive system for managing roll-on/roll-off operations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <NotificationProvider>
            {/* The main content of the page */}
            {children}
            {/* Your existing token expiration warning component */}
            <TokenExpirationWarning />
          </NotificationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
