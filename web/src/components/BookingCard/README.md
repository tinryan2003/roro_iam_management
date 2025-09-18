# BookingCard Components

A comprehensive set of React components for managing booking data in the RORO Ferry Management System.

## Components

### 1. BookingDetailModal
Displays detailed information about a booking in a modal format.

```tsx
import { BookingDetailModal } from '@/components/BookingCard';

<BookingDetailModal
  booking={bookingData}
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onEdit={(booking) => handleEdit(booking)}
  onDelete={(booking) => handleDelete(booking)}
/>
```

### 2. BookingEditModal
Provides a form interface for editing booking information.

```tsx
import { BookingEditModal } from '@/components/BookingCard';

<BookingEditModal
  booking={bookingData}
  isOpen={isEditModalOpen}
  onClose={() => setIsEditModalOpen(false)}
  onSuccess={() => {
    refetchBookings();
    setIsEditModalOpen(false);
  }}
/>
```

### 3. BookingDeleteModal
Confirmation modal for deleting a booking with safety checks.

```tsx
import { BookingDeleteModal } from '@/components/BookingCard';

<BookingDeleteModal
  booking={bookingData}
  isOpen={isDeleteModalOpen}
  onClose={() => setIsDeleteModalOpen(false)}
  onSuccess={() => {
    refetchBookings();
    setIsDeleteModalOpen(false);
  }}
/>
```

### 4. AddBookingCard
Button component that opens a modal form for creating new bookings.

```tsx
import { AddBookingCard } from '@/components/BookingCard';

<AddBookingCard
  onBookingAdded={() => refetchBookings()}
  buttonText="Create New Booking"
  className="my-custom-class"
/>
```

## BookingData Interface

```tsx
interface BookingData {
  id?: number;
  bookingCode?: string;
  customerId?: number;
  routeId?: number;
  ferryId?: number;
  vehicleId?: number[];
  passengerCount: number;
  totalAmount: number;
  departureTime?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  note?: string;
  route?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: number;
  vehicleType?: string;
}
```

## Complete Usage Example

```tsx
import React, { useState } from 'react';
import { 
  BookingDetailModal, 
  BookingEditModal, 
  BookingDeleteModal, 
  AddBookingCard 
} from '@/components/BookingCard';

const BookingsPage = () => {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setViewModalOpen(true);
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setEditModalOpen(true);
  };

  const handleDeleteBooking = (booking) => {
    setSelectedBooking(booking);
    setDeleteModalOpen(true);
  };

  const handleModalClose = () => {
    setViewModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedBooking(null);
  };

  const handleBookingUpdated = () => {
    // Refresh your booking list here
    console.log('Booking updated, refreshing list...');
    handleModalClose();
  };

  return (
    <div>
      {/* Add new booking button */}
      <AddBookingCard
        onBookingAdded={handleBookingUpdated}
        buttonText="Add New Booking"
      />

      {/* Your booking list here */}
      {/* ... */}

      {/* Modals */}
      {selectedBooking && (
        <>
          <BookingDetailModal
            booking={selectedBooking}
            isOpen={viewModalOpen}
            onClose={handleModalClose}
            onEdit={handleEditBooking}
            onDelete={handleDeleteBooking}
          />

          <BookingEditModal
            booking={selectedBooking}
            isOpen={editModalOpen}
            onClose={handleModalClose}
            onSuccess={handleBookingUpdated}
          />

          <BookingDeleteModal
            booking={selectedBooking}
            isOpen={deleteModalOpen}
            onClose={handleModalClose}
            onSuccess={handleBookingUpdated}
          />
        </>
      )}
    </div>
  );
};
```

## Features

- **Responsive Design**: All components are fully responsive and work on mobile and desktop
- **Accessibility**: Proper ARIA labels, keyboard navigation, and screen reader support
- **Form Validation**: Built-in validation for required fields and data types
- **Error Handling**: Comprehensive error states and user feedback
- **Loading States**: Visual feedback during async operations
- **Consistent Styling**: Matches the design system used throughout the application
- **TypeScript Support**: Full type safety with TypeScript interfaces

## Styling

All components use Tailwind CSS classes and follow the design system established in the RORO Ferry Management System. The components are styled to match the existing ferry management interfaces.

## Status Values

The booking status field supports the following values:
- `PENDING` - Booking is awaiting approval
- `CONFIRMED` - Booking has been confirmed
- `IN_PROGRESS` - Booking is currently in progress
- `COMPLETED` - Booking has been completed
- `CANCELLED` - Booking has been cancelled