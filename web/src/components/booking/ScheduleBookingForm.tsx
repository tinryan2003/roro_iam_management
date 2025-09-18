"use client";

import React, { useState, useEffect } from 'react';
import { useScheduleSearch, useScheduleCapacity } from '@/hooks/useSchedule';
import { useCreatePublicBooking, useCreateVehicle } from '@/hooks/useApi';
import { BookingCreatePayload } from '@/hooks/useApi';
import { ScheduleData } from '@/types/schedule';
import { BookingResult } from '@/types/booking';
import { Plus } from 'lucide-react';
import { useAddVehicleToBooking } from '@/hooks/useApi';
import { useCurrentCustomerUser } from '@/hooks/useApi';

interface ScheduleBookingFormProps {
  onSuccess?: (result: BookingResult) => void;
  onError?: (error: string) => void;
}

interface VehicleData {
  id: number;
  vehicleType: 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRUCK' | 'VAN';
  make: string;
  model: string;
  quantity: number;
  isActive: boolean;
  price: number;
}


export default function ScheduleBookingForm({ onSuccess, onError }: ScheduleBookingFormProps) {
  //customer
  const { data: currentCustomer } = useCurrentCustomerUser();
  const customerId = currentCustomer?.customer?.id;

  // Date formatting function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date string:', dateString);
      return 'Invalid Date Format';
    }
    
    // Format as YYYY-MM-DD HH:mm:ss
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };
  
  // This is a PUBLIC booking form - no authentication required
  // Use a configurable default customer ID (must exist in the backend DB)
  const defaultCustomerId = Number(process.env.NEXT_PUBLIC_PUBLIC_CUSTOMER_ID || 1);
  
  // Enable vehicle management for RoRo operations
  const { data: schedules, loading: searchLoading, searchSchedules } = useScheduleSearch();
  const { data: capacityInfo, refetch: checkCapacity } = useScheduleCapacity();
  const { createBooking, loading: bookingLoading } = useCreatePublicBooking();
  const { addVehicle } = useAddVehicleToBooking();
  const [error, setError] = useState<string | null>(null);
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
  const [newVehicleForm, setNewVehicleForm] = useState({
    vehicleType: 'CAR' as 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRUCK' | 'VAN',
    make: '',
    model: '',
    quantity: 1,
  });
  const { createVehicle, loading: vehicleCreationLoading } = useCreateVehicle(customerId);

  const [searchParams, setSearchParams] = useState({
    departureDate: '',
    departurePortId: undefined as number | undefined,
    arrivalPortId: undefined as number | undefined,
  });

  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleData | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);

  const [localVehicles, setLocalVehicles] = useState<VehicleData[]>([]);

  const calculateTotalAmount = () => {
    // Coerce to numbers and default to 0 to avoid NaN in JSON (NaN -> null)
    const base = Number(selectedSchedule?.basePrice ?? 0);
    const localVehiclesTotal = localVehicles.reduce((sum, vehicle) => sum + Number(vehicle?.price ?? 0)*Number(vehicle?.quantity ?? 0), 0);
    const total = base + localVehiclesTotal;
    // Ensure a finite non-negative number
    return Number.isFinite(total) && total >= 0 ? total : 0;
  };

  const handleCreateNewVehicle = async () => {
    if (!newVehicleForm.vehicleType) {
      setError('Vehicle type is required.');
      return;
    }
    if (newVehicleForm.quantity <= 0) {
      setError('Vehicle quantity must be at least 1.');
      return;
    }

    if (!selectedSchedule || !capacityInfo) {
      setError('Please select a schedule and ensure capacity info is loaded.');
      return;
    }

    const availableSpaces = capacityInfo.availableVehicleSpaces;
    const currentVehicleCount = localVehicles.reduce((sum, v) => sum + v.quantity, 0);

    if (currentVehicleCount + newVehicleForm.quantity > availableSpaces) {
      setError(`Adding this vehicle would exceed available vehicle spaces. Available: ${availableSpaces - currentVehicleCount}`);
      return;
    }

    setError(null);
    // Instead of directly creating the vehicle, add it to local state
    // The price needs to be derived from the VehicleType enum (which is a backend concept)
    // For now, let's mock it or assume we have a way to get the price based on type.
    // Since VehicleResponse now includes price, we should have it available in the 'vehicles' data.
    // A more robust solution might involve a dedicated endpoint to get vehicle type prices.

    // For simplicity, let's find the price from existing fetched vehicles if available,
    // or use a default/mocked price based on type for new vehicles
    const newVehiclePrice = getVehicleTypePrice(newVehicleForm.vehicleType); // Need to implement this helper

    const tempVehicleId = Date.now(); // Unique ID for local state
    const newLocalVehicle: VehicleData = {
      id: tempVehicleId,
      vehicleType: newVehicleForm.vehicleType,
      make: newVehicleForm.make,
      model: newVehicleForm.model,
      quantity: newVehicleForm.quantity,
      isActive: true, // Assuming new vehicles are active
      price: newVehiclePrice,
    };

    setLocalVehicles(prev => [...prev, newLocalVehicle]);
    setShowNewVehicleForm(false);
    setNewVehicleForm({
      vehicleType: 'CAR',
      make: '',
      model: '',
      quantity: 1,
    });
  };

  const handleRemoveLocalVehicle = (id: number) => {
    setLocalVehicles(prev => prev.filter(v => v.id !== id));
  };

  // Helper function to get vehicle type price - this needs to be implemented
  // For now, a simple mock or lookup from existing vehicles
  const getVehicleTypePrice = (type: 'CAR' | 'TRUCK' | 'MOTORCYCLE' | 'BUS' | 'VAN') => {
    // Ideally, fetch this from an API or a global config
    // For this example, let's use hardcoded values based on VehicleType enum prices added in backend
    switch (type) {
      case 'CAR': return 25.00;
      case 'TRUCK': return 50.00;
      case 'MOTORCYCLE': return 15.00;
      case 'BUS': return 75.00;
      case 'VAN': return 35.00;
      default: return 0.00;
    }
  };

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSearchParams(prev => ({
      ...prev,
      departureDate: tomorrow.toISOString().split('T')[0]
    }));
  }, []);

  const handleSearch = async () => {
    if (!searchParams.departureDate) {
      setError('Please select a departure date');
      return;
    }

    console.log('🔍 Searching schedules with params:', searchParams);
    setError(null);
    
    try {
      await searchSchedules({
        departureDate: searchParams.departureDate,
        departurePortId: searchParams.departurePortId,
        arrivalPortId: searchParams.arrivalPortId,
        status: 'SCHEDULED'
      });
      console.log('✅ Search completed, found schedules:', schedules.length);
    } catch (error) {
      console.error('❌ Search failed:', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleScheduleSelect = async (schedule: ScheduleData) => {
    setSelectedSchedule(schedule);
    await checkCapacity(schedule.id);
  };


  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchedule) return;

    try {
      // First, create any locally added vehicles in the backend
      const createdVehicleIds: number[] = [];
      for (const localVehicle of localVehicles) {
        const created = await createVehicle({
          vehicleType: localVehicle.vehicleType,
          make: localVehicle.make,
          model: localVehicle.model,
          quantity: localVehicle.quantity,
        });
        if (created?.id) {
          createdVehicleIds.push(created.id);
        }
      }

      // Combine selected existing vehicle and newly created vehicles
      const allVehicleIds = createdVehicleIds;

      // The backend BookingCreatePayload expects a single vehicleId, so we will only send the first one
      // if there are multiple, or none if no vehicles are selected/added. This might need backend adjustment.
      const vehicleIdToSend = allVehicleIds.length > 0 ? allVehicleIds[0] : undefined; // Only send one for now

      const payload: BookingCreatePayload = {
        scheduleId: selectedSchedule.id,
        passengerCount,
        customerId: defaultCustomerId,
        vehicleId: vehicleIdToSend, // Add selected vehicle ID to payload
        totalAmount: calculateTotalAmount(), // Use calculated total amount
      };

      console.debug('[DEBUG_LOG] Submitting public booking payload', payload);
      const bookingResponse = await createBooking(payload);

      if (bookingResponse?.booking?.id) {
        // If there are more vehicles to add (beyond the first one sent in payload),
        // we need to call addVehicle for each remaining vehicle. This assumes backend supports it.
        for (let i = 1; i < allVehicleIds.length; i++) {
          await addVehicle(bookingResponse.booking.id, allVehicleIds[i]);
        }
        onSuccess?.(bookingResponse.booking); 
      } else {
        onSuccess?.(bookingResponse.booking);
      }

    } catch (err: unknown) {
      console.error("Booking submission error:", err);
      onError?.(err instanceof Error ? err.message : "Failed to create booking");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Book RoRo Vehicle Ferry</h2>

      {/* Search Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Search Ferry Departures</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="departure-date" className="block text-sm font-medium text-gray-700 mb-2">
              Departure Date
            </label>
            <input
              id="departure-date"
              type="date"
              value={searchParams.departureDate}
              onChange={(e) => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select departure date"
              required
            />
          </div>
          
          <div>
            <label htmlFor="departure-port" className="block text-sm font-medium text-gray-700 mb-2">
              Loading Port (Optional)
            </label>
            <input
              id="departure-port"
              type="number"
              placeholder="Port ID"
              value={searchParams.departurePortId || ''}
              onChange={(e) => setSearchParams(prev => ({ 
                ...prev, 
                departurePortId: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Enter departure port ID (optional)"
            />
          </div>
          
          <div>
            <label htmlFor="arrival-port" className="block text-sm font-medium text-gray-700 mb-2">
              Discharge Port (Optional)
            </label>
            <input
              id="arrival-port"
              type="number"
              placeholder="Port ID"
              value={searchParams.arrivalPortId || ''}
              onChange={(e) => setSearchParams(prev => ({ 
                ...prev, 
                arrivalPortId: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Enter arrival port ID (optional)"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {searchLoading ? 'Searching...' : 'Find Available Departures'}
        </button>
      </div>

      {/* Schedule Results */}
      {schedules.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Available Ferry Departures</h3>
          
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSchedule?.id === schedule.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleScheduleSelect(schedule)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{schedule.routeName}</h4>
                    <p className="text-sm text-gray-600">
                      {schedule.departurePortName} → {schedule.arrivalPortName}
                    </p>
                    <p className="text-sm text-gray-600">
                      Ferry: {schedule.ferryName} ({schedule.ferryCode})
                    </p>
                    <p className="text-sm text-gray-600">
                      Departure: {formatDate(schedule.departureTime)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${schedule.basePrice}</p>
                    <p className="text-sm text-gray-600">
                      Vehicle Deck: {schedule.availableVehicleSpaces || 0} spaces available
                    </p>
                    <p className="text-sm text-gray-600">
                      Drivers/Crew: {schedule.availablePassengerSpaces || 0} spaces available
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Form */}
      {selectedSchedule && capacityInfo && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">Complete Vehicle Ferry Booking</h3>
          
          <div className="space-y-4">
            {/* Passenger Count */}
            <div>
              <label htmlFor="passenger-count" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Drivers/Crew
              </label>
              <input
                id="passenger-count"
                type="number"
                min="1"
                max={capacityInfo.availablePassengerSpaces}
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Number of drivers/crew"
                placeholder="Enter number of drivers/crew"
              />
            </div>

            {/* Vehicle Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vehicle Selection
              </label>
              
              {/* Locally added vehicles display */}
              {localVehicles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">Vehicles to add:</p>
                  {localVehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50">
                      <span>
                        {vehicle.vehicleType} {vehicle.make} {vehicle.model} (Qty: {vehicle.quantity}) - ${vehicle.price.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocalVehicle(vehicle.id)}
                        className="ml-4 text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Vehicle Button */}
              {!showNewVehicleForm && (
                <button
                  type="button"
                  onClick={() => setShowNewVehicleForm(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add New Vehicle
                </button>
              )}

              {/* New Vehicle Form */}
              {showNewVehicleForm && (
                <div
                  className="mt-3 p-4 border border-gray-200 rounded-md shadow-sm"
                  aria-labelledby="new-vehicle-heading"
                >
                  <h4 id="new-vehicle-heading" className="text-md font-semibold text-gray-800 mb-3">Add New Vehicle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="new-vehicle-type" className="block text-xs font-medium text-gray-600">Vehicle Type *</label>
                      <select
                        id="new-vehicle-type"
                        value={newVehicleForm.vehicleType}
                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, vehicleType: e.target.value as 'CAR' | 'MOTORCYCLE' | 'BUS' | 'TRUCK' | 'VAN' })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="CAR">Car</option>
                        <option value="TRUCK">Truck</option>
                        <option value="MOTORCYCLE">Motorcycle</option>
                        <option value="BUS">Bus</option>
                        <option value="VAN">Van</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="new-vehicle-make" className="block text-xs font-medium text-gray-600">Make</label>
                      <input
                        type="text"
                        id="new-vehicle-make"
                        value={newVehicleForm.make}
                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, make: e.target.value })}
                        placeholder="Toyota"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-vehicle-model" className="block text-xs font-medium text-gray-600">Model</label>
                      <input
                        type="text"
                        id="new-vehicle-model"
                        value={newVehicleForm.model}
                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, model: e.target.value })}
                        placeholder="Camry"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="new-vehicle-quantity" className="block text-xs font-medium text-gray-600">Quantity *</label>
                      <input
                        type="number"
                        id="new-vehicle-quantity"
                        value={newVehicleForm.quantity}
                        onChange={(e) => setNewVehicleForm({ ...newVehicleForm, quantity: parseInt(e.target.value) || 1 })}
                        min="1"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewVehicleForm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateNewVehicle}
                      disabled={vehicleCreationLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {vehicleCreationLoading ? 'Adding...' : 'Add Vehicle'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total Amount:</span>
                <span className="text-xl font-bold">
                  ${calculateTotalAmount().toFixed(2)} {/* Display calculated total amount */}
                </span>
              </div>
            </div>

            {/* Capacity Info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Ferry Departure Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Vehicle Deck Spaces:</span>
                  <span className="ml-2 font-semibold">{capacityInfo.availableVehicleSpaces}</span>
                </div>
                <div>
                  <span className="text-blue-700">Driver/Crew Spaces:</span>
                  <span className="ml-2 font-semibold">{capacityInfo.availablePassengerSpaces}</span>
                </div>
                <div>
                  <span className="text-blue-700">Booking Status:</span>
                  <span className={`ml-2 font-semibold ${capacityInfo.isBookingOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {capacityInfo.isBookingOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                {capacityInfo.bookingDeadline && (
                  <div>
                    <span className="text-blue-700">Deadline:</span>
                    <span className="ml-2 font-semibold">
                      {formatDate(capacityInfo.bookingDeadline)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RoRo Ferry Notice */}
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
              <strong>RoRo Ferry Service:</strong> Roll-on/Roll-off ferry service for passengers and vehicles. Add your vehicle details above if needed.
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleBookingSubmit}
              disabled={bookingLoading || !capacityInfo.isBookingOpen}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              title="Confirm your public booking"
            >
              {bookingLoading ? 'Creating Booking...' : 'Confirm RoRo Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
