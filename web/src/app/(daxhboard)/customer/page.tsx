"use client";

import React from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Ship, Clock, DollarSign, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import Announcements from "@/components/Announcements/index";
import RoleProtected from '@/components/RoleProtected';
import { useBookings, useCancelBooking, useMarkBookingAsPaid, useCompleteBooking } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import RefundRequestButton from '@/components/refund/RefundRequestButton';
import RefundStatus from '@/components/refund/RefundStatus';

function CustomerDashboard() {
  const { data: session } = useSession();
  const { data: allBookings, loading, refetch } = useBookings();
  const { cancelBooking, loading: cancelLoading } = useCancelBooking();
  const { markAsPaid, loading: payLoading } = useMarkBookingAsPaid();
  const { completeBooking, loading: completeLoading } = useCompleteBooking();
  const router = useRouter();
  const [refreshing, setRefreshing] = React.useState(false);

  // Add debugging
  React.useEffect(() => {
    console.log('Customer Dashboard Debug:', {
      allBookings,
      loading,
      session: session?.user
    });
  }, [allBookings, loading, session]);

  const breadcrumbItems = generateBreadcrumbs('customer');

  // Filter bookings by status
  const inReview = (allBookings || []).filter(b => b.status === 'IN_REVIEW');
  const waitingPayment = (allBookings || []).filter(b => b.status === 'WAITING_FOR_PAYMENT');
  const inProgress = (allBookings || []).filter(b => b.status === 'IN_PROGRESS');
  const recentBookings = (allBookings || []).slice(0, 5);
  const pendingBookings = (allBookings || []).filter(b => b.status === 'PENDING');

  // Debug filtered data
  React.useEffect(() => {
    console.log('Filtered bookings:', {
      total: allBookings?.length || 0,
      pending: pendingBookings.length,
      inReview: inReview.length,
      waitingPayment: waitingPayment.length,
      inProgress: inProgress.length
    });
  }, [allBookings, pendingBookings, inReview, waitingPayment, inProgress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const onCancel = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }
    try {
      await cancelBooking(id, 'Customer requested cancellation');
      await refetch();
      alert('Cancellation request submitted successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to cancel booking');
    }
  };

  const onPay = async (id: number) => {
    try {
      await markAsPaid(id);
      await refetch();
      alert('Payment confirmed! Your booking will move to review phase.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to process payment');
    }
  };

  const onComplete = async (id: number) => {
    try {
      await completeBooking(id);
      await refetch();
      alert('Booking marked as completed. Thank you for traveling with us!');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to complete booking');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbComponent items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || 'Customer'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your ferry bookings and track your travel history
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={() => router.push('/timetable')}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Clock className="h-4 w-4" />
            Timetable
          </button>
          <button 
            onClick={() => router.push('/booking')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ship className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{allBookings?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Review</p>
              <p className="text-2xl font-bold text-gray-900">{inReview.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Awaiting Payment</p>
              <p className="text-2xl font-bold text-gray-900">{waitingPayment.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgress.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Bookings */}
        <div className="space-y-6">
          {/* In Review Bookings */}
          {inReview.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                In Review - Can Cancel ({inReview.length})
              </h2>
              <div className="space-y-3">
                {inReview.map(b => (
                  <div key={b.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{b.bookingCode} • ${b.totalAmount}</div>
                      <div className="text-gray-600">Passengers: {b.passengerCount}</div>
                      <div className="text-gray-500">Departure: {b.departureTime ? new Date(b.departureTime).toLocaleString() : 'N/A'}</div>
                      <div className="text-xs text-yellow-600 mt-1">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        30-minute cancellation window available
                      </div>
                    </div>
                    <button 
                      onClick={() => onCancel(b.id)} 
                      disabled={cancelLoading}
                      className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      Cancel & Request Refund
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Awaiting Payment */}
          {waitingPayment.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-red-600" />
                Awaiting Payment ({waitingPayment.length})
              </h2>
              <div className="space-y-3">
                {waitingPayment.map(b => (
                  <div key={b.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{b.bookingCode} • ${b.totalAmount}</div>
                      <div className="text-gray-600">Passengers: {b.passengerCount}</div>
                      <div className="text-gray-500">Deadline: {b.paymentDeadline ? new Date(b.paymentDeadline).toLocaleString() : 'N/A'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => onPay(b.id)} 
                        disabled={payLoading}
                        className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Mark as Paid
                      </button>
                      <button 
                        onClick={() => onCancel(b.id)} 
                        disabled={cancelLoading}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {inProgress.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Ship className="h-5 w-5 text-blue-600" />
                Active Travel ({inProgress.length})
              </h2>
              <div className="space-y-3">
                {inProgress.map(b => (
                  <div key={b.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{b.bookingCode} • ${b.totalAmount}</div>
                      <div className="text-gray-600">Passengers: {b.passengerCount}</div>
                      <div className="text-gray-500">Departure: {b.departureTime ? new Date(b.departureTime).toLocaleString() : 'N/A'}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        <Ship className="h-3 w-3 inline mr-1" />
                        Journey in progress
                      </div>
                    </div>
                    <button 
                      onClick={() => onComplete(b.id)} 
                      disabled={completeLoading}
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Mark Complete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Bookings */}
          {pendingBookings.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Pending Approval ({pendingBookings.length})
              </h2>
              <div className="space-y-3">
                {pendingBookings.map(b => (
                  <div key={b.id} className="flex flex-col gap-3 p-3 border rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">{b.bookingCode} • ${b.totalAmount}</div>
                        <div className="text-gray-600">Passengers: {b.passengerCount}</div>
                        <div className="text-gray-500">
                          Departure: {b.departureTime ? new Date(b.departureTime).toLocaleString() : 'N/A'}
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          <AlertCircle className="h-3 w-3 inline mr-1" />
                          Waiting for accountant approval
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <RefundRequestButton
                          bookingId={b.id}
                          bookingStatus={b.status}
                          isRefundRequested={b.refundRequested || false}
                          onRefundRequested={handleRefresh}
                        />
                        <button 
                          onClick={() => onCancel(b.id)} 
                          disabled={cancelLoading}
                          className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Cancel Booking
                        </button>
                        <button 
                          onClick={() => router.push(`/booking/${b.id}`)}
                          className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Show refund status if requested */}
                    {(b.refundRequested || b.refundApproved || b.refundRejected) && (
                      <RefundStatus booking={b} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Show empty state when no active bookings */}
          {pendingBookings.length === 0 && inReview.length === 0 && waitingPayment.length === 0 && inProgress.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="text-center py-8 text-gray-500">
                <Ship className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No Active Bookings</h3>
                <p className="mb-4">You don&apos;t have any bookings in progress</p>
                <button 
                  onClick={() => router.push('/booking')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create New Booking
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Bookings & Sidebar */}
        <div className="space-y-6">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Bookings</h2>
            {loading ? (
              <div className="text-sm text-gray-500">Loading your bookings...</div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map(b => (
                  <div key={b.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div className="text-sm">
                      <div className="font-medium">{b.bookingCode}</div>
                      <div className="text-gray-500">{b.status}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-medium">${b.totalAmount}</div>
                      <div className="text-gray-500">{b.createdAt ? new Date(b.createdAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => router.push('/booking-history')}
                  className="w-full px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                >
                  View All Bookings
                </button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Ship className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No bookings yet</p>
                <button 
                  onClick={() => router.push('/booking')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Create Your First Booking
                </button>
              </div>
            )}
          </div>

          {/* Calendar & Announcements */}
          <Announcements />
        </div>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <RoleProtected allowedRoles={['CUSTOMER']}>
      <CustomerDashboard />
    </RoleProtected>
  );
}