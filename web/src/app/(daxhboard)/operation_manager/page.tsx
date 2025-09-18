"use client";

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Camera, 
  Calendar, 
  Users, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  ArrowRight,
  Ship,
  MapPin,
  Settings
} from 'lucide-react';
import RoleProtected from '@/components/RoleProtected';
import BreadcrumbComponent from '@/components/Bread-crumb';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { useGetRole } from '@/hooks/useGetRole';

const OperationManagerDashboard = () => {
  const userRole = useGetRole();
  const [refreshTime, setRefreshTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Fix hydration by using useEffect for time
  useEffect(() => {
    const updateTime = () => {
      setRefreshTime(new Date().toLocaleTimeString());
    };
    updateTime();
    
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshTime(new Date().toLocaleTimeString());
    setIsLoading(false);
  };

  const breadcrumbItems = generateBreadcrumbs('/operation_manager', undefined, userRole);

  // Mock operational data
  const operationalStats = {
    pendingInspections: 3,
    activeBookings: 12,
    openGates: 2,
    totalQueue: 8,
    alertsCount: 2,
    ferryStatus: 'Active'
  };

  const recentActivities = [
    {
      id: 1,
      type: 'inspection',
      message: 'Vehicle ABC-123 inspection completed',
      time: '2 minutes ago',
      status: 'success',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'alert',
      message: 'Gate 3 maintenance required',
      time: '15 minutes ago',
      status: 'warning',
      icon: AlertTriangle
    },
    {
      id: 3,
      type: 'booking',
      message: 'New booking ROF2024-156 approved',
      time: '30 minutes ago',
      status: 'info',
      icon: Calendar
    },
    {
      id: 4,
      type: 'ferry',
      message: 'Ferry MV Islander departed on schedule',
      time: '1 hour ago',
      status: 'success',
      icon: Ship
    }
  ];

  const pendingTasks = [
    {
      id: 1,
      title: 'Inspect Vehicle XYZ-789',
      priority: 'High',
      type: 'Truck',
      scheduledTime: '10:30 AM',
      location: 'Gate 2'
    },
    {
      id: 2,
      title: 'Approve Booking ROF2024-157',
      priority: 'Medium',
      type: 'Booking',
      scheduledTime: '11:00 AM',
      location: 'Processing'
    },
    {
      id: 3,
      title: 'Gate 1 Queue Management',
      priority: 'Low',
      type: 'Gate',
      scheduledTime: '11:30 AM',
      location: 'Gate 1'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <RoleProtected allowedRoles={['OPERATION_MANAGER']}>
      <div className="p-6 space-y-6">
        <BreadcrumbComponent items={breadcrumbItems} />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Operations Control Center</h1>
            <p className="text-gray-600 mt-2">
              Real-time operational oversight and workflow management
            </p>
          </div>
          <div className="flex items-center gap-3">
            {refreshTime && (
              <div className="text-sm text-gray-500">
                Last updated: {refreshTime}
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        {operationalStats.alertsCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-900">
                  {operationalStats.alertsCount} Active Alert{operationalStats.alertsCount > 1 ? 's' : ''} Requiring Attention
                </h4>
                <p className="text-sm text-orange-700">
                  Gate maintenance and vehicle inspection alerts need immediate action.
                </p>
              </div>
              <button className="text-orange-600 hover:text-orange-800 text-sm font-medium">
                View All
              </button>
            </div>
          </div>
        )}

        {/* Operational Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Inspections</p>
                <p className="text-3xl font-bold text-orange-600">{operationalStats.pendingInspections}</p>
                <p className="text-xs text-gray-500 mt-1">Requires immediate action</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm text-orange-600 hover:text-orange-800 font-medium flex items-center gap-1">
                Manage <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-3xl font-bold text-blue-600">{operationalStats.activeBookings}</p>
                <p className="text-xs text-gray-500 mt-1">In workflow process</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                Review <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gate Status</p>
                <p className="text-3xl font-bold text-green-600">{operationalStats.openGates}/4</p>
                <p className="text-xs text-gray-500 mt-1">Gates operational</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1">
                Monitor <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Queue Length</p>
                <p className="text-3xl font-bold text-purple-600">{operationalStats.totalQueue}</p>
                <p className="text-xs text-gray-500 mt-1">Vehicles waiting</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <button className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                Optimize <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div key={activity.id} className={`flex items-start gap-3 p-3 rounded-lg ${getStatusColor(activity.status)}`}>
                      <Icon className="h-5 w-5 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs opacity-75 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending Tasks */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Pending Tasks</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.scheduledTime}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {task.location}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button className="flex-1 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                        Start Task
                      </button>
                      <button 
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                        title="View task details"
                        aria-label="View task details"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center gap-3 p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
                <div className="p-2 bg-blue-100 group-hover:bg-blue-200 rounded-full">
                  <Camera className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-900">Start Vehicle Inspection</span>
              </button>
              
              <button className="flex flex-col items-center gap-3 p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
                <div className="p-2 bg-green-100 group-hover:bg-green-200 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-900">Approve Booking</span>
              </button>
              
              <button className="flex flex-col items-center gap-3 p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
                <div className="p-2 bg-purple-100 group-hover:bg-purple-200 rounded-full">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-900">Manage Gates</span>
              </button>
              
              <button className="flex flex-col items-center gap-3 p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
                <div className="p-2 bg-orange-100 group-hover:bg-orange-200 rounded-full">
                  <Settings className="h-5 w-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-900">System Settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Ferry Status */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Live Ferry Status</h3>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-600 font-medium">Live</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">MV Islander</h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    En Route
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Departure:</span>
                    <span className="font-medium">9:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ETA:</span>
                    <span className="font-medium">11:45 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacity:</span>
                    <span className="font-medium">85% (42/50)</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">MV Coastal</h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Docking
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Arrival:</span>
                    <span className="font-medium">10:15 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gate:</span>
                    <span className="font-medium">Gate 2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Passengers:</span>
                    <span className="font-medium">38/60</span>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">MV Pacific</h4>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Maintenance
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium">Scheduled Maintenance</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Expected:</span>
                    <span className="font-medium">2:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Route:</span>
                    <span className="font-medium">Route C</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtected>
  );
};

export default OperationManagerDashboard;