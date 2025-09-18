package org.vgu.backend.controllers;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.BookingCreateRequest;
import org.vgu.backend.dto.request.BookingUpdateRequest;
import org.vgu.backend.dto.response.ApprovalResponse;
import org.vgu.backend.dto.response.BookingResponse;
import org.vgu.backend.dto.response.VehicleResponse;
import org.vgu.backend.enums.BookingStatus;
import org.vgu.backend.exception.BusinessException;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Approval;
import org.vgu.backend.model.Booking;
import org.vgu.backend.model.Schedule;
import org.vgu.backend.model.Vehicle;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.repository.ScheduleRepository;
import org.vgu.backend.repository.VehicleRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.booking.IBookingService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/bookings")
@RequiredArgsConstructor
public class BookingController {

        private final BookingRepository bookingRepository;
        private final IBookingService bookingService;
        private final IAccountService accountService;
        private final VehicleRepository vehicleRepository;
        private final ScheduleRepository scheduleRepository;
        private final Logger logger = LoggerFactory.getLogger(BookingController.class);

        /**
         * Get all bookings with pagination
         */
        @GetMapping
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER')")
        public ResponseEntity<Page<BookingResponse>> getAllBookings(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int limit) {
                logger.info("Getting all bookings");
                Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
                Page<Booking> bookings = bookingRepository.findAll(pageable);
                Page<BookingResponse> bookingResponses = bookings.map(this::convertToResponse);
                logger.info("Bookings listed successfully");
                return ResponseEntity.ok(bookingResponses);
        }

