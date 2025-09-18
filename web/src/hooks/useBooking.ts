"use client";

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface BookingData {
  route: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  vehicleType?: string;
  ferryId: string;
  customerId?: number;
  routeId?: number;
  vehicleId?: number;
  passengerCount: number;
  totalAmount: number;
  departureTime?: string;
}

export function useBooking() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const createBooking = async (bookingData: BookingData) => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.accessToken}`,
        },
        body: JSON.stringify(bookingData),
      });

      // Handle authentication/authorization errors consistently
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      if (response.status === 403) {
        throw new Error('Forbidden');
      }

      if (!response.ok) throw new Error('Booking failed');
      return await response.json();
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading };
} 