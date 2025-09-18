"use client";

import React, { useState, useEffect } from 'react';
import {
  usePendingBookings,
  useRefundRequests,
  useApproveBooking,
  useRejectBooking,
  useProcessRefund
} from '@/hooks/useApi';
import BookingWorkflowCard from './BookingWorkflowCard';

export default function AccountantDashboard() {
  const [activeTab, setActiveTab] = useState<'pending' | 'refunds'>('pending');
  const [pendingPage, setPendingPage] = useState(0);
  const [refundPage, setRefundPage] = useState(0);

  // API hooks
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = usePendingBookings(pendingPage, 10);
  const { data: refundData, loading: refundLoading, refetch: refetchRefunds } = useRefundRequests(refundPage, 10);
  
  const { approveBooking, loading: approveLoading } = useApproveBooking();
  const { rejectBooking, loading: rejectLoading } = useRejectBooking();
  const { processRefund, loading: refundProcessing } = useProcessRefund();

  const pendingBookings = pendingData?.content || [];
  const refundRequests = refundData?.content || [];
  const totalPending = pendingData?.totalElements || 0;
  const totalRefunds = refundData?.totalElements || 0;

  // Listen for refund processed events to refresh pending bookings
  useEffect(() => {
    const handleRefundProcessed = (event: CustomEvent) => {
      console.log('Refund processed event received:', event.detail);
      // Refresh both pending bookings and refund requests
      refetchPending();
      refetchRefunds();
    };

    window.addEventListener('refundProcessed', handleRefundProcessed as EventListener);
    
    return () => {
      window.removeEventListener('refundProcessed', handleRefundProcessed as EventListener);
    };
  }, [refetchPending, refetchRefunds]);

  const handleApprove = async (bookingId: number, notes: string) => {
    try {
      await approveBooking(bookingId, notes);
      refetchPending();
    } catch (error) {
      console.error('Failed to approve booking:', error);
    }
  };

  const handleReject = async (bookingId: number, reason: string) => {
    try {
      await rejectBooking(bookingId, reason);
      refetchPending();
    } catch (error) {
      console.error('Failed to reject booking:', error);
    }
  };

  const handleProcessRefund = async (bookingId: number, amount: number, notes: string) => {
    try {
      await processRefund(bookingId, amount, notes);
      refetchRefunds();
    } catch (error) {
      console.error('Failed to process refund:', error);
    }
  };

  const isLoading = approveLoading || rejectLoading || refundProcessing;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Accountant Dashboard</h1>
        <p className="text-gray-600">Manage booking approvals and refund requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
              <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">↩️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Refund Requests</p>
              <p className="text-2xl font-bold text-gray-900">{totalRefunds}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Approvals ({totalPending})
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'refunds'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Refund Requests ({totalRefunds})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'pending' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Approvals</h2>
          
          {pendingLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : pendingBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">✅</div>
              <p className="text-gray-600">No pending bookings to review</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {pendingBookings.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="ACCOUNTANT"
                    onApprove={handleApprove}
                    onReject={handleReject}
                    loading={isLoading}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPending > 10 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setPendingPage(Math.max(0, pendingPage - 1))}
                      disabled={pendingPage === 0}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {pendingPage + 1} of {Math.ceil(totalPending / 10)}
                    </span>
                    <button
                      onClick={() => setPendingPage(pendingPage + 1)}
                      disabled={(pendingPage + 1) * 10 >= totalPending}
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

      {activeTab === 'refunds' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Requests</h2>
          
          {refundLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : refundRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💸</div>
              <p className="text-gray-600">No refund requests to process</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {refundRequests.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="ACCOUNTANT"
                    onProcessRefund={handleProcessRefund}
                    loading={isLoading}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalRefunds > 10 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setRefundPage(Math.max(0, refundPage - 1))}
                      disabled={refundPage === 0}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {refundPage + 1} of {Math.ceil(totalRefunds / 10)}
                    </span>
                    <button
                      onClick={() => setRefundPage(refundPage + 1)}
                      disabled={(refundPage + 1) * 10 >= totalRefunds}
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
    </div>
  );
}
