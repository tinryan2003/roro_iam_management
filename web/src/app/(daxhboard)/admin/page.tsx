"use client";

import React from 'react';
import { Users, Ship, Calendar, TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';
import { useBookingStats, useEmployees, useCustomers } from '@/hooks/useApi';
import RoleProtected from '@/components/RoleProtected';
import Link from 'next/link';

interface Employee {
  employeeId: number | null | undefined;  // Changed from 'id' to 'employeeId'
  employeeCode: string;
  accountId: number;
  position?: string;
  hireDate: string;
  salary: number;
  isActive?: boolean;
}

 

function AdminContent() {
  const { data: bookingStats, loading: statsLoading, error: statsError, refetch: refetchStats } = useBookingStats();
  const { data: employeeData, loading: employeeLoading, error: employeeError, refetch: refetchEmployees } = useEmployees(0, 100);
  const { data: customerData, loading: customerLoading, error: customerError, refetch: refetchCustomers } = useCustomers(0, 100);

  const isLoading = statsLoading || employeeLoading || customerLoading;
  const hasError = statsError || employeeError || customerError;

  const refetchAll = () => {
    refetchStats();
    refetchEmployees();
    refetchCustomers();
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="text-blue-600">Loading from backend...</div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            RORO Management System Overview 
            <span className="text-green-600 font-medium ml-2">✅ Connected to Backend</span>
          </p>
        </div>
        <button
          onClick={refetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Error Banner */}
      {hasError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="text-red-900 font-medium">Backend Connection Issues</h3>
              <p className="text-red-700 text-sm">
                {statsError || employeeError || customerError}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Bookings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-blue-600">
                {bookingStats?.totalBookings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Ship className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Employees */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-3xl font-bold text-green-600">
                {employeeData?.totalElements || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Active staff</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-purple-600">
                {customerData?.totalElements || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Registered users</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
                             <p className="text-sm font-medium text-gray-600">Today&apos;s Bookings</p>
              <p className="text-3xl font-bold text-orange-600">
                {bookingStats?.todayBookings || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Statistics */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Booking Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Week</span>
              <span className="font-semibold text-blue-600">
                {bookingStats?.thisWeekBookings || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">This Month</span>
              <span className="font-semibold text-green-600">
                {bookingStats?.thisMonthBookings || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total All Time</span>
              <span className="font-semibold text-purple-600">
                {bookingStats?.totalBookings || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            System Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backend API</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Database</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Operational</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Authentication</span>
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium">Active</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Data Samples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Employees</h3>
          {employeeData?.content?.length ? (
            <div className="space-y-3">
              {employeeData.content.slice(0, 5).map((employee: Employee, index: number) => (
                <div key={employee.employeeId ?? `employee-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{employee.employeeCode}</p>
                    <p className="text-sm text-gray-600">{employee.position || 'Position TBD'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No employee data available
            </div>
          )}
        </div>

        {/* Recent Customers */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customers</h3>
          {customerData?.content?.length ? (
            <div className="space-y-3">
              {customerData.content.slice(0, 5).map((customer, index: number) => (
                <div key={customer.customerCode || `customer-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{(customer.firstName ?? '') + ' ' + (customer.lastName ?? '')}</p>
                    <p className="text-sm text-gray-600">{customer.email ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{customer.customerCode}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customer data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/list/employees"
            className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
          >
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900 group-hover:text-blue-700">
                Manage Employees
              </p>
              <p className="text-sm text-blue-600">
                View and edit staff
              </p>
            </div>
          </Link>

          <Link
            href="/list/customers"
            className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
          >
            <Users className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900 group-hover:text-green-700">
                Manage Customers
              </p>
              <p className="text-sm text-green-600">
                View customer list
              </p>
            </div>
          </Link>

          <Link
            href="/list/schedules"
            className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <Calendar className="h-6 w-6 text-purple-600" />
            <div>
              <p className="font-medium text-purple-900 group-hover:text-purple-700">
                Manage Schedules
              </p>
              <p className="text-sm text-purple-600">
                Create and edit
              </p>
            </div>
          </Link>

          <Link
            href="/list/bookings"
            className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
          >
            <Calendar className="h-6 w-6 text-orange-600" />
            <div>
              <p className="font-medium text-orange-900 group-hover:text-orange-700">
                View Booking List
              </p>
              <p className="text-sm text-orange-600">
                Schedule overview
              </p>
            </div>
          </Link>
        </div>
      </div>

      {/* API Status Footer */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-800 font-medium">
            Live Backend Connection Active - Data refreshes automatically
          </span>
        </div>
      </div>
      </div>
  );
}

const AdminDashboard = () => {
  return (
    <RoleProtected allowedRoles={["ADMIN"]}>
      <AdminContent />
    </RoleProtected>
  );
};

export default AdminDashboard;