package org.vgu.backend.controllers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.ApprovalRequest;
import org.vgu.backend.dto.request.RejectionRequest;
import org.vgu.backend.dto.request.ReviewApprovalRequest;
import org.vgu.backend.dto.response.ApprovalResponse;
import org.vgu.backend.dto.response.BookingResponse;
import org.vgu.backend.enums.BookingStatus;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Approval;
import org.vgu.backend.model.Booking;
import org.vgu.backend.repository.ApprovalRepository;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.bookingrecord.IBookingRecordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller for managing booking workflow operations
 * Handles approval, payment, cancellation, and refund processes
 */
@RestController
@RequestMapping("${api.prefix}/booking-workflow")
@RequiredArgsConstructor
public class BookingWorkflowController {

    private final BookingRepository bookingRepository;
    private final ApprovalRepository approvalRepository;
    private final IAccountService accountService;
    private final IBookingRecordService bookingRecordService;
    private final Logger logger = LoggerFactory.getLogger(BookingWorkflowController.class);

    // ==================== ACCOUNTANT OPERATIONS ====================

    /**
     * Get pending bookings awaiting accountant approval
     */
    @GetMapping("/pending-approval")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    public ResponseEntity<?> getPendingBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            logger.info("Getting pending bookings for approval");

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").ascending());
            Page<Booking> pendingBookings = bookingRepository.findByStatusOrderByCreatedAtAsc(
                    BookingStatus.PENDING, pageable);

            Page<BookingResponse> responses = pendingBookings.map(this::convertToResponse);

