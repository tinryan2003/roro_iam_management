export interface ScheduleData {
  id: number;
  routeId: number;
  routeName: string;
  ferryId: number;
  ferryName: string;
  ferryCode: string;
  departurePortName: string;
  arrivalPortName: string;
  departureTime: string;
  arrivalTime: string;
  status: ScheduleStatus;
  availableVehicleSpaces: number;
  availablePassengerSpaces: number;
  basePrice: number;
  bookingDeadline?: string;
  checkInStartTime?: string;
  checkInEndTime?: string;
  isBookingOpen: boolean;
  notes?: string;
}

export type ScheduleStatus = 
  | 'SCHEDULED'
  | 'BOARDING'
  | 'DEPARTED'
  | 'ARRIVED'
  | 'CANCELLED'
  | 'DELAYED'
  | 'MAINTENANCE'
  | 'WEATHER_HOLD';

export interface ScheduleSearchParams {
  departurePortId?: number;
  arrivalPortId?: number;
  departureDate?: string;
  status?: ScheduleStatus;
}

export interface ScheduleCapacity {
  scheduleId: number;
  totalVehicleCapacity: number;
  totalPassengerCapacity: number;
  availableVehicleSpaces: number;
  availablePassengerSpaces: number;
  isBookingOpen: boolean;
  bookingDeadline?: string;
}

// Updated booking payload to use scheduleId
export interface BookingCreatePayload {
  customerId: number;
  scheduleId: number;  // Changed from routeId + ferryId
  vehicleId?: number;
  passengerCount: number;
  totalAmount: number;
  bookingCode?: string;
}
