"use client";

import React from 'react';
import { useGetRole } from '@/hooks/useGetRole';
import AccountantDashboard from '@/components/workflow/AccountantDashboard';
import CustomerDashboard from '@/components/workflow/CustomerDashboard';
import OperationDashboard from '@/components/workflow/OperationDashboard';
import PlannerDashboard from '@/components/workflow/PlannerDashboard';

export default function WorkflowDashboardPage() {
  const userRole = useGetRole();

  // Show loading while determining user role
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Render appropriate dashboard based on user role
  switch (userRole) {
    case 'ACCOUNTANT':
      return <AccountantDashboard />;
      
    case 'CUSTOMER':
      return <CustomerDashboard />;
      
    case 'PLANNER':
      return <PlannerDashboard />;
      
    case 'OPERATION_MANAGER':
      return <OperationDashboard />;
      
    case 'ADMIN':
      // Admins can view all dashboards - show a selector
      return <AdminWorkflowSelector />;
      
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don&apos;t have access to the workflow dashboard.</p>
            <p className="text-sm text-gray-500 mt-2">Role: {userRole}</p>
          </div>
        </div>
      );
  }
}

// Admin selector component
function AdminWorkflowSelector() {
  const [selectedView, setSelectedView] = React.useState<'accountant' | 'customer' | 'planner' | 'operation'>('accountant');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Workflow Dashboard</h1>
        <p className="text-gray-600">View workflow dashboards for different roles</p>
      </div>

      {/* Role Selector */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedView('accountant')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedView === 'accountant'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Accountant View
          </button>
          <button
            onClick={() => setSelectedView('planner')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedView === 'planner'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Planner View
          </button>
          <button
            onClick={() => setSelectedView('operation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedView === 'operation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Operations View
          </button>
          <button
            onClick={() => setSelectedView('customer')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedView === 'customer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Customer View
          </button>
        </nav>
      </div>

      {/* Dashboard Content */}
      {selectedView === 'accountant' && <AccountantDashboard />}
      {selectedView === 'planner' && <PlannerDashboard />}
      {selectedView === 'operation' && <OperationDashboard />}
      {selectedView === 'customer' && <CustomerDashboard />}
    </div>
  );
}
