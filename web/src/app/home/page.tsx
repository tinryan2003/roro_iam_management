"use client";

import React from 'react';
import Link from "next/link";
import { useSession } from "next-auth/react";
import PublicNavbar from "@/components/PublicNavbar";
import { 
  Users, BarChart3, Shield, Clock,
  ArrowRight, Ship, Globe, Calendar, MapPin, CreditCard 
} from 'lucide-react';
import { useGetRole } from '@/hooks/useGetRole';

const HomePage = () => {
  const { data: session, status } = useSession();

  const userRole = useGetRole();

  const getDashboardRoute = (): string => {
    if (!userRole) return "/home";
    return `/${userRole.toLowerCase()}`;
  };

  // Debug logging
  React.useEffect(() => {
    console.log('Home page session status:', status);
    console.log('Home page session data:', {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasIdToken: !!session?.id_token,
      userRole: session?.user?.role,
      expires: session?.expires
    });
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Public Navigation */}
      <PublicNavbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-400/5 dark:to-purple-400/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              <span className="block">RORO Management</span>
              <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                System
              </span>
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Internal management platform for RORO operations staff and administrators
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {session ? (
                <Link
                  href={getDashboardRoute()}
                  className="btn-smooth inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus-ring"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                  <Link
                    href="/sign-in"
                    className="btn-smooth inline-flex items-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl focus-ring group"
                  >
                    Staff Login
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    • For authorized personnel only
                  </span>
                </div>
              )}
              <Link
                href="/contact"
                className="btn-smooth inline-flex items-center px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-600 dark:hover:border-blue-400 font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 focus-ring"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Features Section */}
      <section className="py-16 lg:py-24 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Customer Experience Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover what customers can do with our RORO management platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 - Online Booking */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Online Booking System
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Customers can easily book ferry tickets for passengers and vehicles through our intuitive online platform.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Select departure & arrival ports
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Choose date and time slots
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Add vehicles and passengers
                </div>
              </div>
            </div>

            {/* Feature 2 - Real-time Status */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <MapPin className="h-8 w-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Real-time Ferry Tracking
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Track ferry locations, departure times, and arrival estimates in real-time for better travel planning.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Live ferry GPS location
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Departure & arrival updates
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Weather & delay notifications
                </div>
              </div>
            </div>

            {/* Feature 3 - Digital Payments */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <CreditCard className="h-8 w-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Secure Payment Processing
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Multiple payment options with secure processing and instant booking confirmations.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Credit/debit card payments
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Digital wallet integration
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  Instant receipt & e-tickets
                </div>
              </div>
            </div>

            {/* Feature 4 - Booking Management */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Users className="h-8 w-8 text-orange-600 dark:text-orange-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Booking Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Manage existing bookings, modify travel plans, and access booking history through customer portal.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  View & modify bookings
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Cancellation & refunds
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                  Download e-tickets & receipts
                </div>
              </div>
            </div>

            {/* Feature 5 - Ferry Information */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Ship className="h-8 w-8 text-red-600 dark:text-red-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Ferry Information
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Access detailed information about ferry amenities, capacity, and onboard facilities.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Vehicle capacity & restrictions
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Onboard amenities & services
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                  Safety guidelines & policies
                </div>
              </div>
            </div>

            {/* Feature 6 - Mobile Access */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Globe className="h-8 w-8 text-indigo-600 dark:text-indigo-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Mobile-Friendly Platform
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300 mb-4">
                Access all services on any device with our responsive web platform and mobile app.
              </p>
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Responsive web design
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Mobile app availability
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                  Offline ticket access
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Management Features Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Internal Management Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Comprehensive tools designed for RORO operations staff and management
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Staff Feature 1 */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Fleet Operations Control
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Monitor and manage entire ferry fleet with real-time tracking, maintenance schedules, and operational insights.
              </p>
            </div>

            {/* Staff Feature 2 */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Analytics & Reporting
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Comprehensive analytics dashboard with revenue tracking, operational metrics, and performance insights.
              </p>
            </div>

            {/* Staff Feature 3 */}
            <div className="card-hover bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-gray-700 group">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl w-fit mb-4 transition-transform duration-300 group-hover:scale-110">
                <Clock className="h-8 w-8 text-purple-600 dark:text-purple-400 transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Schedule Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300 transition-colors duration-300">
                Optimize ferry schedules with intelligent routing, weather integration, and dynamic capacity allocation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Access Your Management Dashboard
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Secure access for RORO operations staff and administrators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {!session ? (
              <Link
                href="/sign-in"
                className="btn-smooth inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 focus-ring group"
              >
                Staff Login
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ) : (
              <Link
                href={getDashboardRoute()}
                className="btn-smooth inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 focus-ring group"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-xl font-bold">RORO Management System</span>
              </div>
              <p className="text-gray-400 mb-4">
                Comprehensive internal management platform for RORO operations and administration.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/home" className="text-gray-400 hover:text-white smooth-transition">Home</Link></li>
                <li><Link href="/about" className="text-gray-400 hover:text-white smooth-transition">About</Link></li>
                <li><Link href="/contact" className="text-gray-400 hover:text-white smooth-transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">System</h3>
              <ul className="space-y-2">
                <li><Link href="/sign-in" className="text-gray-400 hover:text-white smooth-transition">Staff Login</Link></li>
                <li><span className="text-gray-400">Documentation</span></li>
                <li><span className="text-gray-400">Support</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 RORO Management System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;