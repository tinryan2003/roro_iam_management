"use client";

import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Badge, Building2 } from 'lucide-react';
import { useUpdateEmployee } from '@/hooks/useApi';

interface Employee {
  employeeId: number | null | undefined;
  employeeCode: string;
  accountId: number;
  position?: string;
  hireDate: string;
  salary: number;
  isActive: boolean;
}

interface EmployeeEditModalProps {
  employee: Employee;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  employeeCode: string;
  position: string;
  hireDate: string;
  salary: number;
}

interface FormErrors {
  [key: string]: string;
}

const EmployeeEditModal: React.FC<EmployeeEditModalProps> = ({
  employee,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    employeeCode: '',
    position: '',
    hireDate: '',
    salary: 0
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { updateEmployee, loading } = useUpdateEmployee();

  // Position options
  const positionOptions = [
    { value: 'ADMIN', label: 'Administrator' },
    { value: 'OPERATOR', label: 'Ferry Operator' },
    { value: 'GUARD', label: 'Security Guard' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'MAINTENANCE', label: 'Maintenance Staff' },
  ];

  // Initialize form data when employee changes
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        employeeCode: employee.employeeCode,
        position: employee.position || '',
        hireDate: employee.hireDate.split('T')[0], // Convert to YYYY-MM-DD format
        salary: employee.salary
      });
      setErrors({});
    }
  }, [employee, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Employee code validation
    if (!formData.employeeCode.trim()) {
      newErrors.employeeCode = 'Employee code is required';
    } else if (formData.employeeCode.length < 3) {
      newErrors.employeeCode = 'Employee code must be at least 3 characters';
    }

    // Position validation
    if (!formData.position) {
      newErrors.position = 'Position is required';
    }

    // Hire date validation
    if (!formData.hireDate) {
      newErrors.hireDate = 'Hire date is required';
    } else if (new Date(formData.hireDate) > new Date()) {
      newErrors.hireDate = 'Hire date cannot be in the future';
    }

    // Salary validation
    if (!formData.salary || formData.salary <= 0) {
      newErrors.salary = 'Salary must be a positive number';
    } else if (formData.salary < 1000) {
      newErrors.salary = 'Salary must be at least $1,000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (!employee.employeeId) {
        throw new Error('Employee ID is required');
      }
      await updateEmployee(employee.employeeId, {
        employeeCode: formData.employeeCode,
        position: formData.position,
        hireDate: formData.hireDate,
        salary: formData.salary
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating employee:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Failed to update employee'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      employeeCode: employee.employeeCode,
      position: employee.position || '',
      hireDate: employee.hireDate.split('T')[0],
      salary: employee.salary
    });
    setErrors({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Employee</h2>
            <p className="text-sm text-gray-600 mt-1">
              Update employee information and employment details
            </p>
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
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">{errors.submit}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employee Code */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Badge className="w-4 h-4 text-blue-600" />
                  <span>Employee Code</span>
                </label>
                <input
                  type="text"
                  value={formData.employeeCode}
                  onChange={(e) => handleInputChange('employeeCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.employeeCode ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., ADM001"
                />
                {errors.employeeCode && (
                  <p className="text-red-500 text-xs mt-1">{errors.employeeCode}</p>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 text-green-600" />
                  <span>Position</span>
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  aria-label="Employee position"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.position ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select a position</option>
                  {positionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.position && (
                  <p className="text-red-500 text-xs mt-1">{errors.position}</p>
                )}
              </div>

              {/* Hire Date */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  <span>Hire Date</span>
                </label>
                <input
                  aria-label="Hire date"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.hireDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.hireDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.hireDate}</p>
                )}
              </div>

              {/* Salary */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span>Salary (USD)</span>
                </label>
                <input
                  type="number"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                  aria-label="Employee salary"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.salary ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="50000"
                  min="1000"
                  step="1000"
                />
                {errors.salary && (
                  <p className="text-red-500 text-xs mt-1">{errors.salary}</p>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end space-x-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting || loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Updating...</span>
              </>
            ) : (
              <span>Update Employee</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEditModal; 