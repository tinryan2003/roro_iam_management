"use client";

import React, { useState, useMemo } from 'react';
import { useRoutes } from '@/hooks/useApi';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Search, MapPin, Eye, Edit, Trash2, RefreshCw, Navigation } from 'lucide-react';
import RoleProtected from "@/components/RoleProtected";
import {
  RouteDetailModal,
  RouteEditModal,
  RouteDeleteModal,
  AddRouteCard
} from '@/components/RouteCard';

interface Route {
  id: number;
  routeName: string;
  departurePort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  arrivalPort: {
    id: number;
    portName: string;
    city: string;
    country: string;
  };
  durationHours: number;
  price: number;
  isActive: boolean;
}

const RoutesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Modal states
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const { data: routeData, loading, error, refetch } = useRoutes(false); // Get all routes, not just active

  // Memoized filtered data for search and filters
  const filteredRoutes = useMemo(() => {
    if (!routeData) return [];

    return routeData.filter((route: Route) => {
      const matchesSearch = 
        route.routeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.departurePort.portName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.arrivalPort.portName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.departurePort.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.arrivalPort.city.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'active' && route.isActive) ||
        (statusFilter === 'inactive' && !route.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [routeData, searchTerm, statusFilter]);

  // Generate breadcrumbs
  const breadcrumbItems = generateBreadcrumbs('/list/routes');

  const handleView = (route: Route) => {
    setSelectedRoute(route);
    setViewModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setEditModalOpen(true);
  };

  const handleDelete = (route: Route) => {
    setSelectedRoute(route);
    setDeleteModalOpen(true);
  };

  const handleRefresh = () => {
    refetch();
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Active
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Inactive
        </span>
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDuration = (hours: number) => {
    if (hours < 24) {
      return `${hours}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading routes</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleRefresh}
                  className="bg-red-100 px-2 py-1 rounded text-red-800 hover:bg-red-200 text-sm"
                >
                  Try again
                </button>
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
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Navigation className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
            <p className="text-gray-600">Manage ferry routes between ports</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <AddRouteCard
            onRouteAdded={refetch}
            buttonText="Add Route"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search routes, ports, or cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="sr-only">
              Filter by status
            </label>
            <select
              id="status-filter"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">All Routes</option>
              <option value="active">Active Routes</option>
              <option value="inactive">Inactive Routes</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-700">
        Showing {filteredRoutes.length} of {routeData?.length || 0} routes
      </div>

      {/* Routes Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departure
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arrival
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {route.routeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {route.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {route.departurePort.portName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.departurePort.city}, {route.departurePort.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {route.arrivalPort.portName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {route.arrivalPort.city}, {route.arrivalPort.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(route.durationHours)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(route.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(route.isActive)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleView(route)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(route)}
                        className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                        title="Edit Route"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(route)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Route"
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

        {/* Empty State */}
        {filteredRoutes.length === 0 && (
          <div className="text-center py-12">
            <Navigation className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No routes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by creating a new route.'}
            </p>
            {(!searchTerm && statusFilter === 'all') && (
              <div className="mt-6">
                <AddRouteCard
                  onRouteAdded={refetch}
                  buttonText="Add Route"
                  buttonClassName="shadow-sm"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {viewModalOpen && selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedRoute(null);
          }}
          onEdit={(route) => {
            setViewModalOpen(false);
            setSelectedRoute(route);
            setEditModalOpen(true);
          }}
          onDelete={(route) => {
            setViewModalOpen(false);
            setSelectedRoute(route);
            setDeleteModalOpen(true);
          }}
        />
      )}

      {editModalOpen && selectedRoute && (
        <RouteEditModal
          route={selectedRoute}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRoute(null);
          }}
          onSuccess={() => {
            setEditModalOpen(false);
            setSelectedRoute(null);
            refetch();
          }}
        />
      )}

      {deleteModalOpen && selectedRoute && (
        <RouteDeleteModal
          route={selectedRoute}
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedRoute(null);
          }}
          onSuccess={() => {
            setDeleteModalOpen(false);
            setSelectedRoute(null);
            refetch();
          }}
        />
      )}
    </div>
    </RoleProtected>
  );
};

export default RoutesPage;