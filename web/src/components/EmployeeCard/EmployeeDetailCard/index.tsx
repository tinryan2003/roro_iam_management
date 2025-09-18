"use client";

import React, { useState } from 'react';
import { X, User, Calendar, DollarSign, Badge, Building2, Phone, Mail, Edit2, Trash2 } from 'lucide-react';

interface Employee {
  employeeId: number | null | undefined;
  employeeCode: string;
  accountId: number;
  position?: string;
  hireDate: string;
  salary: number;
  isActive: boolean;
  // Additional fields from backend EmployeeResponse
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  fullName?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  displayPosition?: string;
  createdAt?: string;
  updatedAt?: string;
  // Account details (if available)
  account?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    username?: string;
    dateOfBirth?: string;
  };
}

interface EmployeeDetailModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  isOpen,
  onClose,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
  };

  const calculateTenure = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - hire.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? `, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  const handleEdit = () => {
    onEdit?.(employee);
    onClose();
  };

  const handleDeleteConfirm = () => {
    onDelete?.(employee);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Use employee data with fallbacks for missing information
  const displayName = employee.fullName || 
    (employee.firstName && employee.lastName ? `${employee.firstName} ${employee.lastName}` : '') ||
    (employee.account?.firstName && employee.account?.lastName ? `${employee.account.firstName} ${employee.account.lastName}` : '') ||
    employee.username ||
    employee.account?.username ||
    'Name not available';

  const displayEmail = employee.email || employee.account?.email || 'Not available';
  const displayPhone = employee.phoneNumber || employee.account?.phoneNumber || 'Not available';
  const displayUsername = employee.username || employee.account?.username || 'Not available';
  const displayDateOfBirth = employee.dateOfBirth || employee.account?.dateOfBirth || null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Employee Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Detailed information for {employee.employeeCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            title="Close"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {/* Employee Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Badge className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Employee Code</p>
                    <p className="text-base text-gray-900 font-medium">{employee.employeeCode}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-base text-gray-900 font-medium">{displayName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Position</p>
                    <p className="text-base text-gray-900 font-medium">{employee.position || 'Not assigned'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className={`w-5 h-5 rounded-full mt-0.5 flex-shrink-0 ${employee.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <p className={`text-base font-medium ${employee.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <p className="text-base text-gray-900 font-medium break-all">{displayEmail}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Phone Number</p>
                    <p className="text-base text-gray-900 font-medium">{displayPhone}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-600">Username</p>
                    <p className="text-base text-gray-900 font-medium">{displayUsername}</p>
                  </div>
                </div>

                {displayDateOfBirth && (
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-600">Date of Birth</p>
                      <p className="text-base text-gray-900 font-medium">{formatDate(displayDateOfBirth)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-6">
              Employment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Hire Date</p>
                  <p className="text-base text-gray-900 font-medium">{formatDate(employee.hireDate)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <DollarSign className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Salary</p>
                  <p className="text-base text-gray-900 font-medium">{formatSalary(employee.salary)}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-600">Tenure</p>
                  <p className="text-base text-gray-900 font-medium">{calculateTenure(employee.hireDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-6">
              System Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Employee ID</p>
                <p className="text-base text-gray-900 font-medium">{employee.employeeId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Account ID</p>
                <p className="text-base text-gray-900 font-medium">{employee.accountId}</p>
              </div>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Trash2 className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3 w-0 flex-1">
                  <h3 className="text-sm font-medium text-red-800">Delete Employee</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Are you sure you want to delete this employee? This action cannot be undone.</p>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDeleteConfirm}
                      className="bg-red-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteCancel}
                      className="bg-white text-gray-700 px-3 py-2 text-sm font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal; 