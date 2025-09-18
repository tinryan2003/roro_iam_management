"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Ship, 
  Users, 
  CreditCard, 
  Clock, 
  FileText, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Car
} from 'lucide-react';
import BookingStatusBadge from '@/components/workflow/BookingStatusBadge';
import BookingWorkflowCard from '@/components/workflow/BookingWorkflowCard';
import { BookingData } from '@/hooks/useApi';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { useGetRole } from '@/hooks/useGetRole';

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = useGetRole();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const bookingId = params?.id as string;

  // Generate breadcrumbs
  const breadcrumbItems = generateBreadcrumbs(`/booking/${bookingId}`, undefined, userRole);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) {
      setError('Booking ID is required');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      let token = '';

      // Get token based on user role
      if (session?.accessToken) {
        token = session.accessToken;
      } else if (typeof window !== 'undefined') {
        const customerToken = localStorage.getItem('customerToken');
        if (customerToken) {
          token = customerToken;
        }
      }

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        throw new Error('Unauthorized - please log in again');
      }

      if (response.status === 403) {
        throw new Error('Access denied - you do not have permission to view this booking');
      }

      if (response.status === 404) {
        throw new Error('Booking not found');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch booking details (${response.status})`);
      }

      const bookingData = await response.json();
      setBooking(bookingData);
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load booking details');
    } finally {
      setLoading(false);
    }
  }, [bookingId, session?.accessToken]);

  useEffect(() => {
    fetchBookingDetails();
  }, [fetchBookingDetails]);

  const handleWorkflowAction = async (action: string, bookingId: number, ...args: unknown[]) => {
    setWorkflowLoading(true);
    try {
      // Implement workflow actions here
      console.log(`Performing ${action} on booking ${bookingId}`, args);
      
      // For now, just refresh the booking details
      await fetchBookingDetails();
    } catch (err) {
      console.error(`Error performing ${action}:`, err);
    } finally {
      setWorkflowLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '$0.00';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbComponent items={breadcrumbItems} />
          
          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Booking</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={fetchBookingDetails}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.back()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800">Booking Not Found</h2>
            <p className="text-gray-600 mt-2">The requested booking could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50"
              title="Go back to previous page"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600 mt-1">Booking #{booking.bookingCode}</p>
            </div>
          </div>
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Booking Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Booking Code</label>
                    <p className="text-lg font-semibold text-gray-900">{booking.bookingCode}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer ID</label>
                    <p className="text-gray-900">{booking.customerId}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Passengers</label>
                    <p className="text-gray-900 flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {booking.passengerCount} passenger{booking.passengerCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Amount</label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(booking.totalAmount)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route ID</label>
                    <p className="text-gray-900 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Route {booking.routeId}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ferry ID</label>
                    <p className="text-gray-900 flex items-center">
                      <Ship className="h-4 w-4 mr-1" />
                      Ferry {booking.ferryId}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vehicle</label>
                    <p className="text-gray-900 flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      {booking.vehicles && booking.vehicles.length > 0 
                        ? `${booking.vehicles.length} vehicle${booking.vehicles.length !== 1 ? 's' : ''}`
                        : Array.isArray(booking.vehicleId) && booking.vehicleId.length > 0 
                          ? `${booking.vehicleId.length} vehicle${booking.vehicleId.length !== 1 ? 's' : ''}`
                          : booking.vehicleId 
                            ? `Vehicle ${booking.vehicleId}`
                            : 'No vehicle'
                      }
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Departure Time</label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDate(booking.departureTime)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            {booking.vehicles && booking.vehicles.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Car className="h-5 w-5 mr-2" />
                  Vehicle Details
                </h2>
                
                <div className="space-y-4">
                  {booking.vehicles.map((vehicle, index) => (
                    <div key={vehicle.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Vehicle {index + 1}</label>
                          <p className="text-gray-900 font-medium">{vehicle.vehicleType}</p>
                          <p className="text-sm text-gray-600">{vehicle.make} {vehicle.model}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Quantity</label>
                          <p className="text-gray-900">{vehicle.quantity}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Price</label>
                          <p className="text-gray-900">{vehicle.price ? formatCurrency(vehicle.price) : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Booking Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Booking Timeline
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">Booking Created</p>
                    <p className="text-sm text-gray-500">{formatDate(booking.createdAt)}</p>
                  </div>
                </div>
                
                {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Last Updated</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.updatedAt)}</p>
                    </div>
                  </div>
                )}
                
                {booking.approvedAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Approved</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.approvedAt)}</p>
                      {booking.approvedBy && (
                        <p className="text-xs text-gray-400">by {booking.approvedBy}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {booking.paidAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Payment Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.paidAt)}</p>
                    </div>
                  </div>
                )}
                
                {booking.completedAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Trip Completed</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.completedAt)}</p>
                    </div>
                  </div>
                )}
                
                {booking.cancelledAt && (
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Booking Cancelled</p>
                      <p className="text-sm text-gray-500">{formatDate(booking.cancelledAt)}</p>
                      {booking.cancellationReason && (
                        <p className="text-xs text-gray-400">Reason: {booking.cancellationReason}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workflow Actions */}
            <BookingWorkflowCard
              booking={booking}
              userRole={userRole}
              loading={workflowLoading}
              onApprove={(id, notes) => handleWorkflowAction('approve', id, notes)}
              onReject={(id, reason) => handleWorkflowAction('reject', id, reason)}
              onPay={(id) => handleWorkflowAction('pay', id)}
              onComplete={(id) => handleWorkflowAction('complete', id)}
              onCancel={(id, reason) => handleWorkflowAction('cancel', id, reason)}
              onConfirmArrival={(id) => handleWorkflowAction('confirmArrival', id)}
              onApproveReview={(id, notes) => handleWorkflowAction('approveReview', id, notes)}
              onProcessRefund={(id, amount, notes) => handleWorkflowAction('processRefund', id, amount, notes)}
            />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={fetchBookingDetails}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Details
                </button>
                
                <button
                  onClick={() => window.print()}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Print Booking
                </button>
              </div>
            </div>

            {/* Additional Notes */}
            {booking.note && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-gray-700 text-sm">{booking.note}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}