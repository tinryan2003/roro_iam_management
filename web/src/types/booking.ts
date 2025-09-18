export interface BookingResult {
  id: number;
  bookingCode: string;
  customerId: number;
  scheduleId: number;
  vehicleId?: number;
  passengerCount: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  // Helper fields from schedule
  route?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface BookingResponse {
  id: number;
  bookingCode: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  scheduleId: number;
  routeName?: string;
  ferryName?: string;
  departureTime?: string;
  arrivalTime?: string;
  passengerCount: number;
  totalAmount: number;
  status: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  paymentDeadline?: string;
  checkInDeadline?: string;
  
  // Refund fields
  refundRequested?: boolean;
  refundApproved?: boolean;
  refundRejected?: boolean;
  refundReason?: string;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundProcessedBy?: string;
  refundNotes?: string;
}

export interface ApprovalResponse {
  id: number;
  bookingId: number;
  bookingCode: string;
  status: string;
  reviewStartedAt?: string;
  reviewDeadline?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
}

export interface VehicleResponse {
  id: number;
  type: string;
  licensePlate: string;
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
}

export interface BookingFormErrors {
  general?: string;
  schedule?: string;
  capacity?: string;
  payment?: string;
}

export interface CreateBookingRequest {
  scheduleId: number;
  passengerCount: number;
  note?: string;
}

export interface CancelBookingRequest {
  reason: string;
}

export interface RefundRequestDto {
  reason: string;
  additionalInfo?: string;
}

export interface RefundDecisionDto {
  approved: boolean;
  notes?: string;
}
