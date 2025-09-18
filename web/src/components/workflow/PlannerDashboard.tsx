"use client";

import React, { useState } from 'react';
import {
  useInReviewBookings,
  useInProgressBookings,
  useApproveReview,
  useConfirmArrival
} from '@/hooks/useApi';
import BookingWorkflowCard from './BookingWorkflowCard';

export default function PlannerDashboard() {
  const [activeTab, setActiveTab] = useState<'review' | 'progress'>('review');
  const [reviewPage, setReviewPage] = useState(0);
  const [progressPage, setProgressPage] = useState(0);

  // API hooks
  const { data: reviewData, loading: reviewLoading, refetch: refetchReview } = useInReviewBookings(reviewPage, 10);
  const { data: progressData, loading: progressLoading, refetch: refetchProgress } = useInProgressBookings(progressPage, 10);
  
  const { approveReview, loading: approveLoading } = useApproveReview();
  const { confirmArrival, loading: confirmLoading } = useConfirmArrival();

  const reviewBookings = reviewData?.content || [];
  const progressBookings = progressData?.content || [];
  const totalReview = reviewData?.totalElements || 0;
  const totalProgress = progressData?.totalElements || 0;

  const handleApproveReview = async (bookingId: number, notes: string) => {
    try {
      await approveReview(bookingId, notes);
      refetchReview();
      refetchProgress(); // Refresh both since booking moves from review to progress
    } catch (error) {
      console.error('Failed to approve review:', error);
    }
  };

  const handleConfirmArrival = async (bookingId: number) => {
    try {
      await confirmArrival(bookingId);
      refetchProgress();
    } catch (error) {
      console.error('Failed to confirm arrival:', error);
    }
  };

  const isLoading = approveLoading || confirmLoading;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Planner/Operation Dashboard</h1>
        <p className="text-gray-600">Manage booking reviews and operations</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🔍</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{totalReview}</p>
              <p className="text-xs text-gray-500">Auto-progress in 30 min if no action</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">🚢</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{totalProgress}</p>
              <p className="text-xs text-gray-500">Awaiting arrival confirmation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('review')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'review'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending Reviews ({totalReview})
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            In Progress ({totalProgress})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'review' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pending Reviews</h2>
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Auto-Progress Information
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Bookings in review will automatically move to &quot;In Progress&quot; after 30 minutes if no action is taken.</p>
                </div>
              </div>
            </div>
          </div>
          
          {reviewLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : reviewBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔍</div>
              <p className="text-gray-600">No bookings pending review</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {reviewBookings.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="PLANNER"
                    onApproveReview={handleApproveReview}
                    loading={isLoading}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalReview > 10 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setReviewPage(Math.max(0, reviewPage - 1))}
                      disabled={reviewPage === 0}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {reviewPage + 1} of {Math.ceil(totalReview / 10)}
                    </span>
                    <button
                      onClick={() => setReviewPage(reviewPage + 1)}
                      disabled={(reviewPage + 1) * 10 >= totalReview}
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

      {activeTab === 'progress' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">In Progress Bookings</h2>
          
          {progressLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : progressBookings.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🚢</div>
              <p className="text-gray-600">No bookings in progress</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {progressBookings.map((booking) => (
                  <BookingWorkflowCard
                    key={booking.id}
                    booking={booking}
                    userRole="OPERATION_MANAGER"
                    onConfirmArrival={handleConfirmArrival}
                    loading={isLoading}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalProgress > 10 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => setProgressPage(Math.max(0, progressPage - 1))}
                      disabled={progressPage === 0}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm text-gray-700">
                      Page {progressPage + 1} of {Math.ceil(totalProgress / 10)}
                    </span>
                    <button
                      onClick={() => setProgressPage(progressPage + 1)}
                      disabled={(progressPage + 1) * 10 >= totalProgress}
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
