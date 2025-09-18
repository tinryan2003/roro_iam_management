"use client";
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

const sidebarItems = [
  {
    title: "MENU",
    items: [
      {
        icon: "/house-door.svg",
        label: "Home",
        href: "/home",
      },
      {
        icon: "/employee.svg",
        label: "Employees",
        href: "/list/employees",
      },
      {
        icon: "/people.svg",
        label: "Customers",
        href: "/list/customers",
      },
      {
        icon: "/booking-svgrepo-com.svg",
        label: "Bookings",
        href: "/list/bookings",
      },
      {
        icon: "/ferry-2-svgrepo-com.svg",
        label: "Ferries",
        href: "/list/ferries",
      },
      {
        icon: "/calendar-svgrepo-com.svg",
        label: "Schedules",
        href: "/list/schedules",
      },
      {
        icon: "/booking-svgrepo-com.svg",
        label: "Booking",
        href: "/booking",
      },
      {
        icon: "/history-svgrepo-com.svg",
        label: "Booking History",
        href: "/booking-history",
      },
      {
        icon: "/route-svgrepo-com.svg",
        label: "Routes",
        href: "/list/routes",
      },
      {
        icon: "/bell.svg",
        label: "Notifications",
        href: "/list/notification",
      },
    ],
  },

  {
    title: "SETTINGS",
    items: [
      {
        icon: "/keycloak-svgrepo-com.svg",
        label: "Keycloak Admin",
        href: "http://localhost:8180/realms/master/protocol/openid-connect/auth?client_id=security-admin-console&redirect_uri=http%3A%2F%2Flocalhost%3A8180%2Fadmin%2Fmaster%2Fconsole%2F&state=15da3dd9-3a46-4f64-bc31-97855f439bb9&response_mode=query&response_type=code&scope=openid&nonce=8c03db76-dfaf-4b96-a4d4-8fcf8d907bcd&code_challenge=F9cdM-7zUqTC9erVjiI2NMN2PuNNqnAKi11zovkfa1k&code_challenge_method=S256",
      },
    ],
  }
];

const Sidebar = () => {
  const { data: session, status } = useSession();

  // Avoid SSR -> CSR flicker; defer rendering until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Show loading state while session not ready
  const showSkeleton = !mounted || status === "loading";
  if (showSkeleton) {
    return (
      <nav className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  // Show message if user is not authenticated
  if (status === "unauthenticated") {
    return (
      <nav className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">Please sign in to access navigation</p>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`flex flex-col h-full transition-opacity duration-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6">
        {sidebarItems.map((section) => (
          <div key={section.title}>
            <h3 className="hidden lg:block text-gray-400 font-medium text-xs uppercase tracking-wider mb-2 lg:mb-3 px-2">
              {section.title}
            </h3>
            <ul className="space-y-0.5 lg:space-y-1">
              {section.items.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="smooth-hover flex items-center justify-center lg:justify-start gap-3 text-gray-600 dark:text-gray-400 py-2 lg:py-2.5 px-1 lg:px-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 group relative focus-ring"
                    title={item.label}
                  >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                      <Image 
                        src={item.icon} 
                        alt={item.label} 
                        width={18} 
                        height={18}
                        className="opacity-75 group-hover:opacity-100 transition-opacity duration-200"
                      />
                    </div>
                    <span className="hidden lg:block text-sm font-medium truncate">
                      {item.label}
                    </span>
                    
                    {/* Tooltip for mobile/tablet */}
                    <div className="lg:hidden absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="hidden lg:block p-5 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500">
            <div>User: {session?.user?.name || 'Unknown'}</div>
            <div>Email: {session?.user?.email || 'Unknown'}</div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Sidebar;