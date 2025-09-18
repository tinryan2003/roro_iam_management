"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Menu, X, User, Settings } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const PublicNavbar = () => {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);


  const roles = ["ADMIN", "OPERATION_MANAGER", "PLANNER", "ACCOUNTANT", "CUSTOMER"]

  const getDashboardRoute = (): string => {
    const userRoles: string[] = session?.user?.role || [];

    // Prefer explicit mapping when needed
    const hasRole = (role: string) => userRoles.includes(role);

    if (hasRole("ADMIN")) return "/admin";
    if (hasRole("CUSTOMER")) return "/customer";
    if (hasRole("ACCOUNTANT")) return "/accountant";
    if (hasRole("PLANNER")) return "/planner";
    if (hasRole("OPERATION_MANAGER")) return "/operation_manager"; 

    // Fallback: first known role route
    for (const role of roles) {
      if (hasRole(role)) {
        return `/${role.toLowerCase()}`;
      }
    }

    return "/home";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/home" className="flex items-center space-x-2">
              <Image
                src="/logo.svg"
                alt="RORO Management System"
                width={24} 
                height={24}
                className="w-6 h-6"
              />
              <span className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                RORO System
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/home"
                className="smooth-hover text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
              >
                Home
              </Link>
              <Link
                href="/about"
                className="smooth-hover text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
              >
                About
              </Link>
              <Link
                href="/booking"
                className="smooth-hover text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
              >
                Booking
              </Link>
              <Link
                href="/contact"
                className="smooth-hover text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Right side - Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <div className="relative">
                <button
                  onClick={toggleProfileDropdown}
                  className="smooth-hover flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
                >
                  <User className="h-5 w-5" />
                  <span>{session.user?.name || 'User'}</span>
                </button>
                
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in-down">
                    <div className="py-2">
                      <Link
                        href={getDashboardRoute()}
                        className="smooth-hover flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                      <LogoutButton
                        redirectTo="/home"
                        className="smooth-hover w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mx-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/customer-sign-in"
                  className="smooth-hover text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium rounded-lg focus-ring"
                >
                  Customer Login
                </Link>
                <Link
                  href="/employee-sign-in"
                  className="btn-smooth bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl focus-ring"
                >
                  Staff Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/home"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/booking"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Booking
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                {session ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-base font-medium text-gray-900 dark:text-white">
                      {session.user?.name || 'User'}
                    </div>
                    <Link
                      href={getDashboardRoute()}
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <div onClick={() => setIsMobileMenuOpen(false)}>
                      <LogoutButton
                        redirectTo="/home"
                        className="block w-full text-left px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/customer-sign-in"
                      className="block px-3 py-2 text-base font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Customer Login
                    </Link>
                    <Link
                      href="/employee-sign-in"
                      className="block mx-3 my-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-md text-base font-medium transition-colors duration-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Staff Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default PublicNavbar; 