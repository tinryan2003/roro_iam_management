"use client";

import React, { useState, useMemo, useEffect } from 'react';
import RoleProtected from "@/components/RoleProtected";
import { useCustomers } from '@/hooks/useApi';
import BreadcrumbComponent from '@/components/Bread-crumb';
import AddCustomerCard from '@/components/CustomerCard/AddCustomerCard';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Search, Users, Eye, Edit, Trash2, RefreshCw, RotateCcw, MapPin, Phone, Mail, Building, UserCheck, UserX } from 'lucide-react';

interface CustomerData {
  id: number;
  customerCode?: string;
  companyName?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  isActive: boolean;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  fullName?: string;
  createdAt?: string;
  updatedAt?: string;
}

const CustomersPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [cityFilter, setCityFilter] = useState('');

  // Modal states
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);

  const pageSize = 10;

  const { data: customerData, loading, error, refetch } = useCustomers(currentPage, pageSize);

  // Memoized filtered data for search and filters
  const filteredCustomers = useMemo(() => {
    if (!customerData?.content) return [];

    return customerData.content.filter((customer: CustomerData) => {
      const matchesSearch = 
        (customer.customerCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (customer.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && customer.isActive) ||
        (statusFilter === 'inactive' && !customer.isActive);

      const matchesCity = 
        !cityFilter || 
        (customer.city?.toLowerCase() || '').includes(cityFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [customerData?.content, searchTerm, statusFilter, cityFilter]);

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => {
    if (!customerData?.content) return [];
    return [...new Set(customerData.content.map((customer: CustomerData) => customer.city).filter(Boolean))];
  }, [customerData?.content]);

  // Debug effect to monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { 
      selectedCustomer: selectedCustomer?.customerCode || 'none', 
      viewModalOpen,
      editModalOpen,
      deleteModalOpen,
      reactivateModalOpen 
    });
  }, [selectedCustomer, viewModalOpen, editModalOpen, deleteModalOpen, reactivateModalOpen]);

  // Modal handlers
  const handleViewCustomer = (customer: CustomerData) => {
    setSelectedCustomer(customer);
    setViewModalOpen(true);
  };

  const handleEditCustomer = (customer: CustomerData) => {
    console.log('✏️ Edit Customer clicked:', customer);
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  const handleDeleteCustomer = (customer: CustomerData) => {
    console.log('🗑️ Delete Customer clicked:', customer);
    setSelectedCustomer(customer);
    setDeleteModalOpen(true);
  };

  const handleReactivateCustomer = (customer: CustomerData) => {
    console.log('🔄 Reactivate Customer clicked:', customer);
    setSelectedCustomer(customer);
    setReactivateModalOpen(true);
  };

  const handleModalClose = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setReactivateModalOpen(false);
    setSelectedCustomer(null);
  };

  const handleCustomerUpdated = () => {
    refetch(); // Refresh the customer list
  };

  const breadcrumbItems = generateBreadcrumbs('/list/customers');

  return (
    <RoleProtected allowedRoles={["ADMIN", "OPERATION_MANAGER", "PLANNER", "ACCOUNTANT"]}>
    <div className="p-6 space-y-6">
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-gray-600 mt-2">
              Manage and monitor all customers in the RORO system
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
            <AddCustomerCard 
              onCustomerAdded={() => refetch()}
              buttonText="Add Customer"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-blue-600">
                  {customerData?.totalElements || 0}
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
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-3xl font-bold text-green-600">
                  {customerData?.content?.filter((customer: CustomerData) => customer.isActive).length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Customers</p>
                <p className="text-3xl font-bold text-red-600">
                  {customerData?.content?.filter((customer: CustomerData) => !customer.isActive).length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <UserX className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Companies</p>
                <p className="text-3xl font-bold text-purple-600">
                  {customerData?.content?.filter((customer: CustomerData) => customer.companyName).length || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Building className="h-6 w-6 text-purple-600" />
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
                placeholder="Search customers..."
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
              aria-label="Filter by customer status"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>

            {/* City Filter */}
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by customer city"
            >
              <option value="">All Cities</option>
              {uniqueCities.map((city, index) => (
                <option key={city || `city-${index}`} value={city || ''}>
                  {city || 'Unknown City'}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCityFilter('');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Customer List ({filteredCustomers.length} of {customerData?.totalElements || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading customers</div>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No customers found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
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
                    {filteredCustomers.map((customer: CustomerData) => (
                      <tr key={customer.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {customer.customerCode || `Customer #${customer.id}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.firstName} {customer.lastName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center text-sm text-gray-900">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center text-sm text-gray-900">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {customer.companyName || 'Individual'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                            {customer.city && customer.country ? `${customer.city}, ${customer.country}` : customer.city || customer.country || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            customer.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {customer.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handleViewCustomer(customer)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                              title="View customer details"
                              aria-label="View customer details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleEditCustomer(customer)}
                              className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                              title="Edit customer"
                              aria-label="Edit customer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            {/* Show delete button for active customers */}
                            {customer.isActive ? (
                              <button 
                                onClick={() => handleDeleteCustomer(customer)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Delete customer"
                                aria-label="Delete customer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleReactivateCustomer(customer)}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Reactivate customer"
                                aria-label="Reactivate customer"
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
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing {filteredCustomers.length} of {customerData?.totalElements || 0} customers
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {Math.ceil((customerData?.totalElements || 0) / pageSize)}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={(currentPage + 1) * pageSize >= (customerData?.totalElements || 0)}
                    className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Simple Modals - Placeholder for future implementation */}
        {viewModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Customer Details</h3>
              <div className="space-y-3">
                <div><span className="font-medium">Code:</span> {selectedCustomer.customerCode}</div>
                <div><span className="font-medium">Name:</span> {selectedCustomer.firstName} {selectedCustomer.lastName}</div>
                <div><span className="font-medium">Email:</span> {selectedCustomer.email || 'N/A'}</div>
                <div><span className="font-medium">Phone:</span> {selectedCustomer.phone || 'N/A'}</div>
                <div><span className="font-medium">Company:</span> {selectedCustomer.companyName || 'Individual'}</div>
                <div><span className="font-medium">Status:</span> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedCustomer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedCustomer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={handleModalClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {(editModalOpen || deleteModalOpen || reactivateModalOpen) && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                {editModalOpen ? 'Edit Customer' : deleteModalOpen ? 'Delete Customer' : 'Reactivate Customer'}
              </h3>
              <p className="text-gray-600 mb-4">This functionality will be implemented in a future update.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={handleModalClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
                <button 
                  onClick={() => { handleCustomerUpdated(); handleModalClose(); }}
                  className={`px-4 py-2 rounded-lg text-white ${
                    editModalOpen ? 'bg-blue-600 hover:bg-blue-700' : 
                    deleteModalOpen ? 'bg-red-600 hover:bg-red-700' : 
                    'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {editModalOpen ? 'Save Changes' : deleteModalOpen ? 'Delete' : 'Reactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </RoleProtected>
  );
};

export default CustomersPage;
