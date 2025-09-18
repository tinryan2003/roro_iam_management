"use client";

import React, { useState } from 'react';
import {
  useInProgressBookings,
  useConfirmArrival
} from '@/hooks/useApi';
import BookingWorkflowCard from './BookingWorkflowCard';

export default function OperationDashboard() {
  const [page, setPage] = useState(0);

  // API hooks
  const { data: progressData, loading: progressLoading, refetch: refetchProgress } = useInProgressBookings(page, 10);
  const { confirmArrival, loading: confirmationLoading } = useConfirmArrival();

  const inProgressBookings = progressData?.content || [];
  const totalBookings = progressData?.totalElements || 0;

  const handleConfirmArrival = async (bookingId: number) => {
    try {
      await confirmArrival(bookingId);
      refetchProgress();
    } catch (error) {
      console.error('Failed to confirm arrival:', error);
    }
  };

  // Separate bookings by arrival status
  const pendingArrivals = inProgressBookings.filter(booking => !booking.confirmedArrivalAt);
  const confirmedArrivals = inProgressBookings.filter(booking => booking.confirmedArrivalAt);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Operations Dashboard</h1>
        <p className="text-gray-600">Manage arrivals and in-progress bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🚢</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Arrivals</p>
              <p className="text-2xl font-bold text-gray-900">{pendingArrivals.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Arrivals Confirmed</p>
              <p className="text-2xl font-bold text-gray-900">{confirmedArrivals.length}</p>
            </div>
          </div>
        </div>
      </div>

      {progressLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : totalBookings === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🚢</div>
          <p className="text-gray-600">No active bookings to manage</p>
          <p className="text-gray-500 text-sm mt-2">Check back when there are paid bookings in progress</p>
        </div>
      ) : (
        <>
          {/* Pending Arrivals Section */}
          {pendingArrivals.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">Pending Arrivals</h2>
                <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {pendingArrivals.length} pending
                </span>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Action Required
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>These bookings are waiting for arrival confirmation. Please confirm when customers arrive at the port.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 mb-8">
                {pendingArrivals.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="OPERATION_MANAGER"
                    onConfirmArrival={handleConfirmArrival}
                    loading={confirmationLoading}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Arrivals Section */}
          {confirmedArrivals.length > 0 && (
            <div className="mb-8">
              <div className="mb-4 flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">Confirmed Arrivals</h2>
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {confirmedArrivals.length} confirmed
                </span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Arrivals Confirmed
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>These bookings have confirmed arrivals and are ready for customer completion.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {confirmedArrivals.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="OPERATION_MANAGER"
                    loading={confirmationLoading}
                    showActions={false} // No actions needed for confirmed arrivals
                  />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalBookings > 10 && (
            <div className="flex justify-center mt-8">
              <nav className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {page + 1} of {Math.ceil(totalBookings / 10)}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={(page + 1) * 10 >= totalBookings}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Quick Actions Card */}
      <div className="mt-8 bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">Arrival Confirmation Process</h4>
            <p className="text-sm text-gray-600 mb-3">
              When customers arrive at the port, confirm their arrival to notify them that they can complete their booking.
            </p>
            <div className="text-xs text-gray-500">
              ✓ Verify customer identity<br/>
              ✓ Check booking details<br/>
              ✓ Confirm arrival in system
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-md p-4">
            <h4 className="font-medium text-gray-900 mb-2">Booking Workflow</h4>
            <p className="text-sm text-gray-600 mb-3">
              Track the complete journey from payment to completion.
            </p>
            <div className="text-xs text-gray-500">
              Paid → In Progress → Arrival Confirmed → Customer Completes
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
