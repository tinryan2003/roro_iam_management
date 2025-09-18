"use client";

import React from 'react';
import Link from 'next/link';
import { useGetRole } from '@/hooks/useGetRole';
import { usePendingBookings, useAwaitingPaymentBookings, useInProgressBookings, useInReviewBookings, useRefundRequests } from '@/hooks/useApi';

interface WorkflowNavLinkProps {
  href: string;
  icon: string;
  title: string;
  description: string;
  badge?: number;
  badgeColor?: string;
}

function WorkflowNavLink({ href, icon, title, description, badge, badgeColor = 'bg-blue-500' }: WorkflowNavLinkProps) {
  return (
    <Link href={href}>
      <div className="group relative bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
              {title}
            </h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          {badge !== undefined && badge > 0 && (
            <div className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${badgeColor}`}>
              {badge}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function WorkflowNavigation() {
  const userRole = useGetRole();

  // Fetch counts for badges (only for roles that need them)
  const { data: pendingData } = usePendingBookings(0, 1);
  const { data: paymentData } = useAwaitingPaymentBookings(0, 1);
  const { data: progressData } = useInProgressBookings(0, 1);
  const { data: reviewData } = useInReviewBookings(0, 1);
  const { data: refundData } = useRefundRequests(0, 1);

  const pendingCount = pendingData?.totalElements || 0;
  const paymentCount = paymentData?.totalElements || 0;
  const progressCount = progressData?.totalElements || 0;
  const reviewCount = reviewData?.totalElements || 0;
  const refundCount = refundData?.totalElements || 0;

  if (!userRole) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Workflow Management</h3>
      
      <div className="grid gap-4">
        {/* Accountant Links */}
        {userRole === 'ACCOUNTANT' && (
          <>
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="⏳"
              title="Pending Approvals"
              description="Review and approve new bookings"
              badge={pendingCount}
              badgeColor="bg-yellow-500"
            />
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="↩️"
              title="Refund Requests"
              description="Process cancellation refunds"
              badge={refundCount}
              badgeColor="bg-purple-500"
            />
          </>
        )}

        {/* Customer Links */}
        {userRole === 'CUSTOMER' && (
          <>
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="💳"
              title="Pending Payments"
              description="Complete payment for approved bookings"
              badge={paymentCount}
              badgeColor="bg-orange-500"
            />
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="🚢"
              title="My Bookings"
              description="Track and manage your bookings"
            />
          </>
        )}

        {/* Planner Links */}
        {userRole === 'PLANNER' && (
          <>
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="🔍"
              title="Pending Reviews"
              description="Review paid bookings and approve for operations"
              badge={reviewCount}
              badgeColor="bg-purple-500"
            />
            <WorkflowNavLink
              href="/dashboard/workflow"
              icon="🚢"
              title="Active Bookings"
              description="Monitor in-progress bookings"
              badge={progressCount}
              badgeColor="bg-blue-500"
            />
          </>
        )}

        {/* Operation Manager Links */}
        {userRole === 'OPERATION_MANAGER' && (
          <WorkflowNavLink
            href="/dashboard/workflow"
            icon="🚢"
            title="Active Bookings"
            description="Confirm arrivals and manage operations"
            badge={progressCount}
            badgeColor="bg-blue-500"
          />
        )}

        {/* Admin Links */}
        {userRole === 'ADMIN' && (
          <WorkflowNavLink
            href="/dashboard/workflow"
            icon="📊"
            title="Workflow Dashboard"
            description="View all workflow operations"
          />
        )}

        {/* Universal Booking Link */}
        <WorkflowNavLink
          href="/booking"
          icon="➕"
          title="Create New Booking"
          description="Book a new ferry trip"
          badgeColor="bg-green-500"
        />
      </div>
    </div>
  );
}
