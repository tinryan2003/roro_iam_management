"use client";

import React from 'react';

interface BookingStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig = {
  PENDING: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '⏳'
  },
  CONFIRMED: {
    label: 'Confirmed', 
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  REJECTED: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800', 
    icon: '❌'
  },
  WAITING_FOR_PAYMENT: {
    label: 'Awaiting Payment',
    color: 'bg-orange-100 text-orange-800',
    icon: '💳'
  },
  PAID: {
    label: 'Paid',
    color: 'bg-blue-100 text-blue-800',
    icon: '💰'
  },
  IN_REVIEW: {
    label: 'Under Review',
    color: 'bg-purple-100 text-purple-800',
    icon: '🔍'
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: 'bg-indigo-100 text-indigo-800',
    icon: '🚢'
  },
  COMPLETED: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: '🎉'
  },
  CANCELLED: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800',
    icon: '🚫'
  },
  IN_REFUND: {
    label: 'Processing Refund',
    color: 'bg-purple-100 text-purple-800',
    icon: '↩️'
  },
  REFUNDED: {
    label: 'Refunded',
    color: 'bg-teal-100 text-teal-800',
    icon: '💸'
  }
};

export default function BookingStatusBadge({ status, className = '' }: BookingStatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: 'bg-gray-100 text-gray-800',
    icon: '❓'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color} ${className}`}>
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </span>
  );
}

// Helper function to get next action for a booking
export function getNextAction(status: string, userRole?: string): { action: string; description: string } | null {
  switch (status) {
    case 'PENDING':
      if (userRole === 'ACCOUNTANT') {
        return { action: 'REVIEW', description: 'Review and approve/reject this booking' };
      }
      return { action: 'WAITING', description: 'Waiting for accountant approval' };
      
    case 'CONFIRMED':
      return { action: 'PAYMENT', description: 'Payment invoice sent to customer' };
      
    case 'WAITING_FOR_PAYMENT':
      if (userRole === 'CUSTOMER') {
        return { action: 'PAY', description: 'Pay for this booking to proceed' };
      }
      return { action: 'WAITING', description: 'Waiting for customer payment' };
      
    case 'PAID':
      return { action: 'PROCESSING', description: 'Moved to review for planner and operation team' };
      
    case 'IN_REVIEW':
      if (userRole === 'PLANNER' || userRole === 'OPERATION_MANAGER') {
        return { action: 'APPROVE_REVIEW', description: 'Review and approve to start progress' };
      }
      return { action: 'WAITING', description: 'Waiting for planner/operation manager review (auto-progress in 30 min)' };
      
    case 'IN_PROGRESS':
      if (userRole === 'OPERATION_MANAGER' || userRole === 'PLANNER') {
        return { action: 'CONFIRM_ARRIVAL', description: 'Confirm when customer arrives' };
      }
      if (userRole === 'CUSTOMER') {
        return { action: 'COMPLETE', description: 'Mark as completed when journey is done' };
      }
      return { action: 'ACTIVE', description: 'Booking is active and in progress' };
      
    case 'IN_REFUND':
      if (userRole === 'ACCOUNTANT') {
        return { action: 'PROCESS_REFUND', description: 'Process the refund for this booking' };
      }
      return { action: 'WAITING', description: 'Refund being processed by accountant' };
      
    default:
      return null;
  }
}

// Helper function to check if action is available for user
export function canPerformAction(status: string, action: string, userRole?: string): boolean {
  switch (action) {
    case 'APPROVE':
    case 'REJECT':
      return status === 'PENDING' && userRole === 'ACCOUNTANT';
      
    case 'PAY':
      return status === 'WAITING_FOR_PAYMENT' && userRole === 'CUSTOMER';
      
    case 'COMPLETE':
      return status === 'IN_PROGRESS' && userRole === 'CUSTOMER';
      
    case 'CANCEL':
      return !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(status);
      
    case 'APPROVE_REVIEW':
      return status === 'IN_REVIEW' && (userRole === 'PLANNER' || userRole === 'OPERATION_MANAGER');
      
    case 'CONFIRM_ARRIVAL':
      return status === 'IN_PROGRESS' && (userRole === 'OPERATION_MANAGER' || userRole === 'PLANNER');
      
    case 'PROCESS_REFUND':
      return status === 'IN_REFUND' && userRole === 'ACCOUNTANT';
      
    default:
      return false;
  }
}
