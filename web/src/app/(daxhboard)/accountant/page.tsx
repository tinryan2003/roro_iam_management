"use client";

import React, { useEffect } from 'react';
import { DollarSign, Clock, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import FinanceChart from "@/components/FinanceChart/index";
import EventCalendar from "@/components/EventCalendar/index";
import Announcements from "@/components/Announcements/index";
import RoleProtected from '@/components/RoleProtected';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { usePendingBookings, useApproveBooking, useRejectBooking, useRefundRequests, useProcessRefund, useBookingWorkflowStats } from '@/hooks/useApi';

function AccountantContent() {
  const { data: pendingData, loading: pendingLoading, refetch: refetchPending } = usePendingBookings(0, 10);
  const { data: refundData, loading: refundLoading, refetch: refetchRefunds } = useRefundRequests(0, 10);
  const { data: workflowStats, loading: statsLoading } = useBookingWorkflowStats();
  const { approveBooking, loading: approveLoading } = useApproveBooking();
  const { rejectBooking, loading: rejectLoading } = useRejectBooking();
  const { processRefund, loading: processLoading } = useProcessRefund();
  
  const [notesMap, setNotesMap] = React.useState<Record<number, string>>({});
  const [refundMap, setRefundMap] = React.useState<Record<number, { amount: string; notes: string }>>({});
  const [refreshing, setRefreshing] = React.useState(false);

  const breadcrumbItems = generateBreadcrumbs('accountant');

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchPending(), refetchRefunds()]);
    } finally {
      setRefreshing(false);
    }
  };

  // Listen for refund processed events to refresh pending bookings
  useEffect(() => {
    const handleRefundProcessed = (event: CustomEvent) => {
      console.log('Refund processed event received in accountant page:', event.detail);
      // Refresh both pending bookings and refund requests
      refetchPending();
      refetchRefunds();
    };

    window.addEventListener('refundProcessed', handleRefundProcessed as EventListener);
    
    return () => {
      window.removeEventListener('refundProcessed', handleRefundProcessed as EventListener);
    };
  }, [refetchPending, refetchRefunds]);

  const handleApprove = async (id: number) => {
    try {
      await approveBooking(id, notesMap[id] || 'Approved by accountant');
      setNotesMap(prev => ({ ...prev, [id]: '' }));
      await refetchPending();
      alert('Booking approved and moved to review phase');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to approve booking');
    }
  };

  const handleReject = async (id: number) => {
    const reason = notesMap[id] || 'Rejected by accountant';
    if (!reason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await rejectBooking(id, reason);
      setNotesMap(prev => ({ ...prev, [id]: '' }));
      await refetchPending();
      alert('Booking rejected');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to reject booking');
    }
  };

  const handleProcessRefund = async (id: number) => {
    const entry = refundMap[id] || { amount: '0', notes: '' };
    const amount = parseFloat(entry.amount || '0');
    
    if (amount <= 0) {
      alert('Please enter a valid refund amount');
      return;
    }
    
    try {
      await processRefund(id, amount, entry.notes || 'Refund processed by accountant');
      setRefundMap(prev => ({ ...prev, [id]: { amount: '', notes: '' } }));
      await refetchRefunds();
      alert('Refund processed successfully');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(msg || 'Failed to process refund');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <BreadcrumbComponent items={breadcrumbItems} />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accountant Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage booking approvals and process refunds
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
        </div>
      </div>

      {/* Workflow Stats */}
      {!statsLoading && workflowStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold text-gray-900">{workflowStats.pendingCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Refund Requests</p>
                <p className="text-2xl font-bold text-gray-900">{workflowStats.refundRequestsCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Today</p>
                <p className="text-2xl font-bold text-gray-900">{workflowStats.completedTodayCount || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{workflowStats.inProgressCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Bookings for Approval */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Pending Approval ({pendingData?.content?.length || 0})
          </h2>
          {pendingLoading ? (
            <div className="text-sm text-gray-500">Loading pending bookings...</div>
          ) : pendingData && pendingData.content && pendingData.content.length > 0 ? (
            <div className="space-y-4">
              {pendingData.content.map((b) => (
                <div key={b.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{b.bookingCode}</div>
                      <div className="text-gray-600">Amount: ${b.totalAmount} • Passengers: {b.passengerCount}</div>
                      <div className="text-gray-500">Created: {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'N/A'}</div>
                    </div>
                    {b.status === 'PENDING' && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-xs">
                        Awaiting Review
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <textarea
                      placeholder="Notes for approval/rejection..."
                      value={notesMap[b.id] || ''}
                      onChange={(e) => setNotesMap(prev => ({ ...prev, [b.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(b.id)}
                        disabled={approveLoading}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(b.id)}
                        disabled={rejectLoading}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No pending bookings for approval</p>
            </div>
          )}
        </div>

        {/* Refund Requests */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Refund Requests ({refundData?.content?.length || 0})
          </h2>
          {refundLoading ? (
            <div className="text-sm text-gray-500">Loading refund requests...</div>
          ) : refundData && refundData.content && refundData.content.length > 0 ? (
            <div className="space-y-4">
              {refundData.content.map((b) => (
                <div key={b.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="text-sm space-y-1">
                      <div className="font-medium">{b.bookingCode}</div>
                      <div className="text-gray-600">Paid: ${b.totalAmount} • Passengers: {b.passengerCount}</div>
                      <div className="text-gray-500">Requested: {b.refundRequestedAt ? new Date(b.refundRequestedAt).toLocaleString() : 'N/A'}</div>
                      {b.cancellationReason && (
                        <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs">
                          <strong>Reason:</strong> {b.cancellationReason}
                        </div>
                      )}
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs">
                      Refund Due
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Refund amount"
                        value={refundMap[b.id]?.amount || ''}
                        onChange={(e) => setRefundMap(prev => ({ 
                          ...prev, 
                          [b.id]: { ...prev[b.id], amount: e.target.value } 
                        }))}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        max={b.totalAmount}
                        min="0"
                        step="0.01"
                      />
                      <span className="px-3 py-2 border border-gray-200 rounded-md text-sm bg-gray-50 flex items-center">
                        Max: ${b.totalAmount}
                      </span>
                    </div>
                    <textarea
                      placeholder="Refund processing notes..."
                      value={refundMap[b.id]?.notes || ''}
                      onChange={(e) => setRefundMap(prev => ({ 
                        ...prev, 
                        [b.id]: { ...prev[b.id], notes: e.target.value } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                    <button
                      onClick={() => handleProcessRefund(b.id)}
                      disabled={processLoading}
                      className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Process Refund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No refund requests pending</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinanceChart />
        </div>
        <div className="space-y-6">
          <EventCalendar />
          <Announcements />
        </div>
      </div>
    </div>
  );
}

export default function AccountantPage() {
  return (
    <RoleProtected allowedRoles={['ACCOUNTANT']}>
      <AccountantContent />
    </RoleProtected>
  );
}