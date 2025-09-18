"use client";

import React, { useState, useMemo } from 'react';
import { useFerries } from '@/hooks/useApi';
import BreadcrumbComponent from '@/components/Bread-crumb';
import RoleProtected from "@/components/RoleProtected";
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Search, Ship, Eye, Edit, Trash2, RefreshCw, Plus } from 'lucide-react';
import FerryDetailModal from '@/components/FerryCard/FerryDetailCard';
import FerryEditModal from '@/components/FerryCard/FerryEditCard';
import FerryDeleteModal from '@/components/FerryCard/FerryDeleteCard';
import AddFerryModal from '@/components/FerryCard/AddFerryCard';

interface Ferry {
  id: number;
  ferryName: string;
  ferryCode: string;
  capacityVehicles: number;
  capacityPassengers: number;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  createdAt: string;
}

const FerriesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'>('all');
  
  // Modal states
  const [selectedFerry, setSelectedFerry] = useState<Ferry | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  
  const pageSize = 10;

  const { data: ferryData, loading, error, refetch } = useFerries(0, pageSize);

  // Memoized filtered data for search and filters
  const filteredFerries = useMemo(() => {
    if (!ferryData?.content) return [];

    return ferryData.content.filter((ferry: Ferry) => {
      const matchesSearch = 
        ferry.ferryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ferry.ferryCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        ferry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [ferryData?.content, searchTerm, statusFilter]);

  // Modal handlers
  const handleViewFerry = (ferry: Ferry) => {
    setSelectedFerry(ferry);
    setViewModalOpen(true);
  };

  const handleEditFerry = (ferry: Ferry) => {
    setSelectedFerry(ferry);
    setEditModalOpen(true);
  };

  const handleDeleteFerry = (ferry: Ferry) => {
    setSelectedFerry(ferry);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedFerry(null);
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setAddModalOpen(false);
  };

  const handleFerryUpdated = () => {
    refetch();
    handleModalClose();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800';
      case 'INACTIVE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '🟢';
      case 'MAINTENANCE':
        return '🟡';
      case 'INACTIVE':
        return '🔴';
      default:
        return '⚪';
    }
  };

  // Generate breadcrumb items
  const breadcrumbItems = generateBreadcrumbs('/list/ferries');

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <BreadcrumbComponent items={breadcrumbItems} />
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Ship className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error loading ferries
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => refetch()}
                    className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RoleProtected allowedRoles={["ADMIN","OPERATION_MANAGER"]}>
    <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ferry Management</h1>
            <p className="text-gray-600 mt-2">
              Manage ferry fleet, capacity, and operational status
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              title="Refresh ferries"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Ferry
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ferries</p>
                <p className="text-3xl font-bold text-blue-600">
                  {ferryData?.totalElements || 0}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Ship className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Ferries</p>
                <p className="text-3xl font-bold text-green-600">
                  {ferryData?.content?.filter((ferry: Ferry) => ferry.status === 'ACTIVE').length || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Ship className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Maintenance</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {ferryData?.content?.filter((ferry: Ferry) => ferry.status === 'MAINTENANCE').length || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Ship className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Inactive Ferries</p>
                <p className="text-3xl font-bold text-red-600">
                  {ferryData?.content?.filter((ferry: Ferry) => ferry.status === 'INACTIVE').length || 0}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Ship className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ferries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Filter by ferry status"
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="MAINTENANCE">Maintenance Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Ferry Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ferry List ({filteredFerries.length} of {ferryData?.totalElements || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading ferries...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="text-red-600 mb-2">⚠️ Error loading ferries</div>
              <p className="text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => refetch()}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : filteredFerries.length === 0 ? (
            <div className="p-8 text-center">
              <Ship className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No ferries found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ferry Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ferry Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Passenger Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Capacity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredFerries.map((ferry) => (
                      <tr key={ferry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ferry.ferryCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ferry.ferryName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ferry.capacityPassengers}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ferry.capacityVehicles}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ferry.status)}`}>
                            {getStatusIcon(ferry.status)} {ferry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(ferry.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewFerry(ferry)}
                              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditFerry(ferry)}
                              className="p-1 text-green-600 hover:text-green-800 transition-colors"
                              title="Edit Ferry"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteFerry(ferry)}
                              className="p-1 text-red-600 hover:text-red-800 transition-colors"
                              title="Delete Ferry"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Modals */}
        {selectedFerry && (
          <>
            <FerryDetailModal
              ferry={selectedFerry}
              isOpen={viewModalOpen}
              onClose={handleModalClose}
              onEdit={handleEditFerry}
              onDelete={handleDeleteFerry}
            />
            
            <FerryEditModal
              ferry={selectedFerry}
              isOpen={editModalOpen}
              onClose={handleModalClose}
              onSuccess={handleFerryUpdated}
            />
            
            <FerryDeleteModal
              ferry={selectedFerry}
              isOpen={deleteModalOpen}
              onClose={handleModalClose}
              onSuccess={handleFerryUpdated}
            />
          </>
        )}

        <AddFerryModal
          isOpen={addModalOpen}
          onClose={handleModalClose}
          onSuccess={handleFerryUpdated}
        />
      </div>
      </RoleProtected>
  );
};

export default FerriesPage;
