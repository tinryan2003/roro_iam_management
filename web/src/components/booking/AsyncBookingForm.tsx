/**
 * Enhanced async booking form with progress tracking and real-time updates
 */

'use client';

import React, { useState } from 'react';
import { useAsyncBookingCreation } from '@/hooks/useAsyncApi';
import AsyncProgress, { ProgressStep } from '@/components/async/AsyncProgress';
import { BookingCreatePayload } from '@/hooks/useApi';
import { BookingResult } from '@/types/booking';

interface AsyncBookingFormProps {
  initialData?: Partial<BookingCreatePayload>;
  onSuccess?: (result: BookingResult) => void;
  onError?: (error: string) => void;
}

export default function AsyncBookingForm({ 
  initialData, 
  onSuccess, 
  onError 
}: AsyncBookingFormProps) {
  const { createBooking, loading, error, isOptimistic } = useAsyncBookingCreation({
    enableOptimisticUpdates: true,
    retryAttempts: 3
  });

  const [progressSteps, setProgressSteps] = useState<ProgressStep[]>([
    {
      id: 'validation',
      label: 'Validating booking details',
      status: 'pending',
      description: 'Checking schedule availability and passenger capacity'
    },
    {
      id: 'creation',
      label: 'Creating booking record',
      status: 'pending',
      description: 'Generating booking code and reserving spaces'
    },
    {
      id: 'notification',
      label: 'Sending notifications',
      status: 'pending',
      description: 'Notifying accountants for approval (async)'
    },
    {
      id: 'completion',
      label: 'Booking confirmed',
      status: 'pending',
      description: 'Ready for accountant review and approval'
    }
  ]);

  const [formData, setFormData] = useState<BookingCreatePayload>({
    customerId: 1,
    scheduleId: 1,
    passengerCount: 1,
    totalAmount: 100,
    ...initialData
  });

  const updateProgressStep = (stepId: string, status: ProgressStep['status'], description?: string) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            status, 
            description: description || step.description,
            timestamp: new Date().toISOString()
          }
        : step
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Reset progress
      setProgressSteps(prev => prev.map(step => ({ 
        ...step, 
        status: 'pending' as const,
        timestamp: undefined 
      })));

      const result = await createBooking(formData, (stage: string) => {
        // Update progress based on stage
        if (stage.includes('Validating')) {
          updateProgressStep('validation', 'active');
        } else if (stage.includes('Creating')) {
          updateProgressStep('validation', 'completed');
          updateProgressStep('creation', 'active');
        } else if (stage.includes('Submitting')) {
          updateProgressStep('creation', 'completed');
          updateProgressStep('notification', 'active');
        } else if (stage.includes('successfully')) {
          updateProgressStep('notification', 'completed');
          updateProgressStep('completion', 'completed');
        }
      });

      // Mark all as completed
      setProgressSteps(prev => prev.map(step => ({ 
        ...step, 
        status: 'completed' as const,
        timestamp: new Date().toISOString()
      })));

      onSuccess?.(result as unknown as BookingResult);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Mark current active step as error
      setProgressSteps(prev => prev.map(step => 
        step.status === 'active' 
          ? { ...step, status: 'error' as const, description: errorMessage }
          : step
      ));
      
      onError?.(errorMessage);
    }
  };

  const handleInputChange = (field: keyof BookingCreatePayload, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Async Ferry Booking
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule ID
              </label>
              <input
                type="number"
                value={formData.scheduleId}
                onChange={(e) => handleInputChange('scheduleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter schedule ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passenger Count
              </label>
              <input
                type="number"
                min="1"
                value={formData.passengerCount}
                onChange={(e) => handleInputChange('passengerCount', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Number of passengers"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => handleInputChange('totalAmount', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle ID (Optional)
              </label>
              <input
                type="number"
                value={formData.vehicleId || ''}
                onChange={(e) => handleInputChange('vehicleId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional vehicle ID"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {loading ? 'Creating Booking...' : 'Create Async Booking'}
          </button>
        </form>

        {/* Optimistic Update Indicator */}
        {isOptimistic && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              ⚡ <strong>Optimistic Update:</strong> Your booking appears created while we process it in the background.
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700">
              ❌ <strong>Error:</strong> {error}
            </p>
          </div>
        )}
      </div>

      {/* Progress Tracker */}
      {(loading || progressSteps.some(s => s.status !== 'pending')) && (
        <AsyncProgress
          steps={progressSteps}
          title="Booking Creation Progress"
          showTimestamps={true}
        />
      )}

      {/* Real-time Status */}
      <div className="bg-gray-50 border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Real-time Async Benefits
        </h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• ⚡ <strong>Immediate Response:</strong> Form submission returns instantly</p>
          <p>• 🔄 <strong>Background Processing:</strong> Notifications sent asynchronously</p>
          <p>• 📱 <strong>Real-time Updates:</strong> Receive status changes via WebSocket</p>
          <p>• 🔁 <strong>Auto-retry:</strong> Failed operations retry automatically</p>
          <p>• 👀 <strong>Optimistic Updates:</strong> See changes before server confirms</p>
        </div>
      </div>
    </div>
  );
}
