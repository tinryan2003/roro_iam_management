"use client";

import React, { useState, useEffect } from 'react';
import { useSchedules, useRoutes, useFerries, ScheduleData } from '@/hooks/useApi';
import RoleProtected from '@/components/RoleProtected';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { AddScheduleCard, ScheduleDetailCard, ScheduleEditCard, ScheduleDeleteCard } from '@/components/ScheduleCard';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Search, Calendar, Eye, Edit, Trash2, RefreshCw, MapPin, Clock, Ship, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

const SchedulesPage = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED'>('all');
  const [routeFilter, setRouteFilter] = useState('');
  const [showPastSchedules, setShowPastSchedules] = useState(false);

  // Modal state
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleData | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const pageSize = 12;

  // Use upcomingOnly based on showPastSchedules toggle - if false, show upcoming only
  const upcomingOnly = !showPastSchedules;
  
  const { data: scheduleData, loading, error, refetch } = useSchedules(
    currentPage, 
    pageSize, 
    upcomingOnly, 
    statusFilter === 'all' ? undefined : statusFilter
  );
  const { data: routesData, loading: routesLoading } = useRoutes();
  const { data: ferriesData, loading: ferriesLoading } = useFerries();

  // Get current page schedules from API response
  const currentPageSchedules = scheduleData?.content || [];

  // Debug effect to monitor modal state changes
  useEffect(() => {
    console.log('🔍 Modal state changed:', { 
      selectedSchedule: selectedSchedule?.scheduleCode || 'none', 
      viewModalOpen,
      editModalOpen,
      deleteModalOpen,
      addModalOpen
    });
  }, [selectedSchedule, viewModalOpen, editModalOpen, deleteModalOpen, addModalOpen]);

  // Refetch when filters change
  useEffect(() => {
    refetch();
  }, [showPastSchedules, statusFilter, refetch]);

  // Modal handlers
  const handleViewSchedule = (schedule: ScheduleData) => {
    setSelectedSchedule(schedule);
    setViewModalOpen(true);
  };

  const handleEditSchedule = (schedule: ScheduleData) => {
    console.log('✏️ Edit Schedule clicked:', schedule);
    setSelectedSchedule(schedule);
    setEditModalOpen(true);
  };

  const handleDeleteSchedule = (schedule: ScheduleData) => {
    console.log('🗑️ Delete Schedule clicked:', schedule);
    setSelectedSchedule(schedule);
    setDeleteModalOpen(true);
  };

  const closeAllModals = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setAddModalOpen(false);
    setSelectedSchedule(null);
  };

  const handleRefresh = () => {
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getTotalPages = () => {
    return scheduleData?.totalPages || 0;
  };

  const getTotalSchedules = () => {
    return scheduleData?.totalElements || 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DEPARTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'ARRIVED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'DELAYED': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeIndicator = (schedule: ScheduleData) => {
    const now = new Date();
    const departureTime = new Date(schedule.departureTime);
    const arrivalTime = new Date(schedule.arrivalTime);
    
    if (arrivalTime < now) {
      return { label: 'Past', color: 'bg-gray-100 text-gray-600 border-gray-300' };
    } else if (departureTime <= now && arrivalTime >= now) {
      return { label: 'Active', color: 'bg-green-100 text-green-700 border-green-300' };
    } else {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-700 border-blue-300' };
    }
  };

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const breadcrumbItems = generateBreadcrumbs('schedules');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schedules...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading schedules: {error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleProtected allowedRoles={['ADMIN', 'PLANNER', 'OPERATION_MANAGER']}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <BreadcrumbComponent items={breadcrumbItems} />
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
                    <p className="text-sm text-gray-600">
                      {showPastSchedules 
                        ? "Manage ferry schedules - showing all schedules including past" 
                        : "Manage ferry schedules - showing from current time to future"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => setAddModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Schedule</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <select
                title="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="BOARDING">Boarding</option>
                <option value="DEPARTED">Departed</option>
                <option value="ARRIVED">Arrived</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="DELAYED">Delayed</option>
              </select>

              {/* Route Filter */}
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by route..."
                  value={routeFilter}
                  onChange={(e) => setRouteFilter(e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Past Schedules Toggle */}
              <div className="flex items-center">
                <button
                  onClick={() => setShowPastSchedules(!showPastSchedules)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    showPastSchedules
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {showPastSchedules ? 'Hide Past' : 'Show Past'}
                </button>
              </div>

              {/* Results count */}
              <div className="flex items-center text-sm text-gray-600">
                <span>
                  Page {currentPage + 1} of {getTotalPages()} 
                  ({getTotalSchedules()} total schedules)
                </span>
              </div>
            </div>
          </div>

          {/* Schedule Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentPageSchedules.map((schedule: ScheduleData) => {
              const timeIndicator = getTimeIndicator(schedule);
              return (
                <div key={schedule.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {schedule.scheduleCode || `Schedule #${schedule.id}`}
                      </h3>
                      <div className="flex items-center mt-1 text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>
                          {schedule.departurePortName && schedule.arrivalPortName 
                            ? `${schedule.departurePortName} → ${schedule.arrivalPortName}`
                            : schedule.route?.departurePort.portName && schedule.route?.arrivalPort.portName
                            ? `${schedule.route.departurePort.portName} → ${schedule.route.arrivalPort.portName}`
                            : 'Route information not available'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${timeIndicator.color}`}>
                        {timeIndicator.label}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Ship className="h-4 w-4 mr-2" />
                      <span>{schedule.ferryName || schedule.ferry?.ferryName || 'No ferry assigned'}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <div className="flex flex-col">
                        <span className="font-medium">Departure: {formatDateTime(schedule.departureTime)}</span>
                        <span className="text-xs text-gray-500">Arrival: {formatDateTime(schedule.arrivalTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-4">👥 {schedule.availablePassengerSpaces} passengers</span>
                      <span>🚗 {schedule.availableVehicleSpaces} vehicles</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleViewSchedule(schedule)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditSchedule(schedule)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                      title="Edit Schedule"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSchedule(schedule)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Schedule"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {currentPageSchedules.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No schedules found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' || routeFilter || !showPastSchedules
                  ? showPastSchedules 
                    ? 'Try adjusting your search filters.'
                    : 'No current or upcoming schedules found. Try enabling "Show Past" to see completed schedules.'
                  : 'Create your first schedule to get started.'}
              </p>
              {(!searchTerm && statusFilter === 'all' && !routeFilter) && (
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Schedule</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {scheduleData && scheduleData.totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center space-y-4"> 
            <div className="text-sm text-gray-700">
              Page {currentPage + 1} of {getTotalPages()} ({getTotalSchedules()} total schedules)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 0}
                aria-label="Previous page"
                className="px-3 py-2 border rounded-md text-sm font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         enabled:hover:bg-gray-50 enabled:hover:border-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {/* Page number indicators */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                  const pageNum = i + 1;
                  const isCurrentPage = pageNum === (currentPage + 1);
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium
                                ${isCurrentPage 
                                  ? 'bg-blue-600 text-white border-blue-600' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                {getTotalPages() > 5 && (
                  <>
                    {(currentPage + 1) < getTotalPages() - 2 && <span className="px-2 py-2 text-gray-500">...</span>}
                    {(currentPage + 1) !== getTotalPages() && (
                      <button
                        onClick={() => handlePageChange(getTotalPages() - 1)}
                        className="px-3 py-2 border rounded-md text-sm font-medium
                                 bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      >
                        {getTotalPages()}
                      </button>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= getTotalPages() - 1}
                aria-label="Next page"
                className="px-3 py-2 border rounded-md text-sm font-medium 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         enabled:hover:bg-gray-50 enabled:hover:border-gray-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {addModalOpen && (
          <AddScheduleCard
            onClose={closeAllModals}
            onAdd={async (scheduleData) => {
              // TODO: Implement schedule creation API call
              console.log('Creating schedule:', scheduleData);
              await handleRefresh();
            }}
            routes={routesData || []}
            ferries={ferriesData || []}
            routesLoading={routesLoading}
            ferriesLoading={ferriesLoading}
          />
        )}

        {viewModalOpen && selectedSchedule && (
          <ScheduleDetailCard
            schedule={selectedSchedule}
            onClose={closeAllModals}
          />
        )}

        {editModalOpen && selectedSchedule && (
          <ScheduleEditCard
            schedule={selectedSchedule}
            onClose={closeAllModals}
            onScheduleUpdated={async () => {
              // TODO: Implement schedule update API call
              console.log('Updating schedule:', selectedSchedule);
              await handleRefresh();
            }}
          />
        )}

        {deleteModalOpen && selectedSchedule && (
          <ScheduleDeleteCard
            schedule={selectedSchedule}
            onClose={closeAllModals}
            onScheduleDeleted={async () => {
              // TODO: Implement schedule deletion API call
              console.log('Deleting schedule:', selectedSchedule.id);
              await handleRefresh();
            }}
          />
        )}
      </div>
    </RoleProtected>
  );
};

export default SchedulesPage;
