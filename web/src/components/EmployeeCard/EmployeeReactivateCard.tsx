"use client";

import React from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface Employee {
  employeeId: number | null | undefined;
  employeeCode: string;
  accountId: number;
  position?: string;
  hireDate: string;
  salary: number;
  isActive: boolean;

  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  fullName?: string;
  displayPosition?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeReactivateModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isLoading?: boolean;
}

const EmployeeReactivateModal: React.FC<EmployeeReactivateModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess,
  isLoading = false
}) => {
  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <RotateCcw className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Reactivate Employee
              </h3>
              <p className="text-sm text-gray-500">
                Confirm employee reactivation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-900 mb-2">
                Are you sure you want to reactivate this employee?
              </p>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Employee Code:</span>
                  <span className="text-sm text-gray-900">{employee.employeeCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm text-gray-900">{employee.fullName || `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <span className="text-sm text-gray-900">{employee.position || employee.displayPosition || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-500">Current Status:</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inactive
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                ⚠️ This action will make the employee active again and they will be able to access the system.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSuccess}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <RotateCcw className="h-4 w-4" />
            <span>{isLoading ? 'Reactivating...' : 'Reactivate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReactivateModal;
