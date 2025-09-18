"use client";

import React, { useState } from 'react';
import {
  useBookings,
  useAwaitingPaymentBookings,
  useMarkBookingAsPaid,
  useCompleteBooking,
  useCancelBooking
} from '@/hooks/useApi';
import BookingWorkflowCard from './BookingWorkflowCard';
import PaymentSimulation from '../payment/PaymentSimulation';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState<'all' | 'payment' | 'active'>('all');
  const [page, setPage] = useState(0);
  
  // Payment simulation state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<{
    id: number;
    totalAmount: number;
    bookingCode: string;
  } | null>(null);

  // API hooks
  const { data: allBookings, loading: allLoading, refetch: refetchAll } = useBookings();
  const { data: paymentData, loading: paymentLoading, refetch: refetchPayment } = useAwaitingPaymentBookings(page, 10);
  
  const { markAsPaid, loading: paymentProcessing } = useMarkBookingAsPaid();
  const { completeBooking, loading: completionLoading } = useCompleteBooking();
  const { cancelBooking, loading: cancellationLoading } = useCancelBooking();

  const paymentBookings = paymentData?.content || [];
  const totalPaymentBookings = paymentData?.totalElements || 0;
  
  // Filter bookings by status
  const activeBookings = allBookings?.filter(booking => 
    ['PAID', 'IN_PROGRESS'].includes(booking.status)
  ) || [];

  const handlePayment = async (bookingId: number) => {
    // Find the booking to get payment details
    const booking = paymentBookings.find(b => b.id === bookingId);
    if (booking) {
      setSelectedBookingForPayment(booking);
      setPaymentModalOpen(true);
    }
  };

  const handlePaymentComplete = async (success: boolean, paymentData?: { id: number; paymentNumber: string; transactionId: string }) => {
    if (success) {
      console.log('Payment completed successfully:', paymentData);
      refetchAll();
      refetchPayment();
    } else {
      console.error('Payment failed:', paymentData);
    }
    setPaymentModalOpen(false);
    setSelectedBookingForPayment(null);
  };

  const handleComplete = async (bookingId: number) => {
    try {
      await completeBooking(bookingId);
      refetchAll();
    } catch (error) {
      console.error('Failed to complete booking:', error);
    }
  };

  const handleCancel = async (bookingId: number, reason: string) => {
    try {
      await cancelBooking(bookingId, reason);
      refetchAll();
      refetchPayment();
    } catch (error) {
      console.error('Failed to cancel booking:', error);
    }
  };

  const isLoading = paymentProcessing || completionLoading || cancellationLoading;

  // Get status counts for stats
  const statusCounts = allBookings?.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">Manage your ferry bookings and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">💳</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Awaiting Payment</p>
              <p className="text-xl font-bold text-gray-900">{statusCounts['WAITING_FOR_PAYMENT'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🚢</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">{activeBookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-xl font-bold text-gray-900">{statusCounts['COMPLETED'] || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📊</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{allBookings?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Bookings ({allBookings?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Awaiting Payment ({statusCounts['WAITING_FOR_PAYMENT'] || 0})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'active'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Active Bookings ({activeBookings.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">All Your Bookings</h2>
          
          {allLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !allBookings || allBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🚢</div>
              <p className="text-gray-600">No bookings found</p>
              <p className="text-gray-500 text-sm mt-2">Create your first booking to get started</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {allBookings.map((booking) => (
                <BookingWorkflowCard
                  key={booking.id}
                  booking={booking}
                  userRole="CUSTOMER"
                  onPay={handlePayment}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  loading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'payment' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Bookings Awaiting Payment</h2>
          
          {paymentLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : paymentBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💳</div>
              <p className="text-gray-600">No pending payments</p>
            </div>
          ) : (
            <>
              {/* Payment Notice */}
              <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-800">
                      Payment Required
                    </h3>
                    <div className="mt-2 text-sm text-orange-700">
                      <p>Please complete payment for your confirmed bookings within the specified deadline to avoid cancellation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6">
                {paymentBookings.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="CUSTOMER"
                    onPay={handlePayment}
                    onCancel={handleCancel}
                    loading={isLoading}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPaymentBookings > 10 && (
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
                      Page {page + 1} of {Math.ceil(totalPaymentBookings / 10)}
                    </span>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * 10 >= totalPaymentBookings}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Bookings</h2>
          
          {allLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🚢</div>
              <p className="text-gray-600">No active bookings</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {activeBookings.map((booking) => (
                <BookingWorkflowCard
                  key={booking.id}
                  booking={booking}
                  userRole="CUSTOMER"
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  loading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Payment Simulation Modal */}
      {selectedBookingForPayment && (
        <PaymentSimulation
          bookingId={selectedBookingForPayment.id}
          amount={selectedBookingForPayment.totalAmount}
          onPaymentComplete={handlePaymentComplete}
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedBookingForPayment(null);
          }}
        />
      )}
    </div>
  );
}
