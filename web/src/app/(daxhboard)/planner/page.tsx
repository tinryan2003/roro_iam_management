"use client";

import React, { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, MapPin, Clock, TrendingUp, Ship, Route, Users, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import RoleProtected from '@/components/RoleProtected';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { useFerries, useInReviewBookings, useApproveReview, useInProgressBookings, useConfirmArrival } from '@/hooks/useApi';

interface RouteSchedule {
  id: string;
  routeName: string;
  origin: string;
  destination: string;
  ferry: string;
  departureTime: string;
  arrivalTime: string;
  capacity: number;
  booked: number;
  status: 'On Schedule' | 'Delayed' | 'Cancelled' | 'Completed';
  duration: string;
}

interface Ferry {
  id: string;
  name: string;
  capacity: {
    passengers: number;
    vehicles: number;
  };
  status: 'Active' | 'Maintenance' | 'Inactive';
  currentRoute?: string;
  nextMaintenance: string;
}

interface Port {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  status: 'Operational' | 'Maintenance' | 'Closed';
}

function PlannerContent() {
  const { data: inReview, loading: inReviewLoading } = useInReviewBookings(0, 10);
  const { data: inProgress, loading: inProgressLoading } = useInProgressBookings(0, 10);
  const { approveReview } = useApproveReview();
  const { confirmArrival } = useConfirmArrival();
  const { data: session } = useSession();
  const { data: ferriesData } = useFerries(0, 100);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'schedule' | 'capacity' | 'routes'>('schedule');

  // Mock data - in real app, this would come from useApi hooks
  const [schedules] = useState<RouteSchedule[]>([
    {
      id: 'S001',
      routeName: 'Northern Express',
      origin: 'Port Alpha',
      destination: 'Port Beta',
      ferry: 'Ferry Neptune',
      departureTime: '08:00',
      arrivalTime: '10:30',
      capacity: 150,
      booked: 127,
      status: 'On Schedule',
      duration: '2h 30m'
    },
    {
      id: 'S002',
      routeName: 'Southern Route',
      origin: 'Port Beta',
      destination: 'Port Gamma',
      ferry: 'Ferry Poseidon',
      departureTime: '09:15',
      arrivalTime: '11:00',
      capacity: 120,
      booked: 98,
      status: 'Delayed',
      duration: '1h 45m'
    },
    {
      id: 'S003',
      routeName: 'Central Line',
      origin: 'Port Gamma',
      destination: 'Port Alpha',
      ferry: 'Ferry Triton',
      departureTime: '14:00',
      arrivalTime: '16:15',
      capacity: 180,
      booked: 45,
      status: 'On Schedule',
      duration: '2h 15m'
    },
    {
      id: 'S004',
      routeName: 'Evening Express',
      origin: 'Port Alpha',
      destination: 'Port Beta',
      ferry: 'Ferry Neptune',
      departureTime: '18:30',
      arrivalTime: '21:00',
      capacity: 150,
      booked: 134,
      status: 'On Schedule',
      duration: '2h 30m'
    }
  ]);

  const [ferries] = useState<Ferry[]>([
    {
      id: 'F001',
      name: 'Ferry Neptune',
      capacity: { passengers: 150, vehicles: 40 },
      status: 'Active',
      currentRoute: 'Northern Express',
      nextMaintenance: '2024-02-15'
    },
    {
      id: 'F002',
      name: 'Ferry Poseidon',
      capacity: { passengers: 120, vehicles: 35 },
      status: 'Active',
      currentRoute: 'Southern Route',
      nextMaintenance: '2024-02-10'
    },
    {
      id: 'F003',
      name: 'Ferry Triton',
      capacity: { passengers: 180, vehicles: 50 },
      status: 'Maintenance',
      nextMaintenance: '2024-02-08'
    }
  ]);

  const [ports] = useState<Port[]>([
    {
      id: 'P001',
      name: 'Port Alpha',
      capacity: 200,
      currentOccupancy: 145,
      status: 'Operational'
    },
    {
      id: 'P002',
      name: 'Port Beta',
      capacity: 180,
      currentOccupancy: 92,
      status: 'Operational'
    },
    {
      id: 'P003',
      name: 'Port Gamma',
      capacity: 150,
      currentOccupancy: 67,
      status: 'Operational'
    }
  ]);

  // Filter schedules based on selected route
  const filteredSchedules = useMemo(() => {
    if (selectedRoute === 'all') return schedules;
    return schedules.filter(schedule => schedule.routeName === selectedRoute);
  }, [schedules, selectedRoute]);

  // Get unique route names for filter
  const uniqueRoutes = useMemo(() => {
    return [...new Set(schedules.map(s => s.routeName))];
  }, [schedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Schedule': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const calculateOccupancyPercentage = (booked: number, capacity: number) => {
    return Math.round((booked / capacity) * 100);
  };

  // Generate breadcrumb items with user role for dynamic dashboard links
  const userRole = session?.user?.role?.[0];
  const breadcrumbItems = generateBreadcrumbs('/planner', undefined, userRole);

  return (
      <div className="p-6 space-y-6">
        {/* Workflow: In-Review Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">In-Review Bookings</h2>
          {inReviewLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : inReview && inReview.content && inReview.content.length > 0 ? (
            <div className="space-y-3">
              {inReview.content.map((b) => (
                <div key={b.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">{b.bookingCode} • ${b.totalAmount} • Passengers: {b.passengerCount}</div>
                    <div className="text-gray-500">Review deadline: {b.paymentDeadline ? new Date(b.paymentDeadline).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => approveReview(b.id, 'Reviewed and accepted')} className="px-3 py-2 text-sm bg-green-600 text-white rounded">Approve Review → In Progress</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No bookings awaiting review</div>
          )}
        </div>

        {/* Workflow: In-Progress Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">In-Progress Bookings</h2>
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
            <div><strong>User Role:</strong> {session?.user?.role?.join(', ') || 'No roles'}</div>
            <div><strong>Loading:</strong> {inProgressLoading ? 'Yes' : 'No'}</div>
            <div><strong>Data:</strong> {inProgress ? JSON.stringify(inProgress, null, 2) : 'No data'}</div>
          </div>
          {inProgressLoading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : inProgress && inProgress.content && inProgress.content.length > 0 ? (
            <div className="space-y-3">
              {inProgress.content.map((b) => (
                <div key={b.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">{b.bookingCode} • ${b.totalAmount} • Passengers: {b.passengerCount}</div>
                    <div className="text-gray-500">Status: {b.status} | Departure: {b.departureTime ? new Date(b.departureTime).toLocaleString() : 'N/A'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        console.log('Confirming arrival for booking:', b.id);
                        confirmArrival(b.id).then(result => {
                          console.log('Confirm arrival result:', result);
                        }).catch(error => {
                          console.error('Confirm arrival error:', error);
                        });
                      }} 
                      className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Confirm Arrival
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No in-progress bookings</div>
          )}
        </div>
        {/* Breadcrumb */}
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Route Planning Center</h1>
            <p className="text-gray-600 mt-2">
              Schedule management, capacity planning, and route optimization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Select date for schedule"
            />
            <button className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-4 w-4" />
              New Schedule
            </button>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="bg-white rounded-lg shadow-sm border p-1">
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('schedule')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Schedule View
            </button>
            <button
              onClick={() => setViewMode('capacity')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'capacity' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              Capacity Analysis
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daily Routes</p>
                <p className="text-3xl font-bold text-blue-600">{schedules.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Route className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Ferries</p>
                <p className="text-3xl font-bold text-green-600">
                  {typeof ferriesData?.totalElements === 'number' && ferriesData?.content
                    ? ferriesData.content.filter(f => f.status === 'ACTIVE').length
                    : ferries.filter(f => f.status === 'Active').length}
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
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-3xl font-bold text-purple-600">
                  {schedules.reduce((sum, s) => sum + s.booked, 0)}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.round(schedules.reduce((sum, s) => sum + calculateOccupancyPercentage(s.booked, s.capacity), 0) / schedules.length)}%
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Based on View Mode */}
        {viewMode === 'schedule' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Schedule List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Today&apos;s Schedule</h2>
                  <select
                    value={selectedRoute}
                    onChange={(e) => setSelectedRoute(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    aria-label="Filter routes"
                  >
                    <option value="all">All Routes</option>
                    {uniqueRoutes.map(route => (
                      <option key={route} value={route}>{route}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {filteredSchedules.map((schedule) => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium text-gray-900">{schedule.routeName}</h3>
                          <p className="text-sm text-gray-600">{schedule.ferry}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                          {schedule.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{schedule.origin} → {schedule.destination}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{schedule.departureTime} - {schedule.arrivalTime}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Duration: {schedule.duration}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            {schedule.booked}/{schedule.capacity} passengers
                          </span>
                          <div className={`px-2 py-1 text-xs rounded ${getCapacityColor(calculateOccupancyPercentage(schedule.booked, schedule.capacity))}`}>
                            {calculateOccupancyPercentage(schedule.booked, schedule.capacity)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Port Status & Ferry Information */}
            <div className="space-y-6">
              {/* Port Status */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Port Status</h3>
                <div className="space-y-3">
                  {ports.map((port) => (
                    <div key={port.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{port.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          port.status === 'Operational' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {port.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Occupancy: {port.currentOccupancy}/{port.capacity}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(port.currentOccupancy / port.capacity) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ferry Fleet */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ferry Fleet</h3>
                <div className="space-y-3">
                  {ferries.map((ferry) => (
                    <div key={ferry.id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{ferry.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          ferry.status === 'Active' ? 'bg-green-100 text-green-800' :
                          ferry.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ferry.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <div>Capacity: {ferry.capacity.passengers} passengers, {ferry.capacity.vehicles} vehicles</div>
                        {ferry.currentRoute && (
                          <div>Current: {ferry.currentRoute}</div>
                        )}
                        <div>Next Maintenance: {ferry.nextMaintenance}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'capacity' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Capacity Analysis</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Route Utilization</h3>
                {schedules.map((schedule) => {
                  const percentage = calculateOccupancyPercentage(schedule.booked, schedule.capacity);
                  return (
                    <div key={schedule.id} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{schedule.routeName}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            percentage >= 90 ? 'bg-red-500' :
                            percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Optimization Suggestions</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">High Demand Route</p>
                        <p className="text-xs text-yellow-700">Northern Express is at 85% capacity. Consider adding extra ferry.</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Low Utilization</p>
                        <p className="text-xs text-blue-700">Central Line has low booking. Consider adjusting schedule.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'routes' && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Route Management</h2>
            <div className="text-center py-8 text-gray-500">
              <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p>Route management interface coming soon...</p>
              <p className="text-sm">Create, modify, and optimize ferry routes</p>
            </div>
          </div>
        )}
      </div>
  );
}

const PlannerPage = () => {
  return (
    <RoleProtected allowedRoles={["planner", "admin"]}>
      <PlannerContent />
    </RoleProtected>
  );
};

export default PlannerPage;