            logger.info("Retrieved {} pending bookings", pendingBookings.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving pending bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve pending bookings"));
        }
    }

    /**
     * Approve a booking (ACCOUNTANT only)
     */
    @PatchMapping("/{bookingId}/approve")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> approveBooking(
            @PathVariable Long bookingId,
            @RequestBody @Valid ApprovalRequest request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Approving booking {} by accountant {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!BookingStatus.PENDING.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking cannot be approved in current status: " + booking.getStatus()));
            }

            // Move to confirmed status
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setUpdatedAt(LocalDateTime.now());

            // Create or update approval
            Approval approval = booking.getApproval();
            if (approval == null) {
                approval = Approval.builder()
                        .booking(booking)
                        .status(org.vgu.backend.enums.ApprovalStatus.PENDING)
                        .build();
                booking.setApproval(approval);
            }

            // Set review window (30 minutes from now)
            approval.setReviewStartedAt(LocalDateTime.now());
            approval.setReviewDeadline(LocalDateTime.now().plusMinutes(30));
            approval.setStatus(org.vgu.backend.enums.ApprovalStatus.IN_REVIEW);

            // Move booking to review status
            booking.setStatus(BookingStatus.IN_REVIEW);

            Booking savedBooking = bookingRepository.save(booking);
            approvalRepository.save(approval);

            // Record the approval activity
            String notes = request.getReviewNotes() != null ? request.getReviewNotes() : "No notes provided";
            recordBookingActivity(savedBooking, TypeAction.BOOKING_CONFIRMED, currentUser,
                    String.format("Booking approved by accountant %s. Notes: %s",
                            currentUser.getUsername(), notes));

            logger.info("Booking {} approved and moved to review with 30-minute window", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Booking approved and sent to review (30-min window)",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error approving booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to approve booking"));
        }
    }

    /**
     * Reject a booking (ACCOUNTANT only)
     */
    @PatchMapping("/{bookingId}/reject")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> rejectBooking(
            @PathVariable Long bookingId,
            @RequestBody @Valid RejectionRequest request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Rejecting booking {} by accountant {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!BookingStatus.PENDING.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking cannot be rejected in current status: " + booking.getStatus()));
            }

            // Reject booking by cancelling it
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelledBy(currentUser);
            booking.setCancellationReason(request.getRejectionReason());
            booking.setUpdatedAt(LocalDateTime.now());

            Booking savedBooking = bookingRepository.save(booking);

            // Record the rejection activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_CANCELLED, currentUser,
                    String.format("Booking rejected by accountant %s. Reason: %s",
                            currentUser.getUsername(), request.getRejectionReason()));

            logger.info("Booking {} rejected successfully", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Booking rejected",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error rejecting booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to reject booking"));
        }
    }

    // ==================== CUSTOMER PAYMENT OPERATIONS ====================

    /**
     * Get bookings awaiting payment for a customer
     */
    @GetMapping("/awaiting-payment")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> getAwaitingPaymentBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            Account customer = getCurrentUser(authentication);
            if (customer == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Getting awaiting payment bookings for customer {}", customer.getUsername());

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").ascending());
            Page<Booking> waitingBookings = bookingRepository.findByCustomer_Account_IdAndStatus(
                    customer.getId(), BookingStatus.WAITING_FOR_PAYMENT, pageable);

            Page<BookingResponse> responses = waitingBookings.map(this::convertToResponse);

            logger.info("Retrieved {} awaiting payment bookings", waitingBookings.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving awaiting payment bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve awaiting payment bookings"));
        }
    }

    /**
     * Mark booking as paid (simulated payment)
     */
    @PatchMapping("/{bookingId}/mark-paid")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> markBookingAsPaid(
            @PathVariable Long bookingId,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Marking booking {} as paid by {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!BookingStatus.CONFIRMED.equals(booking.getStatus()) &&
                    !BookingStatus.WAITING_FOR_PAYMENT.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking cannot be paid in current status"));
            }

            // Mark as paid and move to review
            booking.setStatus(BookingStatus.IN_REVIEW);
            booking.setUpdatedAt(LocalDateTime.now());

            // Create or update approval for review
            Approval approval = booking.getApproval();
            if (approval == null) {
                approval = Approval.builder()
                        .booking(booking)
                        .status(org.vgu.backend.enums.ApprovalStatus.IN_REVIEW)
                        .reviewStartedAt(LocalDateTime.now())
                        .reviewDeadline(LocalDateTime.now().plusMinutes(30))
                        .build();
                booking.setApproval(approval);
            } else {
                approval.setStatus(org.vgu.backend.enums.ApprovalStatus.IN_REVIEW);
                approval.setReviewStartedAt(LocalDateTime.now());
                approval.setReviewDeadline(LocalDateTime.now().plusMinutes(30));
            }

            Booking savedBooking = bookingRepository.save(booking);
            approvalRepository.save(approval);

            // Record the payment activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_UPDATED, currentUser,
                    "Payment received and booking moved to review for planner/operation manager");

            logger.info("Booking {} marked as paid and moved to review", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Payment confirmed and booking is now under review",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error marking booking {} as paid: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process payment"));
        }
    }

    // ==================== PLANNER/OPERATION MANAGER OPERATIONS
    // ====================

    /**
     * Get bookings in review for planner/operation manager
     */
    @GetMapping("/in-review")
    @PreAuthorize("hasAnyRole('ROLE_PLANNER', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> getInReviewBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            logger.info("Getting in-review bookings");

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").ascending());
            Page<Booking> reviewBookings = bookingRepository.findByStatusOrderByCreatedAtAsc(
                    BookingStatus.IN_REVIEW, pageable);

            Page<BookingResponse> responses = reviewBookings.map(this::convertToResponse);

            logger.info("Retrieved {} in-review bookings", reviewBookings.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving in-review bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve in-review bookings"));
        }
    }

    /**
     * Approve review and move to progress (Planner/Operation Manager)
     */
    @PatchMapping("/{bookingId}/approve-review")
    @PreAuthorize("hasAnyRole('ROLE_PLANNER', 'ROLE_OPERATION_MANAGER')")
    @Transactional
    public ResponseEntity<?> approveReview(
            @PathVariable Long bookingId,
            @RequestBody @Valid ReviewApprovalRequest request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Approving review for booking {} by {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!BookingStatus.IN_REVIEW.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only approve bookings in review status"));
            }

            // Approve review and start progress
            Approval approval = booking.getApproval();
            if (approval != null) {
                approval.setReviewedBy(currentUser);
                approval.setReviewedAt(LocalDateTime.now());
                approval.setReviewNotes(request.getNotes());
                approval.setStatus(org.vgu.backend.enums.ApprovalStatus.APPROVED);
                approval.setApprovedBy(currentUser);
                approval.setApprovedAt(LocalDateTime.now());
                approvalRepository.save(approval);
            }

            // Move to in progress
            booking.setStatus(BookingStatus.IN_PROGRESS);
            booking.setUpdatedAt(LocalDateTime.now());
            Booking savedBooking = bookingRepository.save(booking);

            // Record the review approval activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_UPDATED, currentUser,
                    String.format("Review approved by %s and moved to progress. Notes: %s",
                            currentUser.getUsername(), request.getNotes()));

            logger.info("Review approved for booking {} and moved to progress", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Review approved and booking moved to progress",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error approving review for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to approve review"));
        }
    }

    /**
     * Get in-progress bookings for operation manager
     */
    @GetMapping("/in-progress")
    @PreAuthorize("hasAnyRole('ROLE_PLANNER', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> getInProgressBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            logger.info("Getting in-progress bookings");

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").ascending());
            Page<Booking> inProgressBookings = bookingRepository.findByStatusOrderByCreatedAtAsc(
                    BookingStatus.IN_PROGRESS, pageable);

            Page<BookingResponse> responses = inProgressBookings.map(this::convertToResponse);

            logger.info("Retrieved {} in-progress bookings", inProgressBookings.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving in-progress bookings: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve in-progress bookings"));
        }
    }

    /**
     * Confirm booking arrival (Operation Manager)
     */
    @PatchMapping("/{bookingId}/confirm-arrival")
    @PreAuthorize("hasAnyRole('ROLE_PLANNER', 'ROLE_OPERATION_MANAGER')")
    @Transactional
    public ResponseEntity<?> confirmArrival(
            @PathVariable Long bookingId,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Confirming arrival for booking {} by {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!BookingStatus.IN_PROGRESS.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Can only confirm arrival for in-progress bookings"));
            }

            // Set arrival confirmation
            booking.setConfirmedArrivalBy(currentUser);
            booking.setConfirmedArrivalAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());
            Booking savedBooking = bookingRepository.save(booking);

            // Record the confirmation activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_UPDATED, currentUser,
                    String.format("Arrival confirmed by %s", currentUser.getUsername()));

            logger.info("Arrival confirmed for booking {}", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Arrival confirmed successfully",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error confirming arrival for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to confirm arrival"));
        }
    }

    // ==================== CUSTOMER COMPLETION ====================

    /**
     * Complete booking (Customer)
     */
    @PatchMapping("/{bookingId}/complete")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Transactional
    public ResponseEntity<?> completeBooking(
            @PathVariable Long bookingId,
            Authentication authentication) {
        try {
            Account customer = getCurrentUser(authentication);
            if (customer == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Completing booking {} by customer {}", bookingId, customer.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            // Verify customer owns the booking
            if (!booking.getCustomer().getAccount().getId().equals(customer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only complete your own bookings"));
            }

            if (!BookingStatus.IN_PROGRESS.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking must be in progress to complete"));
            }

            // Complete booking
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setCompletedAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());
            Booking savedBooking = bookingRepository.save(booking);

            // Record the completion activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_COMPLETED, customer,
                    "Booking completed by customer");

            logger.info("Booking {} completed successfully", bookingId);
            return ResponseEntity.ok(Map.of(
                    "message", "Booking completed successfully",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error completing booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to complete booking"));
        }
    }

    // ==================== CANCELLATION AND REFUND ====================

    /**
     * Cancel booking
     */
    @PatchMapping("/{bookingId}/cancel")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT', 'ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long bookingId,
            @RequestBody @Valid CancellationRequest request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Cancelling booking {} by {}", bookingId, currentUser.getUsername());

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (BookingStatus.CANCELLED.equals(booking.getStatus()) ||
                    BookingStatus.COMPLETED.equals(booking.getStatus())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Booking cannot be cancelled in current status: " + booking.getStatus()));
            }

            // Cancel booking
            booking.setStatus(BookingStatus.CANCELLED);
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelledBy(currentUser);
            booking.setCancellationReason(request.reason);
            booking.setUpdatedAt(LocalDateTime.now());
            Booking savedBooking = bookingRepository.save(booking);

            // Record the cancellation activity
            recordBookingActivity(savedBooking, TypeAction.BOOKING_CANCELLED, currentUser,
                    String.format("Booking cancelled by %s. Reason: %s",
                            currentUser.getUsername(), request.reason));

            logger.info("Booking {} cancelled - status: {}", bookingId, savedBooking.getStatus());
            return ResponseEntity.ok(Map.of(
                    "message", "Booking cancelled successfully",
                    "booking", convertToResponse(savedBooking)));

        } catch (Exception e) {
            logger.error("Error cancelling booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to cancel booking"));
        }
    }

    /**
     * Submit refund request (CUSTOMER only) - Only before IN_REVIEW status
     */
    @PostMapping("/{bookingId}/request-refund")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    @Transactional
    public ResponseEntity<?> requestRefund(
            @PathVariable Long bookingId,
            @RequestBody @Valid org.vgu.backend.dto.request.RefundRequestDto request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Customer {} requesting refund for booking {}", currentUser.getUsername(), bookingId);

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            // Verify the booking belongs to the customer
            if (!booking.getCustomer().getAccount().getId().equals(currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "You can only request refunds for your own bookings"));
            }

            // Check if refund can be requested
            if (!booking.canRequestRefund()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Refund cannot be requested for bookings in " + booking.getStatus()
                                + " status or after IN_REVIEW"));
            }

            // Submit refund request
            booking.submitRefundRequest(currentUser, request.getReason());
            bookingRepository.save(booking);

            // Record activity
            recordBookingActivity(booking, TypeAction.BOOKING_UPDATED, currentUser,
                    String.format("Refund requested by customer: %s", request.getReason()));

            logger.info("Refund request submitted for booking {} by customer {}", bookingId, currentUser.getUsername());
            return ResponseEntity.ok(Map.of(
                    "message", "Refund request submitted successfully. It will be reviewed by an accountant.",
                    "booking", convertToResponse(booking)));

        } catch (Exception e) {
            logger.error("Error requesting refund for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to submit refund request"));
        }
    }

    /**
     * Get pending refund requests for accountant review
     */
    @GetMapping("/refund-requests")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    public ResponseEntity<?> getPendingRefundRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        try {
            logger.info("Getting pending refund requests for accountant review");

            List<Booking> allPendingRefunds = bookingRepository.findPendingRefundRequests();

            // Apply pagination
            int start = page * limit;
            int end = Math.min(start + limit, allPendingRefunds.size());
            List<Booking> pageContent = allPendingRefunds.subList(start, end);

            List<BookingResponse> refundRequests = pageContent.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                    "content", refundRequests,
                    "totalElements", allPendingRefunds.size(),
                    "totalPages", (int) Math.ceil((double) allPendingRefunds.size() / limit),
                    "currentPage", page,
                    "pageSize", limit));

        } catch (Exception e) {
            logger.error("Error retrieving pending refund requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve pending refund requests"));
        }
    }

    /**
     * Get booking workflow statistics
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> getWorkflowStats() {
        try {
            logger.info("Getting booking workflow statistics");

            // Count bookings by status
            long pendingCount = bookingRepository.countByStatus(BookingStatus.PENDING);
            long awaitingPaymentCount = bookingRepository.countByStatus(BookingStatus.WAITING_FOR_PAYMENT);
            long inProgressCount = bookingRepository.countByStatus(BookingStatus.IN_PROGRESS);

            // Count pending refund requests
            long refundRequestsCount = bookingRepository.countByStatus(BookingStatus.IN_REFUND);

            // Count completed bookings (all time, not just today since repository method
            // doesn't support date filtering)
            long completedTodayCount = bookingRepository.countByStatus(BookingStatus.COMPLETED);

            Map<String, Object> stats = Map.of(
                    "pendingCount", pendingCount,
                    "awaitingPaymentCount", awaitingPaymentCount,
                    "inProgressCount", inProgressCount,
                    "refundRequestsCount", refundRequestsCount,
                    "completedTodayCount", completedTodayCount);

            logger.info("Retrieved workflow statistics: {}", stats);
            return ResponseEntity.ok(stats);

        } catch (Exception e) {
            logger.error("Error retrieving workflow statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve workflow statistics"));
        }
    }

    /**
     * Process refund decision (ACCOUNTANT only) - Approve or reject refund request
     */
    @PatchMapping("/{bookingId}/process-refund")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> processRefundDecision(
            @PathVariable Long bookingId,
            @RequestBody @Valid org.vgu.backend.dto.request.RefundDecisionDto decision,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Accountant {} processing refund decision for booking {}", currentUser.getUsername(),
                    bookingId);

            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

            if (!booking.hasRefundRequested()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "No pending refund request found for this booking"));
            }

            if (decision.getApproved()) {
                // Store the approval status before processing refund
                boolean hadPendingApproval = booking.getApproval() != null &&
                        (booking.getApproval().getStatus() == org.vgu.backend.enums.ApprovalStatus.PENDING ||
                                booking.getApproval().getStatus() == org.vgu.backend.enums.ApprovalStatus.IN_REVIEW);

                logger.info("Processing refund approval for booking {} - approval exists: {}, had pending approval: {}",
                        bookingId, booking.getApproval() != null, hadPendingApproval);

                if (booking.getApproval() != null) {
                    logger.info("Current approval status: {}", booking.getApproval().getStatus());
                }

                // Approve refund - this terminates the booking process and cancels any pending
                // approvals
                booking.approveRefund(currentUser, decision.getNotes());

                recordBookingActivity(booking, TypeAction.BOOKING_UPDATED, currentUser,
                        String.format("Refund approved by accountant: %s", decision.getNotes()));

                // Prepare response with additional information about cancelled approvals
                Map<String, Object> response = Map.of(
                        "message", "Refund approved successfully. The booking process has been terminated.",
                        "booking", convertToResponse(booking),
                        "approvalCancelled", hadPendingApproval,
                        "refreshRequired", true // Signal frontend to refresh pending approvals list
                );

                logger.info(
                        "Refund approved for booking {} - booking process terminated, pending approval cancelled: {}",
                        bookingId, hadPendingApproval);
                return ResponseEntity.ok(response);
            } else {
                // Reject refund - booking continues with original status
                booking.rejectRefund(currentUser, decision.getNotes());

                recordBookingActivity(booking, TypeAction.BOOKING_UPDATED, currentUser,
                        String.format("Refund rejected by accountant: %s", decision.getNotes()));

                logger.info("Refund rejected for booking {} - booking process continues", bookingId);
                return ResponseEntity.ok(Map.of(
                        "message", "Refund request rejected. The booking process will continue.",
                        "booking", convertToResponse(booking)));
            }

        } catch (Exception e) {
            logger.error("Error processing refund decision for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to process refund decision"));
        }
    }

    // ==================== HELPER METHODS ====================

    private Account getCurrentUser(Authentication authentication) {
        try {
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                String keycloakId = jwt.getClaimAsString("sub");
                Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);
                return accountOpt.orElse(null);
            }
        } catch (Exception e) {
            logger.debug("Could not get current user from security context: {}", e.getMessage());
        }
        return null;
    }

    private void recordBookingActivity(Booking booking, TypeAction action, Account performer, String description) {
        try {
            recordBookingActivityInNewTransaction(booking, action, performer, description);
        } catch (Exception e) {
            logger.warn("Failed to record booking activity for {}: {}", booking.getBookingCode(), e.getMessage());
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void recordBookingActivityInNewTransaction(Booking booking, TypeAction action, Account performer,
            String description) {
        bookingRecordService.createRecord(booking, action, performer, description);
    }

    private BookingResponse convertToResponse(Booking booking) {
        // Safely extract schedule information
        String departureTime = null;
        Long routeId = null;
        Long ferryId = null;

        try {
            if (booking.getSchedule() != null) {
                if (booking.getSchedule().getDepartureTime() != null) {
                    departureTime = booking.getSchedule().getDepartureTime().toString();
                }
                if (booking.getSchedule().getRoute() != null) {
                    routeId = booking.getSchedule().getRoute().getId();
                }
                if (booking.getSchedule().getFerry() != null) {
                    ferryId = booking.getSchedule().getFerry().getId();
                }
            }
        } catch (Exception e) {
            logger.warn("Error accessing schedule details for booking {}: {}", booking.getId(), e.getMessage());
        }

        // Safely extract customer information
        Long customerId = null;
        try {
            if (booking.getCustomer() != null) {
                customerId = booking.getCustomer().getId();
            }
        } catch (Exception e) {
            logger.warn("Error accessing customer details for booking {}: {}", booking.getId(), e.getMessage());
        }

        // Safely extract vehicle information
        List<Long> vehicleIds = null;
        try {
            if (booking.getVehicles() != null && !booking.getVehicles().isEmpty()) {
                vehicleIds = booking.getVehicles().stream()
                        .map(vehicle -> vehicle.getId())
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            logger.warn("Error accessing vehicle details for booking {}: {}", booking.getId(), e.getMessage());
        }

        // Safely extract user information for cancelled and confirmed fields
        String cancelledByUsername = null;
        String confirmedArrivalByUsername = null;
        try {
            if (booking.getCancelledBy() != null) {
                cancelledByUsername = booking.getCancelledBy().getUsername();
            }
            if (booking.getConfirmedArrivalBy() != null) {
                confirmedArrivalByUsername = booking.getConfirmedArrivalBy().getUsername();
            }
        } catch (Exception e) {
            logger.warn("Error accessing user details for booking {}: {}", booking.getId(), e.getMessage());
        }

        // Safely extract refund-related user information
        String refundRequestedByUsername = null;
        String refundProcessedByUsername = null;
        try {
            if (booking.getRefundRequestedBy() != null) {
                refundRequestedByUsername = booking.getRefundRequestedBy().getUsername();
            }
            if (booking.getRefundProcessedBy() != null) {
                refundProcessedByUsername = booking.getRefundProcessedBy().getUsername();
            }
        } catch (Exception e) {
            logger.warn("Error accessing refund user details for booking {}: {}", booking.getId(), e.getMessage());
        }

        return BookingResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .passengerCount(booking.getPassengerCount())
                .totalAmount(booking.getTotalAmount() != null ? booking.getTotalAmount().doubleValue() : 0.0)
                .departureTime(departureTime)
                .customerId(customerId)
                .routeId(routeId)
                .ferryId(ferryId)
                .vehicleId(vehicleIds)
                .status(booking.getStatus() != null ? booking.getStatus().toString() : null)
                .createdAt(booking.getCreatedAt() != null ? booking.getCreatedAt().toString() : null)
                .updatedAt(booking.getUpdatedAt() != null ? booking.getUpdatedAt().toString() : null)
                .note(booking.getNote())
                .cancelledAt(booking.getCancelledAt() != null ? booking.getCancelledAt().toString() : null)
                .cancellationReason(booking.getCancellationReason())
                .cancelledBy(cancelledByUsername)
                .confirmedArrivalBy(confirmedArrivalByUsername)
                .confirmedArrivalAt(
                        booking.getConfirmedArrivalAt() != null ? booking.getConfirmedArrivalAt().toString() : null)
                .completedAt(booking.getCompletedAt() != null ? booking.getCompletedAt().toString() : null)
                // Refund fields
                .refundRequested(booking.getRefundRequested())
                .refundReason(booking.getRefundReason())
                .refundRequestedAt(
                        booking.getRefundRequestedAt() != null ? booking.getRefundRequestedAt().toString() : null)
                .refundRequestedBy(refundRequestedByUsername)
                .refundProcessedAt(
                        booking.getRefundProcessedAt() != null ? booking.getRefundProcessedAt().toString() : null)
                .refundProcessedBy(refundProcessedByUsername)
                .refundDecisionNotes(booking.getRefundDecisionNotes())
                .approval(convertApprovalToResponse(booking.getApproval()))
                .build();
    }

    /**
     * Convert Approval entity to ApprovalResponse DTO
     */
    private ApprovalResponse convertApprovalToResponse(Approval approval) {
        if (approval == null) {
            return null;
        }

        // Safely extract booking information
        Long bookingId = null;
        String bookingCode = null;
        try {
            if (approval.getBooking() != null) {
                bookingId = approval.getBooking().getId();
                bookingCode = approval.getBooking().getBookingCode();
            }
        } catch (Exception e) {
            logger.warn("Error accessing booking details for approval {}: {}", approval.getId(), e.getMessage());
        }

        // Safely extract user information
        String reviewedByUsername = null;
        String approvedByUsername = null;
        String rejectedByUsername = null;
        try {
            if (approval.getReviewedBy() != null) {
                reviewedByUsername = approval.getReviewedBy().getUsername();
            }
            if (approval.getApprovedBy() != null) {
                approvedByUsername = approval.getApprovedBy().getUsername();
            }
            if (approval.getRejectedBy() != null) {
                rejectedByUsername = approval.getRejectedBy().getUsername();
            }
        } catch (Exception e) {
            logger.warn("Error accessing user details for approval {}: {}", approval.getId(), e.getMessage());
        }

        return ApprovalResponse.builder()
                .id(approval.getId())
                .bookingId(bookingId)
                .bookingCode(bookingCode)
                .status(approval.getStatus())
                .reviewStartedAt(
                        approval.getReviewStartedAt() != null ? approval.getReviewStartedAt().toString() : null)
                .reviewDeadline(approval.getReviewDeadline() != null ? approval.getReviewDeadline().toString() : null)
                .reviewedBy(reviewedByUsername)
                .reviewedAt(approval.getReviewedAt() != null ? approval.getReviewedAt().toString() : null)
                .reviewNotes(approval.getReviewNotes())
                .approvedBy(approvedByUsername)
                .approvedAt(approval.getApprovedAt() != null ? approval.getApprovedAt().toString() : null)
                .rejectedBy(rejectedByUsername)
                .rejectionReason(approval.getRejectionReason())
                .rejectedAt(approval.getRejectedAt() != null ? approval.getRejectedAt().toString() : null)
                .createdAt(approval.getCreatedAt() != null ? approval.getCreatedAt().toString() : null)
                .updatedAt(approval.getUpdatedAt() != null ? approval.getUpdatedAt().toString() : null)
                .isPending(org.vgu.backend.enums.ApprovalStatus.PENDING.equals(approval.getStatus()))
                .isInReview(org.vgu.backend.enums.ApprovalStatus.IN_REVIEW.equals(approval.getStatus()))
                .isApproved(org.vgu.backend.enums.ApprovalStatus.APPROVED.equals(approval.getStatus()))
                .isRejected(org.vgu.backend.enums.ApprovalStatus.REJECTED.equals(approval.getStatus()))
                .isOverdue(approval.getReviewDeadline() != null
                        && approval.getReviewDeadline().isBefore(LocalDateTime.now()) &&
                        org.vgu.backend.enums.ApprovalStatus.IN_REVIEW.equals(approval.getStatus()))
                .build();
    }

    // ==================== REQUEST DTOS ====================

    public static class CancellationRequest {
        public String reason;
    }

    public static class RefundRequest {
        public BigDecimal amount;
        public String notes;
    }
}
