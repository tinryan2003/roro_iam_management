/**
 * Async progress indicator for booking operations
 * Shows real-time progress of async booking creation and updates
 */

'use client';

import React from 'react';
import { CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  description?: string;
  timestamp?: string;
}

interface AsyncProgressProps {
  steps: ProgressStep[];
  title?: string;
  showTimestamps?: boolean;
  compact?: boolean;
}

export default function AsyncProgress({ 
  steps, 
  title = 'Processing...',
  showTimestamps = false,
  compact = false 
}: AsyncProgressProps) {
  const getStepIcon = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    switch (step.status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'active':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-white border rounded-lg">
        <div className="flex items-center space-x-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {getStepIcon(step)}
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {steps.find(s => s.status === 'active')?.label || title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">
          Step {steps.findIndex(s => s.status === 'active') + 1} of {steps.length}
        </p>
      </div>
      
      <div className="p-4 space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-4">
            <div className="flex-shrink-0 mt-1">
              {getStepIcon(step)}
            </div>
            
            <div className="flex-1">
              <div className={`p-3 rounded-lg border ${getStepColor(step)}`}>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">{step.label}</h4>
                  {showTimestamps && step.timestamp && (
                    <span className="text-xs opacity-75">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                
                {step.description && (
                  <p className="text-xs mt-1 opacity-75">{step.description}</p>
                )}
                
                {step.status === 'active' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full animate-pulse w-3/5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Connection line */}
            {index < steps.length - 1 && (
              <div className="absolute left-6 mt-8 w-0.5 h-6 bg-gray-200" />
            )}
          </div>
        ))}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {steps.filter(s => s.status === 'completed').length} of {steps.length} completed
          </span>
          
          {steps.some(s => s.status === 'error') && (
            <span className="text-red-600 font-medium">
              Error occurred - please try again
            </span>
          )}
          
          {steps.every(s => s.status === 'completed') && (
            <span className="text-green-600 font-medium">
              ✅ All steps completed successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
