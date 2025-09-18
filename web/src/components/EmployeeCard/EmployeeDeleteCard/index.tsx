"use client";

import React, { useState } from 'react';
import { X, AlertTriangle, User, Trash2 } from 'lucide-react';
import { useDeleteEmployee } from '@/hooks/useApi';

interface Employee {
  employeeId: number | null | undefined;
  employeeCode: string;
  accountId: number;
  position?: string;
  hireDate: string;
  salary: number;
  isActive: boolean;
  account?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

interface EmployeeDeleteModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeDeleteModal: React.FC<EmployeeDeleteModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  
  const { deleteEmployee, loading } = useDeleteEmployee();

  if (!isOpen) return null;

  const employeeName = employee.account?.firstName && employee.account?.lastName 
    ? `${employee.account.firstName} ${employee.account.lastName}`
    : employee.employeeCode;

  const requiredConfirmText = employee.employeeCode;
  const isConfirmValid = confirmText === requiredConfirmText;

  const handleDelete = async () => {
    if (!isConfirmValid) {
      setError('Please type the employee code exactly as shown to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    setError('');
    
    try {
      if (!employee.employeeId) {
        throw new Error('Employee ID is required');
      }
      await deleteEmployee(employee.employeeId);
      onSuccess();
      onClose();
      // Reset state
      setConfirmText('');
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete employee');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Delete Employee</h2>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Employee Info */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{employeeName}</p>
                  <p className="text-sm text-gray-600">
                    Code: {employee.employeeCode} | Position: {employee.position || 'Not assigned'}
                  </p>
                </div>
              </div>
            </div>

            {/* Warning Text */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-2">Warning: This will permanently delete the employee</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>The employee will be deactivated in the system</li>
                    <li>Their user account will be blocked in Keycloak</li>
                    <li>They will no longer be able to access the system</li>
                    <li>This action cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To confirm deletion, type the employee code: <span className="font-mono bg-gray-100 px-1 rounded">{requiredConfirmText}</span>
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${requiredConfirmText}" to confirm`}
                aria-label="Confirmation text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 ${
                  error && !isConfirmValid ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting || loading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isDeleting || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Employee</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDeleteModal; 