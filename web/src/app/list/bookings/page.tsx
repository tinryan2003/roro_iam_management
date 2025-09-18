"use client";

import React, { useMemo, useState } from "react";
import RoleProtected from "@/components/RoleProtected";
import { useAllBookings, BookingData } from "@/hooks/useApi";
import BreadcrumbComponent from "@/components/Bread-crumb";
import { generateBreadcrumbs } from "@/components/Bread-crumb/breadcrumbUtils";
import { Search, Calendar, Users, RefreshCw, CreditCard, DollarSign, Clock } from "lucide-react";
import { useGetRole } from "@/hooks/useGetRole";

export default function BookingsListPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const userRole = useGetRole();
  const { data, loading, error, refetch } = useAllBookings(page, limit);

  const rows = useMemo(() => data?.content || [], [data?.content]);

  const filteredBookings = useMemo(() => {
    let filtered = rows;
    
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((b) =>
        [
          b.bookingCode,  
          b.id?.toString(),
          b.customerId?.toString(),
          b.routeId?.toString(),
          b.ferryId?.toString(),
        ]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((b) => {
        if (!b.departureTime) return statusFilter === 'upcoming';
        const departureDate = new Date(b.departureTime);
        return statusFilter === 'upcoming' ? departureDate > now : departureDate <= now;
      });
    }

    return filtered;
  }, [rows, search, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTime: Date | string | undefined) => {
    if (!dateTime) return 'Chưa xác định';
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const breadcrumbItems = generateBreadcrumbs("/list/bookings", undefined, userRole);

  return (
    <RoleProtected allowedRoles={["ADMIN", "OPERATION_MANAGER", "PLANNER", "ACCOUNTANT"]}>
      <div className="p-6 space-y-6">
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all bookings in the RORO system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-blue-600">
                  {data?.totalElements || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Passengers</p>
                <p className="text-3xl font-bold text-green-600">
                  {rows.reduce((sum, booking) => sum + booking.passengerCount, 0)}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-600">
                  {formatCurrency(rows.reduce((sum, booking) => sum + booking.totalAmount, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming Trips</p>
                <p className="text-3xl font-bold text-orange-600">
                  {rows.filter(b => b.departureTime && new Date(b.departureTime) > new Date()).length}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'completed')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by booking status"
            >
              <option value="all">All Bookings</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>

            {/* Page Size */}
            <select
              value={limit}
              onChange={(e) => {
                setPage(0);
                setLimit(Number(e.target.value));
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Bookings per page"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Booking Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Booking List ({filteredBookings.length} of {data?.totalElements || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading bookings...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading bookings</div>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booking Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Route & Ferry
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passengers
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Departure
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking: BookingData) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {booking.bookingCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {booking.id}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Customer #{booking.customerId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            Route #{booking.routeId || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Ferry #{booking.ferryId || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Users className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">{booking.passengerCount}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(booking.totalAmount)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {formatDateTime(booking.departureTime)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 transition-colors">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filteredBookings.length} of {data?.totalElements || 0} bookings
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {page + 1}</span>
                  <button
                    disabled={(page + 1) * limit >= (data?.totalElements || 0)}
                    onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </RoleProtected>
  );
}

