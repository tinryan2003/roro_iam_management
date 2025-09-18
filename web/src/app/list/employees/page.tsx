"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useEmployees, EmployeeData } from '@/hooks/useApi';
import BreadcrumbComponent from '@/components/Bread-crumb';
import RoleProtected from "@/components/RoleProtected";
import AddEmployeeCard from '@/components/EmployeeCard/AddEmployeeCard';
import EmployeeDetailModal from '@/components/EmployeeCard/EmployeeDetailCard';
import EmployeeEditModal from '@/components/EmployeeCard/EmployeeEditCard';
import EmployeeDeleteModal from '@/components/EmployeeCard/EmployeeDeleteCard';
import EmployeeReactivateModal from '@/components/EmployeeCard/EmployeeReactivateCard';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Search, Users, Eye, Edit, Trash2, Filter, RefreshCw, RotateCcw } from 'lucide-react';

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

const EmployeesPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [positionFilter, setPositionFilter] = useState('');
  
  // Modal states
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
 
  
  const pageSize = 10;

  const { data: employeeData, loading, error, refetch } = useEmployees(currentPage, pageSize);

  // Memoized filtered data for search and filters
  const filteredEmployees = useMemo(() => {
    if (!employeeData?.content) return [];

    return employeeData.content.filter((employee: EmployeeData) => {
      const matchesSearch = 
        employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (employee.position?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && employee.active) ||
        (statusFilter === 'inactive' && !employee.active);

      const matchesPosition = 
        !positionFilter || 
        (employee.position?.toLowerCase() || '').includes(positionFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesPosition;
    });
  }, [employeeData?.content, searchTerm, statusFilter, positionFilter]);

  // Debug effect to monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { 
      selectedEmployee: selectedEmployee?.employeeCode || 'none', 
      viewModalOpen,
      editModalOpen,
      deleteModalOpen,
      reactivateModalOpen 
    });
  }, [selectedEmployee, viewModalOpen, editModalOpen, deleteModalOpen, reactivateModalOpen]);

  // Modal handlers - use employee data directly from the list
  const handleViewEmployee = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setViewModalOpen(true);
    
    setTimeout(() => {
      console.log('🔍 Modal state after 100ms:', { 
        selectedEmployee: employee, 
        viewModalOpen: true 
      });
      console.log(employee);
    }, 100);
  };

  const handleEditEmployee = (employee: EmployeeData) => {
    console.log('✏️ Edit Employee clicked:', employee);
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  const handleDeleteEmployee = (employee: EmployeeData) => {
    console.log('🗑️ Delete Employee clicked:', employee);
    setSelectedEmployee(employee);
    setDeleteModalOpen(true);
  };

  const handleReactivateEmployee = (employee: EmployeeData) => {
    console.log('🔄 Reactivate Employee clicked:', employee);
    setSelectedEmployee(employee);
    setReactivateModalOpen(true);
  };

  const handleModalClose = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setReactivateModalOpen(false);
    setSelectedEmployee(null);
  };

  const handleEmployeeUpdated = () => {
    refetch(); // Refresh the employee list
  };

  // Get unique positions for filter dropdown
  const uniquePositions = useMemo(() => {
    if (!employeeData?.content) return [];
    return [...new Set(employeeData.content.map((emp: EmployeeData) => emp.position).filter(Boolean))];
  }, [employeeData?.content]);

  // Helper function to convert EmployeeData to Employee format for modals
  const convertToEmployee = (employeeData: EmployeeData): Employee => ({
    ...employeeData,
    isActive: employeeData.active
  });

  const totalPages = Math.ceil((employeeData?.totalElements || 0) / pageSize);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(salary);
  };

  const breadcrumbItems = generateBreadcrumbs('/list/employees');
  return (
    <RoleProtected allowedRoles={["ADMIN","ACCOUNTANT"]}>
    <div className="p-6 space-y-6">
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all employees in the RORO system
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <AddEmployeeCard 
              onEmployeeAdded={() => refetch()}
              buttonText="Add Employee"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold text-blue-600">
                  {employeeData?.totalElements || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Employees</p>
                <p className="text-3xl font-bold text-green-600">
                  {employeeData?.content?.filter((emp: EmployeeData) => emp.active).length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Employees</p>
                <p className="text-3xl font-bold text-red-600">
                  {employeeData?.content?.filter((emp: EmployeeData) => !emp.active).length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Users className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-3xl font-bold text-purple-600">
                  {uniquePositions.length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by employee status"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* Position Filter */}
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by employee position"
            >
              <option value="">All Positions</option>
              {uniquePositions.map((position, index) => (
                <option key={position || `position-${index}`} value={position || ''}>
                  {position || 'Unknown Position'}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPositionFilter('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Employee Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Employee List ({filteredEmployees.length} of {employeeData?.totalElements || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading employees...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading employees</div>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No employees found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hire Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEmployees.map((employee: EmployeeData, index: number) => (
                      <tr key={employee.employeeId ? `emp-${employee.employeeId}` : employee.employeeCode ? `code-${employee.employeeCode}` : `row-${index}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {employee.employeeCode}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {employee.employeeId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{employee.position || 'Position TBD'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(employee.hireDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatSalary(employee.salary)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            employee.active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {employee.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                console.log('🎯 Button clicked for employee:', { employeeId: employee.employeeId, employeeCode: employee.employeeCode });
                                handleViewEmployee(employee);
                              }}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded"
                              title="View employee details"
                              aria-label="View employee details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => {
                                console.log('🎯 Edit button clicked for employee:', { employeeId: employee.employeeId, employeeCode: employee.employeeCode });
                                handleEditEmployee(employee);
                              }}
                              className="text-green-600 hover:text-green-900 p-1 rounded"
                              title="Edit employee"
                              aria-label="Edit employee"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {/* Show delete button for active employees */}
                            {employee.active && (
                              <button 
                                onClick={() => {
                                  console.log('🎯 Delete button clicked for employee:', { employeeId: employee.employeeId, employeeCode: employee.employeeCode });
                                  handleDeleteEmployee(employee);
                                }}
                                className="text-red-600 hover:text-red-900 p-1 rounded"
                                title="Delete employee"
                                aria-label="Delete employee"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            {/* Show reactivate button for inactive employees */}
                            {!employee.active && (
                              <button 
                                onClick={() => {
                                  console.log('🔄 Reactivate button clicked for employee:', { employeeId: employee.employeeId, employeeCode: employee.employeeCode });
                                  handleReactivateEmployee(employee);
                                }}
                                className="text-green-600 hover:text-green-900 p-1 rounded"
                                title="Reactivate employee"
                                aria-label="Reactivate employee"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {currentPage + 1} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage + 1}
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

                 {/* Employee Detail Modal */}
         {selectedEmployee ? (
           <EmployeeDetailModal
             isOpen={viewModalOpen}
             onClose={handleModalClose}
             employee={convertToEmployee(selectedEmployee)}
           />
         ) : viewModalOpen ? (
           <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
             <div className="bg-white p-6 rounded-lg">
               <h3>Loading employee details...</h3>
               <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
             </div>
           </div>
         ) : null}

         {/* Employee Edit Modal */}
         {selectedEmployee ? (
           <EmployeeEditModal
             isOpen={editModalOpen}
             onClose={handleModalClose}
             employee={convertToEmployee(selectedEmployee)}
             onSuccess={handleEmployeeUpdated}
           />
         ) : editModalOpen ? (
           <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
             <div className="bg-white p-6 rounded-lg">
               <h3>Loading employee for editing...</h3>
               <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
             </div>
           </div>
         ) : null}

         {/* Employee Delete Modal */}
         {selectedEmployee ? (
           <EmployeeDeleteModal
             isOpen={deleteModalOpen}
             onClose={handleModalClose}
             employee={convertToEmployee(selectedEmployee)}
             onSuccess={handleEmployeeUpdated}
           />
         ) : deleteModalOpen ? (
           <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
             <div className="bg-white p-6 rounded-lg">
               <h3>Loading employee for deletion...</h3>
               <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
             </div>
           </div>
         ) : null}

         {/* Employee Reactivate Modal */}
         {selectedEmployee ? (
           <EmployeeReactivateModal
             isOpen={reactivateModalOpen}
             onClose={handleModalClose}
             employee={convertToEmployee(selectedEmployee)}
             onSuccess={handleEmployeeUpdated}
           />
         ) : reactivateModalOpen ? (
           <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
             <div className="bg-white p-6 rounded-lg">
               <h3>Loading employee for reactivation...</h3>
               <button onClick={handleModalClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
             </div>
           </div>
         ) : null}
      </div>
      </RoleProtected>
  );
};

export default EmployeesPage; 