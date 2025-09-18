package org.vgu.backend.service.booking;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.BookingUpdateRequest;
import org.vgu.backend.model.Booking;
import org.vgu.backend.repository.BookingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AsyncBookingUpdateService {

    private final BookingRepository bookingRepository;

    @Async("asyncBookingUpdateExecutor")
    @Transactional
    public CompletableFuture<Booking> updateBookingAsync(Long bookingId, BookingUpdateRequest request) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Starting async booking update for ID: {}", bookingId);

                // Simulate some processing time
                Thread.sleep(2000);

                Booking booking = bookingRepository.findById(bookingId)
                        .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

                // Update booking fields
                updateBookingFields(booking, request);

                // Save the updated booking
                Booking updatedBooking = bookingRepository.save(booking);
                log.info("Successfully updated booking ID: {}", bookingId);

                // Send notification if not skipped
                if (!request.getSkipAsyncNotification()) {
                    sendUpdateNotification(updatedBooking);
                }

                return updatedBooking;

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Async booking update interrupted for ID: {}", bookingId, e);
                throw new RuntimeException("Booking update was interrupted", e);
            } catch (Exception e) {
                log.error("Error updating booking ID: {}", bookingId, e);
                throw new RuntimeException("Failed to update booking: " + e.getMessage(), e);
            }
        });
    }

    @Async("asyncBookingUpdateExecutor")
    @Transactional
    public CompletableFuture<List<Booking>> batchUpdateBookingsAsync(List<BookingUpdateRequest> requests) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Starting batch async booking update for {} requests", requests.size());

                List<Booking> updatedBookings = new ArrayList<>();

                for (BookingUpdateRequest request : requests) {
                    if (request.getId() != null) {
                        Booking booking = bookingRepository.findById(request.getId())
                                .orElseThrow(
                                        () -> new RuntimeException("Booking not found with ID: " + request.getId()));

                        updateBookingFields(booking, request);
                        updatedBookings.add(booking);
                    }
                }

                // Simulate batch processing time
                Thread.sleep(1000 * requests.size());

                List<Booking> savedBookings = bookingRepository.saveAll(updatedBookings);
                log.info("Successfully updated {} bookings", savedBookings.size());

                // Send batch notification if not skipped (checking first request)
                if (!requests.isEmpty() && !requests.get(0).getSkipAsyncNotification()) {
                    sendBatchUpdateNotification(savedBookings);
                }

                return savedBookings;

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Batch async booking update interrupted", e);
                throw new RuntimeException("Batch booking update was interrupted", e);
            } catch (Exception e) {
                log.error("Error in batch booking update", e);
                throw new RuntimeException("Failed to update bookings: " + e.getMessage(), e);
            }
        });
    }

    @Async("asyncBookingUpdateExecutor")
    public CompletableFuture<Map<String, Object>> getUpdateStatusAsync(Long bookingId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                log.info("Getting async update status for booking ID: {}", bookingId);

                Booking booking = bookingRepository.findById(bookingId)
                        .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + bookingId));

                // Simulate checking async operation status
                Thread.sleep(500);

                Map<String, Object> status = new HashMap<>();
                status.put("bookingId", bookingId);
                status.put("bookingCode", booking.getBookingCode());
                status.put("currentStatus", booking.getStatus().toString());
                status.put("lastUpdated", booking.getUpdatedAt().toString());
                status.put("asyncStatus", "COMPLETED");
                status.put("message", "Booking update status retrieved successfully");

                return status;

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("Status check interrupted for booking ID: {}", bookingId, e);
                throw new RuntimeException("Status check was interrupted", e);
            } catch (Exception e) {
                log.error("Error getting status for booking ID: {}", bookingId, e);
                throw new RuntimeException("Failed to get booking status: " + e.getMessage(), e);
            }
        });
    }

    private void updateBookingFields(Booking booking, BookingUpdateRequest request) {
        if (request.getCustomerId() != null) {
            // Update customer if needed
            // booking.setCustomerId(request.getCustomerId());
        }

        if (request.getRouteId() != null) {
            // Update route if needed
            // booking.setRouteId(request.getRouteId());
        }

        if (request.getFerryId() != null) {
            // Update ferry if needed
            // booking.setFerryId(request.getFerryId());
        }

        if (request.getBookingCode() != null) {
            booking.setBookingCode(request.getBookingCode());
        }

        if (request.getPassengerCount() != null) {
            booking.setPassengerCount(request.getPassengerCount());
        }

        if (request.getTotalAmount() != null) {
            booking.setTotalAmount(request.getTotalAmount());
        }

        if (request.getUpdateNotes() != null) {
            // Store update notes if the booking model supports it
            // booking.setUpdateNotes(request.getUpdateNotes());
        }

        // Always update the last modified timestamp
        booking.setUpdatedAt(LocalDateTime.now());
    }

    private void sendUpdateNotification(Booking booking) {
        log.debug("Update notification removed for booking ID: {}", booking.getId());
    }

    private void sendBatchUpdateNotification(List<Booking> bookings) {
        log.debug("Batch update notification removed for {} bookings", bookings.size());
    }
}
