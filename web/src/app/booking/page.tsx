"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ScheduleBookingForm from '@/components/booking/ScheduleBookingForm';
import { CheckCircle } from 'lucide-react';
import { BookingResult } from '@/types/booking';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { useGetRole } from '@/hooks/useGetRole';
import BookingStatusBadge from '@/components/workflow/BookingStatusBadge';

export default function ScheduleBookingPage() {
  const router = useRouter();
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const userRole = useGetRole();
  const breadcrumbItems = generateBreadcrumbs("/booking", undefined, userRole);

  const handleBookingSuccess = (result: BookingResult) => {
    setBookingResult(result);
    setBookingSuccess(true);
    setBookingError(null);
    router.push(`/${userRole.toLowerCase()}`);
  };

  const handleBookingError = (error: string) => {
    console.error('Booking error:', error);
    setBookingError(error);
    setBookingSuccess(false);
  };

  if (bookingSuccess && bookingResult) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Booking Submitted!
            </h1>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Booking Details
              </h2>
              
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Booking Code:</span>
                  <span className="font-semibold">{bookingResult.bookingCode}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <BookingStatusBadge status={bookingResult.status || 'PENDING'} />
                </div>
                
                {bookingResult.route && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Route:</span>
                    <span className="font-semibold">{bookingResult.route}</span>
                  </div>
                )}
                
                {bookingResult.departureTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Departure:</span>
                    <span className="font-semibold">
                      {new Date(bookingResult.departureTime).toLocaleString()}
                    </span>
                  </div>
                )}
                
                {bookingResult.totalAmount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount:</span>
                    <span className="font-semibold">${bookingResult.totalAmount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Your booking is being reviewed by our accountant team</p>
                <p>• You will receive an email notification once approved</p>
                <p>• After approval, you will have 24 hours to complete payment</p>
                <p>• Track your booking status in your dashboard</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setBookingSuccess(false);
                  setBookingResult(null);
                }}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
              >
                Book Another Trip
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <BreadcrumbComponent items={breadcrumbItems} />
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            RoRo Vehicle Ferry Booking
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Professional roll-on/roll-off ferry service for vehicle transportation
          </p>
        </div>

        {/* Error Display */}
        {bookingError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Booking Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {bookingError}
                </div>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setBookingError(null)}
                    className="text-sm font-medium text-red-800 hover:text-red-600"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ScheduleBookingForm
          onSuccess={handleBookingSuccess}
          onError={handleBookingError}
        />
      </div>
    </div>
  );
}