        /**
         * Get bookings by customer (for customer dashboard)
         */
        @GetMapping("/my-bookings")
        // @PreAuthorize("hasRole('ROLE_CUSTOMER')") // Temporarily disabled for
        // development
        public ResponseEntity<?> getMyBookings(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int limit,
                        Authentication authentication) {
                try {
                        // Development mode: If authentication is disabled, return bookings for the test
                        // user
                        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                                logger.info("Authentication disabled or invalid - using test user for development");
                                // Use the known test user's account ID (4) from the database
                                Long accountId = 4L;
                                Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
                                Page<Booking> bookings = bookingRepository.findByCustomerAccountId(accountId, pageable);
                                Page<BookingResponse> bookingResponses = bookings.map(this::convertToResponse);

                                logger.info("My bookings listed successfully for test account: {}", accountId);
                                return ResponseEntity.ok(bookingResponses.getContent());
                        }

                        // Extract user identifier from JWT
                        String keycloakId = jwt.getClaimAsString("sub");
                        logger.info("Getting my bookings for user: {}", keycloakId);

                        // Find account by Keycloak ID
                        Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

                        if (accountOpt.isEmpty()) {
                                logger.warn("Account not found for keycloakId: {}", keycloakId);
                                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                                .body(Map.of("error", "Account not found"));
                        }

                        Long accountId = accountOpt.get().getId();
                        Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
                        Page<Booking> bookings = bookingRepository.findByCustomerAccountId(accountId, pageable);
                        Page<BookingResponse> bookingResponses = bookings.map(this::convertToResponse);

                        logger.info("My bookings listed successfully for account: {}", accountId);
                        return ResponseEntity.ok(bookingResponses.getContent());

                } catch (Exception e) {
                        logger.error("Error retrieving user bookings: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to retrieve bookings"));
                }
        }

        /**
         * Get booking by ID
         */
        @GetMapping("/{id}")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
        public ResponseEntity<?> getBookingById(@PathVariable Long id) {
                try {
                        logger.info("Getting booking with id: {}", id);
                        Booking booking = bookingRepository.findById(id)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Booking not found with id: " + id));

                        logger.info("Booking found with id: {}", id);
                        return ResponseEntity.ok(convertToResponse(booking));

                } catch (DataNotFoundException e) {
                        logger.error("Booking not found with id: {}", id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error retrieving booking with id {}: {}", id, e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to retrieve booking"));
                }
        }

        /**
         * Create new booking (authenticated users)
         */
        @PostMapping
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
        public ResponseEntity<?> createBooking(@Valid @RequestBody BookingCreateRequest request) {
                try {
                        logger.info("Creating new booking: {}", request);

                        // Delegate to service (validates ferry availability, calculates price, sets
                        // relations)
                        Booking created = bookingService.createBooking(request);

                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(convertToResponse(created));

                } catch (BusinessException e) {
                        logger.warn("Business rule violation during booking creation: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                        .body(Map.of(
                                                        "error", e.getMessage(),
                                                        "errorCode", e.getErrorCode(),
                                                        "type", "CAPACITY_ERROR"));
                } catch (DataNotFoundException e) {
                        logger.error("Data not found during booking creation: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error creating booking: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Failed to create booking: " + e.getMessage()));
                }
        }

        /**
         * Create new booking (public endpoint - no authentication required)
         * For demo/public booking interface
         */
        @PostMapping("/public/create")
        public ResponseEntity<?> createPublicBooking(@Valid @RequestBody BookingCreateRequest request) {
                try {
                        logger.info("Creating new public booking: {}", request);

                        // Delegate to service (validates ferry availability, calculates price, sets
                        // relations)
                        Booking created = bookingService.createBooking(request);

                        return ResponseEntity.status(HttpStatus.CREATED)
                                        .body(convertToResponse(created));

                } catch (BusinessException e) {
                        logger.warn("Business rule violation during public booking creation: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                        .body(Map.of(
                                                        "error", e.getMessage(),
                                                        "errorCode", e.getErrorCode(),
                                                        "type", "CAPACITY_ERROR"));
                } catch (DataNotFoundException e) {
                        logger.error("Data not found during public booking creation: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error creating public booking: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Failed to create booking: " + e.getMessage()));
                }
        }

        /**
         * Cancel booking
         */
        @PatchMapping("/{id}/cancel")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
        public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
                try {
                        logger.info("Cancelling booking with id: {}", id);
                        Booking booking = bookingRepository.findById(id)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Booking not found with id: " + id));

                        booking.setStatus(BookingStatus.CANCELLED);

                        Booking updatedBooking = bookingRepository.save(booking);

                        logger.info("Booking cancelled successfully with id: {}", id);
                        return ResponseEntity.ok(convertToResponse(updatedBooking));

                } catch (DataNotFoundException e) {
                        logger.error("Booking not found with id: {}", id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error cancelling booking with id {}: {}", id, e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to cancel booking"));
                }
        }

        @PatchMapping("/{id}/update")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
        public ResponseEntity<?> updateBooking(@PathVariable Long id, @RequestBody BookingUpdateRequest updateRequest) {
                try {
                        logger.info("Editing booking with id: {}", id);
                        Booking booking = bookingRepository.findById(id)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Booking not found with id: " + id));

                        // Update booking details
                        booking.setSchedule(scheduleRepository.findById(updateRequest.getScheduleId())
                                        .orElse(booking.getSchedule()));
                        booking.setTotalAmount(updateRequest.getTotalAmount() != null ? updateRequest.getTotalAmount()
                                        : booking.getTotalAmount());
                        booking.setNote(updateRequest.getNotes() != null ? updateRequest.getNotes()
                                        : booking.getNote());
                        Booking updatedBooking = bookingRepository.save(booking);

                        logger.info("Booking edited successfully with id: {}", id);
                        return ResponseEntity.ok(convertToResponse(updatedBooking));

                } catch (DataNotFoundException e) {
                        logger.error("Booking not found with id: {}", id);
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error editing booking with id {}: {}", id, e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to edit booking"));
                }
        }

        /**
         * Check ferry capacity availability for a specific date
         */
        @GetMapping("/capacity/{ferryId}")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
        public ResponseEntity<?> checkFerryCapacity(
                        @PathVariable Long ferryId,
                        @RequestParam String date) {
                try {
                        logger.info("Checking capacity for ferry {} on date {}", ferryId, date);

                        // Parse date string to LocalDate
                        java.time.LocalDate localDate = java.time.LocalDate.parse(date);

                        // Get capacity info from validation service
                        var capacityInfo = bookingService.getFerryCapacityInfo(ferryId, localDate);

                        return ResponseEntity.ok(capacityInfo);

                } catch (Exception e) {
                        logger.error("Error checking ferry capacity: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                        .body(Map.of("error", "Failed to check capacity: " + e.getMessage()));
                }
        }

        /**
         * Get booking statistics (for dashboard)
         */
        @GetMapping("/stats")
        @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
        public ResponseEntity<Map<String, Object>> getBookingStats() {
                logger.info("Getting booking statistics");
                long totalBookings = bookingRepository.count();
                Map<String, Object> stats = Map.of(
                                "totalBookings", totalBookings,
                                "todayBookings", Math.min(totalBookings, 25), // Mock data
                                "thisWeekBookings", Math.min(totalBookings, 150), // Mock data
                                "thisMonthBookings", Math.min(totalBookings, 500) // Mock data
                );
                logger.info("Booking statistics retrieved successfully");
                return ResponseEntity.ok(stats);
        }

        /**
         * Add vehicle to booking
         */
        @PostMapping("/{bookingId}/vehicles/{vehicleId}")
        @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
        @Transactional
        public ResponseEntity<?> addVehicleToBooking(
                        @PathVariable Long bookingId,
                        @PathVariable Long vehicleId) {
                try {
                        logger.info("Adding vehicle {} to booking {}", vehicleId, bookingId);

                        // Validate booking exists and is in correct status
                        Booking booking = bookingRepository.findById(bookingId)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Booking not found with id: " + bookingId));

                        if (booking.getStatus() != BookingStatus.PENDING &&
                                        booking.getStatus() != BookingStatus.CONFIRMED) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error",
                                                                "Can only add vehicles to pending or confirmed bookings"));
                        }

                        // Validate vehicle exists and belongs to customer
                        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Vehicle not found with id: " + vehicleId));

                        if (!vehicle.getCustomer().getId().equals(booking.getCustomer().getId())) {
                                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                                .body(Map.of("error",
                                                                "Vehicle does not belong to the booking customer"));
                        }

                        // Check if vehicle is already attached to another booking
                        if (vehicle.getBooking() != null) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error",
                                                                "Vehicle is already attached to another booking"));
                        }

                        // Check schedule capacity
                        Schedule schedule = booking.getSchedule();
                        if (schedule.getAvailableVehicleSpaces() < vehicle.getQuantity()) {
                                return ResponseEntity.status(HttpStatus.CONFLICT)
                                                .body(Map.of(
                                                                "error",
                                                                "Insufficient vehicle capacity on this schedule",
                                                                "errorCode", "INSUFFICIENT_CAPACITY",
                                                                "type", "CAPACITY_ERROR"));
                        }

                        // Attach vehicle to booking
                        vehicle.setBooking(booking);
                        vehicleRepository.save(vehicle);

                        // Update schedule capacity
                        schedule.setAvailableVehicleSpaces(
                                        schedule.getAvailableVehicleSpaces() - vehicle.getQuantity());
                        scheduleRepository.save(schedule);

                        // Recalculate total amount if needed
                        // This is a simplified version - you might want to implement proper pricing
                        // logic
                        BigDecimal newTotal = booking.getTotalAmount().add(
                                        BigDecimal.valueOf(vehicle.getQuantity()).multiply(BigDecimal.valueOf(45.00)) // Base
                                                                                                                      // price
                                                                                                                      // per
                                                                                                                      // vehicle
                        );
                        booking.setTotalAmount(newTotal);
                        bookingRepository.save(booking);

                        logger.info("Vehicle {} successfully added to booking {}", vehicleId, bookingId);
                        return ResponseEntity.ok(Map.of(
                                        "message", "Vehicle added to booking successfully",
                                        "booking", convertToResponse(booking)));

                } catch (DataNotFoundException e) {
                        logger.error("Data not found: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error adding vehicle to booking: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to add vehicle to booking"));
                }
        }

        /**
         * Remove vehicle from booking
         */
        @DeleteMapping("/{bookingId}/vehicles/{vehicleId}")
        @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_OPERATOR')")
        @Transactional
        public ResponseEntity<?> removeVehicleFromBooking(
                        @PathVariable Long bookingId,
                        @PathVariable Long vehicleId) {
                try {
                        logger.info("Removing vehicle {} from booking {}", vehicleId, bookingId);

                        // Validate booking exists
                        Booking booking = bookingRepository.findById(bookingId)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Booking not found with id: " + bookingId));

                        // Validate vehicle exists and is attached to this booking
                        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                                        .orElseThrow(() -> new DataNotFoundException(
                                                        "Vehicle not found with id: " + vehicleId));

                        if (vehicle.getBooking() == null || !vehicle.getBooking().getId().equals(bookingId)) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error", "Vehicle is not attached to this booking"));
                        }

                        // Check if booking can be modified
                        if (booking.getStatus() != BookingStatus.PENDING &&
                                        booking.getStatus() != BookingStatus.CONFIRMED) {
                                return ResponseEntity.badRequest()
                                                .body(Map.of("error",
                                                                "Cannot modify vehicles for bookings in current status"));
                        }

                        // Detach vehicle from booking
                        vehicle.setBooking(null);
                        vehicleRepository.save(vehicle);

                        // Restore schedule capacity
                        Schedule schedule = booking.getSchedule();
                        schedule.setAvailableVehicleSpaces(
                                        schedule.getAvailableVehicleSpaces() + vehicle.getQuantity());
                        scheduleRepository.save(schedule);

                        // Recalculate total amount
                        BigDecimal newTotal = booking.getTotalAmount().subtract(
                                        BigDecimal.valueOf(vehicle.getQuantity()).multiply(BigDecimal.valueOf(45.00)) // Base
                                                                                                                      // price
                                                                                                                      // per
                                                                                                                      // vehicle
                        );
                        if (newTotal.compareTo(BigDecimal.ZERO) < 0) {
                                newTotal = BigDecimal.ZERO;
                        }
                        booking.setTotalAmount(newTotal);
                        bookingRepository.save(booking);

                        logger.info("Vehicle {} successfully removed from booking {}", vehicleId, bookingId);
                        return ResponseEntity.ok(Map.of(
                                        "message", "Vehicle removed from booking successfully",
                                        "booking", convertToResponse(booking)));

                } catch (DataNotFoundException e) {
                        logger.error("Data not found: {}", e.getMessage());
                        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                                        .body(Map.of("error", e.getMessage()));
                } catch (Exception e) {
                        logger.error("Error removing vehicle from booking: {}", e.getMessage(), e);
                        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                        .body(Map.of("error", "Failed to remove vehicle from booking"));
                }
        }

        /**
         * Convert Booking entity to BookingResponse DTO
         */
        private BookingResponse convertToResponse(Booking booking) {
                logger.info("Converting booking to response: {}", booking.getId());

                // Convert vehicles to VehicleResponse (prevent deep nesting by limiting data)
                List<VehicleResponse> vehicleResponses = booking.getVehicles().stream()
                                .map(v -> VehicleResponse.builder()
                                                .id(v.getId())
                                                .vehicleType(v.getVehicleType().toString())
                                                .make(v.getMake())
                                                .model(v.getModel())
                                                .quantity(v.getQuantity())
                                                .isActive(v.getIsActive())
                                                .bookingId(booking.getId())
                                                .bookingCode(booking.getBookingCode())
                                                .build())
                                .collect(Collectors.toList());

                return BookingResponse.builder()
                                .id(booking.getId())
                                .bookingCode(booking.getBookingCode())
                                .passengerCount(booking.getPassengerCount())
                                .totalAmount(
                                                booking.getTotalAmount() != null
                                                                ? booking.getTotalAmount().doubleValue()
                                                                : Double.valueOf(0))
                                .departureTime(booking.getSchedule() != null
                                                && booking.getSchedule().getDepartureTime() != null
                                                                ? booking.getSchedule().getDepartureTime().toString()
                                                                : null)
                                .customerId(booking.getCustomer() != null ? booking.getCustomer().getId() : null)
                                .routeId(booking.getSchedule() != null && booking.getSchedule().getRoute() != null
                                                ? booking.getSchedule().getRoute().getId()
                                                : null)
                                .ferryId(booking.getSchedule() != null && booking.getSchedule().getFerry() != null
                                                ? booking.getSchedule().getFerry().getId()
                                                : null)
                                .status(booking.getStatus() != null ? booking.getStatus().toString() : null)
                                .createdAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null)
                                .updatedAt(booking.getUpdatedAt() != null ? booking.getUpdatedAt().toString() : null)
                                .note(booking.getNote() != null ? booking.getNote() : null)

                                // Workflow fields - moved to separate entities
                                .paymentDeadline(null) // Now handled by Payment entity
                                .approval(convertApprovalToResponse(booking.getApproval()))
                                .paidAt(null) // Now handled by Payment entity
                                .completedAt(booking.getCompletedAt() != null ? booking.getCompletedAt().toString()
                                                : null)
                                .cancelledAt(booking.getCancelledAt() != null ? booking.getCancelledAt().toString()
                                                : null)
                                .cancellationReason(booking.getCancellationReason())
                                .cancelledBy(booking.getCancelledBy() != null ? booking.getCancelledBy().getUsername()
                                                : null)

                                // Refund fields - moved to Payment entity
                                .refundAmount(null) // Now handled by Payment entity
                                .refundNotes(null) // Now handled by Payment entity
                                .refundProcessedBy(null) // Now handled by Payment entity
                                .refundProcessedAt(null) // Now handled by Payment entity
                                .refundRequestedAt(null) // Now handled by Payment entity

                                // Arrival confirmation
                                .confirmedArrivalBy(booking.getConfirmedArrivalBy() != null
                                                ? booking.getConfirmedArrivalBy().getUsername()
                                                : null)
                                .confirmedArrivalAt(booking.getConfirmedArrivalAt() != null
                                                ? booking.getConfirmedArrivalAt().toString()
                                                : null)

                                // Vehicle information
                                .vehicles(vehicleResponses)
                                .build();
        }

        /**
         * Convert Approval entity to ApprovalResponse DTO
         */
        private ApprovalResponse convertApprovalToResponse(Approval approval) {
                if (approval == null) {
                        return null;
                }

                return ApprovalResponse.builder()
                                .id(approval.getId())
                                .bookingId(approval.getBooking() != null ? approval.getBooking().getId() : null)
                                .bookingCode(approval.getBooking() != null ? approval.getBooking().getBookingCode()
                                                : null)
                                .status(approval.getStatus())
                                .reviewStartedAt(approval.getReviewStartedAt() != null
                                                ? approval.getReviewStartedAt().toString()
                                                : null)
                                .reviewDeadline(approval.getReviewDeadline() != null
                                                ? approval.getReviewDeadline().toString()
                                                : null)
                                .reviewedBy(approval.getReviewedBy() != null ? approval.getReviewedBy().getUsername()
                                                : null)
                                .reviewedAt(approval.getReviewedAt() != null ? approval.getReviewedAt().toString()
                                                : null)
                                .reviewNotes(approval.getReviewNotes())
                                .approvedBy(approval.getApprovedBy() != null ? approval.getApprovedBy().getUsername()
                                                : null)
                                .approvedAt(approval.getApprovedAt() != null ? approval.getApprovedAt().toString()
                                                : null)
                                .rejectedBy(approval.getRejectedBy() != null ? approval.getRejectedBy().getUsername()
                                                : null)
                                .rejectionReason(approval.getRejectionReason())
                                .rejectedAt(approval.getRejectedAt() != null ? approval.getRejectedAt().toString()
                                                : null)
                                .createdAt(approval.getCreatedAt() != null ? approval.getCreatedAt().toString() : null)
                                .updatedAt(approval.getUpdatedAt() != null ? approval.getUpdatedAt().toString() : null)
                                .isPending(approval.isPending())
                                .isInReview(approval.isInReview())
                                .isApproved(approval.isApproved())
                                .isRejected(approval.isRejected())
                                .isOverdue(approval.isReviewOverdue())
                                .build();
        }
}