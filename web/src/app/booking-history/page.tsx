"use client";

import React, { useState } from 'react';
import { Search, Calendar, MapPin, Ship, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useBookings } from '@/hooks/useApi';
import RoleProtected from '@/components/RoleProtected';
import { generateBreadcrumbs } from "@/components/Bread-crumb/breadcrumbUtils";
import BreadcrumbComponent from "@/components/Bread-crumb";
import { useGetRole } from "@/hooks/useGetRole";
import { useRouter } from 'next/navigation';

function BookingHistoryContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const userRole = useGetRole();
  const router = useRouter();

  const { data: bookings, loading, error, refetch } = useBookings(true);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in-transit': return <Ship className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-transit': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = (bookings || []).filter(booking => {
    const matchesSearch = booking.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all'; // For now, show all since status isn't in response
    return matchesSearch && matchesStatus;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
            <p className="text-gray-600">Loading your booking history...</p>
          </div>
          <div className="bg-white rounded-lg p-12 shadow-sm text-center">
            <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Bookings</h3>
            <p className="text-gray-600">Fetching data from backend...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
            <p className="text-gray-600">Error loading booking history</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Backend Connection Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = generateBreadcrumbs("/booking-history", undefined, userRole);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BreadcrumbComponent items={breadcrumbItems} />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
          <p className="text-gray-600">
            View and manage your past ferry reservations 
            <span className="text-green-600 font-medium ml-2">✅ Connected to Backend</span>
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
            <p className="text-3xl font-bold text-blue-600">{bookings?.length || 0}</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Spent</h3>
            <p className="text-3xl font-bold text-green-600">
              ${(bookings || []).reduce((sum, b) => sum + b.totalAmount, 0).toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Passengers</h3>
            <p className="text-3xl font-bold text-purple-600">
              {(bookings || []).reduce((sum, b) => sum + b.passengerCount, 0)}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Backend Status</h3>
            <p className="text-3xl font-bold text-green-600">✅ Connected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search bookings..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
                <option value="in-transit">In Transit</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="md:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by date range"
              >
                <option value="all">All Time</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="this-year">This Year</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg p-12 shadow-sm text-center">
              <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {bookings?.length === 0 ? 'No bookings found' : 'No matching bookings'}
              </h3>
              <p className="text-gray-600">
                {bookings?.length === 0 
                  ? 'You haven\'t made any bookings yet. Start by booking your first ferry trip!'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {bookings?.length === 0 && (
                <button
                  onClick={() => window.location.href = '/booking'}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Book Your First Trip
                </button>
              )}
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Left Section */}
                  <div className="flex-1 mb-4 lg:mb-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-lg text-gray-900">{booking.bookingCode}</span>
                      <div className="flex items-center gap-1">
                        {getStatusIcon('pending')}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('pending')}`}>
                          Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>Route: {booking.routeId ? `Route ${booking.routeId}` : 'TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{booking.departureTime || 'Date TBD'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4" />
                        <span>Ferry: {booking.ferryId ? `Ferry ${booking.ferryId}` : 'TBD'}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <span>Passengers: {booking.passengerCount} • Vehicle: {booking.vehicleId ? `Vehicle ${booking.vehicleId}` : 'None'}</span>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="lg:text-right">
                    <div className="text-xl font-bold text-gray-900 mb-1">${booking.totalAmount.toFixed(2)}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor('paid')}`}>
                      Paid
                    </span>
                    <button onClick={() => router.push(`/booking/${booking.id}`)} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredBookings.length > 0 && (
          <div className="mt-8 flex justify-center">
            <div className="text-sm text-gray-600">
              Showing {filteredBookings.length} of {bookings?.length || 0} bookings
              <span className="text-green-600 font-medium ml-2">📡 Live from Backend</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const BookingHistoryPage = () => {
  return (
    <RoleProtected allowedRoles={["customer", "admin"]}>
      <BookingHistoryContent />
    </RoleProtected>
  );
};

export default BookingHistoryPage;
