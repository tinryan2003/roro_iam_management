"use client";

import React, { useState, useMemo } from 'react';
import { useSchedules, ScheduleData } from '@/hooks/useApi';
import { Calendar, Clock, MapPin, Ship, Search } from 'lucide-react';

interface ScheduleTimetableProps {
  showPastSchedules?: boolean;
  className?: string;
}

const ScheduleTimetable: React.FC<ScheduleTimetableProps> = ({ 
  showPastSchedules = false, 
  className = "" 
}) => {
  const [currentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED'>('all');
  const [routeFilter, setRouteFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'today' | 'tomorrow' | 'this_week' | 'next_week' | 'all'>('all');
  
  const pageSize = 50; // Hiển thị nhiều hơn trong bảng
  const { data: scheduleData, loading, error, refetch } = useSchedules(currentPage, pageSize);

  // Lọc và sắp xếp dữ liệu
  const filteredSchedules = useMemo(() => {
    if (!scheduleData?.content) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const filtered = scheduleData.content.filter((schedule: ScheduleData) => {
      const departureTime = new Date(schedule.departureTime);
      const arrivalTime = new Date(schedule.arrivalTime);
      
      // Lọc theo thời gian (past/future)
      if (!showPastSchedules && arrivalTime < now) {
        return false;
      }
      
      // Lọc theo từ khóa tìm kiếm
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          schedule.scheduleCode?.toLowerCase().includes(searchLower) ||
          schedule.route?.routeName?.toLowerCase().includes(searchLower) ||
          schedule.route?.departurePort.portName?.toLowerCase().includes(searchLower) ||
          schedule.route?.arrivalPort.portName?.toLowerCase().includes(searchLower) ||
          schedule.ferry?.ferryName?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Lọc theo trạng thái
      if (statusFilter !== 'all' && schedule.status !== statusFilter) {
        return false;
      }
      
      // Lọc theo route
      if (routeFilter) {
        const routeLower = routeFilter.toLowerCase();
        const matchesRoute = 
          schedule.route?.routeName?.toLowerCase().includes(routeLower) ||
          schedule.route?.departurePort.portName?.toLowerCase().includes(routeLower) ||
          schedule.route?.arrivalPort.portName?.toLowerCase().includes(routeLower);
        
        if (!matchesRoute) return false;
      }
      
      // Lọc theo thời gian cụ thể
      if (timeFilter !== 'all') {
        switch (timeFilter) {
          case 'today':
            if (departureTime < today || departureTime >= tomorrow) return false;
            break;
          case 'tomorrow':
            const dayAfterTomorrow = new Date(tomorrow);
            dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
            if (departureTime < tomorrow || departureTime >= dayAfterTomorrow) return false;
            break;
          case 'this_week':
            if (departureTime < today || departureTime >= nextWeek) return false;
            break;
          case 'next_week':
            const weekAfterNext = new Date(nextWeek);
            weekAfterNext.setDate(weekAfterNext.getDate() + 7);
            if (departureTime < nextWeek || departureTime >= weekAfterNext) return false;
            break;
        }
      }
      
      return true;
    });
    
    // Sắp xếp theo thời gian khởi hành
    return filtered.sort((a, b) => {
      const timeA = new Date(a.departureTime).getTime();
      const timeB = new Date(b.departureTime).getTime();
      return timeA - timeB;
    });
  }, [scheduleData, searchTerm, statusFilter, routeFilter, timeFilter, showPastSchedules]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BOARDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DEPARTED': return 'bg-green-100 text-green-800 border-green-200';
      case 'ARRIVED': return 'bg-gray-100 text-gray-800 border-gray-200';
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
      return { label: 'Đã hoàn thành', color: 'text-gray-500' };
    } else if (departureTime <= now && arrivalTime >= now) {
      return { label: 'Đang di chuyển', color: 'text-green-600 font-semibold' };
    } else {
      const hoursUntilDeparture = Math.ceil((departureTime.getTime() - now.getTime()) / (1000 * 60 * 60));
      if (hoursUntilDeparture <= 2) {
        return { label: 'Sắp khởi hành', color: 'text-orange-600 font-semibold' };
      } else if (hoursUntilDeparture <= 24) {
        return { label: `${hoursUntilDeparture}h nữa`, color: 'text-blue-600' };
      } else {
        const daysUntilDeparture = Math.ceil(hoursUntilDeparture / 24);
        return { label: `${daysUntilDeparture} ngày nữa`, color: 'text-gray-600' };
      }
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getDuration = (departureTime: string, arrivalTime: string) => {
    const departure = new Date(departureTime);
    const arrival = new Date(arrivalTime);
    const durationMs = arrival.getTime() - departure.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="mb-4">Lỗi tải dữ liệu lịch trình: {error}</p>
          <button
            onClick={refetch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Bảng Thời Gian Lịch Trình
            </h2>
          </div>
          <div className="text-sm text-gray-500">
            {filteredSchedules.length} chuyến
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Filter */}
          <select
            title="Lọc theo thời gian"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay</option>
            <option value="tomorrow">Ngày mai</option>
            <option value="this_week">Tuần này</option>
            <option value="next_week">Tuần sau</option>
          </select>

          {/* Status Filter */}
          <select
            title="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'ARRIVED' | 'CANCELLED' | 'DELAYED')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="SCHEDULED">Đã lên lịch</option>
            <option value="BOARDING">Đang lên tàu</option>
            <option value="DEPARTED">Đã khởi hành</option>
            <option value="ARRIVED">Đã đến</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="DELAYED">Trễ chuyến</option>
          </select>

          {/* Route Filter */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Lọc theo tuyến..."
              value={routeFilter}
              onChange={(e) => setRouteFilter(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setRouteFilter('');
              setTimeFilter('all');
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã chuyến
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tuyến đường
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khởi hành
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Đến nơi
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian di chuyển
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phà
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Chỗ trống
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Thời gian còn lại
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">Không tìm thấy lịch trình</p>
                  <p>Hãy thử điều chỉnh bộ lọc hoặc tìm kiếm khác.</p>
                </td>
              </tr>
            ) : (
              filteredSchedules.map((schedule) => {
                const departureDateTime = formatDateTime(schedule.departureTime);
                const arrivalDateTime = formatDateTime(schedule.arrivalTime);
                const timeIndicator = getTimeIndicator(schedule);
                
                return (
                  <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.scheduleCode || `#${schedule.id}`}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {schedule.route?.routeName || 'Chưa có tên'}
                        </div>
                        <div className="text-gray-500 flex items-center">
                          <span>{schedule.route?.departurePort.portName}</span>
                          <span className="mx-2">→</span>
                          <span>{schedule.route?.arrivalPort.portName}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{departureDateTime.time}</div>
                        <div className="text-gray-500">{departureDateTime.date}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">{arrivalDateTime.time}</div>
                        <div className="text-gray-500">{arrivalDateTime.date}</div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                        {getDuration(schedule.departureTime, schedule.arrivalTime)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Ship className="h-4 w-4 mr-1 text-gray-400" />
                        {schedule.ferry?.ferryName || 'Chưa phân công'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-900">
                          <span className="font-medium">{schedule.availablePassengerSpaces}</span> hành khách
                        </div>
                        <div className="text-gray-500">
                          <span className="font-medium">{schedule.availableVehicleSpaces}</span> xe
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${timeIndicator.color}`}>
                        {timeIndicator.label}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer with summary */}
      {filteredSchedules.length > 0 && (
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="text-sm text-gray-600">
            Hiển thị {filteredSchedules.length} chuyến từ tổng số {scheduleData?.totalElements || 0} chuyến
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTimetable;
