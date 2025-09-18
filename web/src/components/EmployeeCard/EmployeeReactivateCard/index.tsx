"use client";

import React, { useState } from 'react';
import { useReactivateEmployee } from '@/hooks/useApi';
import { RotateCcw, X } from 'lucide-react';

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
  fullName?: string;
  displayPosition?: string;
  createdAt?: string;
  updatedAt?: string;
  account?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    username?: string;
  };
}

interface EmployeeReactivateModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeReactivateModal: React.FC<EmployeeReactivateModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isReactivating, setIsReactivating] = useState(false);
  const [error, setError] = useState('');
  
  const { reactivateEmployee, loading } = useReactivateEmployee();

  if (!isOpen) return null;

  const employeeName = employee.account?.firstName && employee.account?.lastName 
    ? `${employee.account.firstName} ${employee.account.lastName}`
    : employee.employeeCode;

  const handleReactivate = async () => {
    setIsReactivating(true);
    setError('');
    
    try {
      if (!employee.employeeId) {
        throw new Error('Employee ID is required');
      }
      await reactivateEmployee(employee.employeeId);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error reactivating employee:', error);
      setError(error instanceof Error ? error.message : 'Failed to reactivate employee');
    } finally {
      setIsReactivating(false);
    }
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Reactivate Employee
              </h3>
              <p className="text-sm text-gray-500">
                Reactivate {employeeName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close modal"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <RotateCcw className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Reactivation Details
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>This will:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1">
                      <li>Set the employee status to active</li>
                      <li>Enable their account in Keycloak</li>
                      <li>Allow them to log in and access the system</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Employee Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Employee Code:</span>
                  <p className="font-medium text-gray-900">{employee.employeeCode}</p>
                </div>
                <div>
                  <span className="text-gray-500">Position:</span>
                  <p className="font-medium text-gray-900">{employee.position || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium text-gray-900">{employee.account?.email || employee.email || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="font-medium text-red-600">Inactive</p>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-700">
                  {error}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={isReactivating}
          >
            Cancel
          </button>
          <button
            onClick={handleReactivate}
            disabled={isReactivating || loading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isReactivating || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Reactivating...</span>
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Reactivate Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeReactivateModal;