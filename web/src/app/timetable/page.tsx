"use client";

import React, { useState } from 'react';
import RoleProtected from '@/components/RoleProtected';
import BreadcrumbComponent from '@/components/Bread-crumb';
import ScheduleTimetable from '@/components/ScheduleTimetable';
import { generateBreadcrumbs } from '@/components/Bread-crumb/breadcrumbUtils';
import { Calendar, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

const TimetablePage = () => {
  const [showPastSchedules, setShowPastSchedules] = useState(false);

  const breadcrumbItems = generateBreadcrumbs('timetable');

  return (
    <RoleProtected allowedRoles={['ADMIN', 'OPERATOR', 'CUSTOMER']}>
      <div className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <BreadcrumbComponent items={breadcrumbItems} />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Bảng Thời Gian Lịch Trình
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Xem lịch trình các chuyến phà từ hiện tại đến tương lai
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-4">
                {/* Past Schedules Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Hiển thị chuyến đã qua:
                  </span>
                  <button
                    onClick={() => setShowPastSchedules(!showPastSchedules)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showPastSchedules
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {showPastSchedules ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    <span>{showPastSchedules ? 'Bật' : 'Tắt'}</span>
                  </button>
                </div>

                {/* View Toggle - Future feature */}
                <div className="flex items-center space-x-1 bg-white border border-gray-300 rounded-lg">
                  <button
                    className="px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-l-lg border-r border-gray-300"
                    title="Xem dạng bảng"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-r-lg"
                    title="Xem dạng lịch (sắp có)"
                    disabled
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Timetable */}
          <ScheduleTimetable 
            showPastSchedules={showPastSchedules}
            className="w-full"
          />

          {/* Info Footer */}
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  Thời gian thực
                </div>
                <p className="text-gray-600">
                  Dữ liệu được cập nhật liên tục để đảm bảo thông tin chính xác nhất
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">
                  Bộ lọc thông minh
                </div>
                <p className="text-gray-600">
                  Tìm kiếm và lọc theo thời gian, tuyến đường, trạng thái một cách dễ dàng
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">
                  Thông tin chi tiết
                </div>
                <p className="text-gray-600">
                  Hiển thị đầy đủ thông tin về giờ khởi hành, đến nơi, phà, và chỗ trống
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleProtected>
  );
};

export default TimetablePage;
