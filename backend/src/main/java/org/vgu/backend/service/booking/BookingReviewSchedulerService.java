package org.vgu.backend.service.booking;

import java.time.LocalDateTime;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.enums.ApprovalStatus;
import org.vgu.backend.enums.BookingStatus;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.model.Approval;
import org.vgu.backend.model.Booking;
import org.vgu.backend.repository.ApprovalRepository;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.service.ApprovalService;
import org.vgu.backend.service.bookingrecord.IBookingRecordService;

import lombok.RequiredArgsConstructor;

/**
 * Scheduled service to automatically progress bookings from IN_REVIEW to
 * IN_PROGRESS
 * after 30 minutes timeout
 */
@Service
@RequiredArgsConstructor
public class BookingReviewSchedulerService {

    private final BookingRepository bookingRepository;
    private final ApprovalRepository approvalRepository;
    private final ApprovalService approvalService;
    private final IBookingRecordService bookingRecordService;
    private final Logger logger = LoggerFactory.getLogger(BookingReviewSchedulerService.class);

    /**
     * Scheduled task that runs every 5 minutes to check for overdue review bookings
     * and automatically moves them to IN_PROGRESS status
     */
    @Scheduled(fixedRate = 300000) // Run every 5 minutes (300,000ms)
    public void processOverdueReviewBookings() {
        try {
            LocalDateTime currentTime = LocalDateTime.now();

            // Get overdue approvals
            List<Approval> overdueApprovals = approvalService.getOverdueApprovals();

            if (overdueApprovals.isEmpty()) {
                logger.debug("No overdue review approvals found at {}", currentTime);
                return;
            }

            logger.info("Found {} overdue review approvals at {}", overdueApprovals.size(), currentTime);

            int successCount = 0;
            int failureCount = 0;

            for (Approval approval : overdueApprovals) {
                try {
                    // Process each approval in its own transaction
                    processIndividualOverdueBooking(approval);
                    successCount++;

                    logger.info("Automatically moved booking {} from IN_REVIEW to IN_PROGRESS due to timeout",
                            approval.getBooking().getBookingCode());

                } catch (Exception e) {
                    failureCount++;
                    logger.error("Failed to auto-progress booking {} from review: {}",
                            approval.getBooking().getBookingCode(), e.getMessage(), e);
                }
            }

            logger.info("Successfully processed {} overdue review approvals ({} succeeded, {} failed)",
                    overdueApprovals.size(), successCount, failureCount);

        } catch (Exception e) {
            logger.error("Error in scheduled review processing: {}", e.getMessage(), e);
        }
    }

    /**
     * Process individual overdue approval in its own transaction
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processIndividualOverdueBooking(Approval approval) {
        try {
            Booking booking = approval.getBooking();

            // Update approval to approved status (auto-approved due to timeout)
            approval.setStatus(ApprovalStatus.APPROVED);
            approval.setReviewedAt(LocalDateTime.now());
            approval.setReviewedBy(null); // System action
            approval.setReviewNotes("Auto-approved due to 30-minute review timeout");
            approval.setApprovedAt(LocalDateTime.now());
            approval.setApprovedBy(null); // System action
            approval.setUpdatedAt(LocalDateTime.now());

            // Move booking to IN_PROGRESS
            booking.setStatus(BookingStatus.IN_PROGRESS);
            booking.setUpdatedAt(LocalDateTime.now());

            // Save both entities
            approvalRepository.save(approval);
            bookingRepository.save(booking);

            // Record the automatic progression
            bookingRecordService.createRecord(
                    booking,
                    TypeAction.BOOKING_UPDATED,
                    null, // System action, no user
                    String.format(
                            "Booking automatically moved from IN_REVIEW to IN_PROGRESS due to 30-minute timeout. Review started: %s, Deadline: %s",
                            approval.getReviewStartedAt(), approval.getReviewDeadline()));

            logger.debug("Successfully auto-progressed booking {} to IN_PROGRESS", booking.getBookingCode());

        } catch (Exception e) {
            logger.error("Error processing individual overdue booking {}: {}",
                    approval.getBooking().getBookingCode(), e.getMessage(), e);
            throw e; // Re-throw to be caught by the caller
        }
    }

    /**
     * Manual method to check and process overdue bookings
     * Useful for testing or manual triggers
     */
    @Transactional
    public int processOverdueBookingsManually() {
        try {
            LocalDateTime currentTime = LocalDateTime.now();

            // Find overdue approvals manually using repository query
            List<Approval> overdueApprovals = approvalRepository.findByStatusAndReviewDeadlineBefore(
                    ApprovalStatus.IN_REVIEW, currentTime);

            logger.info("Manual processing: Found {} overdue approvals", overdueApprovals.size());

            int processedCount = 0;
            for (Approval approval : overdueApprovals) {
                try {
                    processIndividualOverdueBooking(approval);
                    processedCount++;

                    logger.info("Manually processed overdue booking: {}",
                            approval.getBooking().getBookingCode());
                } catch (Exception e) {
                    logger.error("Failed to manually process overdue booking {}: {}",
                            approval.getBooking().getBookingCode(), e.getMessage());
                }
            }

            logger.info("Manual processing completed: {} bookings processed", processedCount);
            return processedCount;

        } catch (Exception e) {
            logger.error("Error in manual overdue booking processing: {}", e.getMessage(), e);
            return 0;
        }
    }

    /**
     * Get statistics about current review status
     * Useful for monitoring and debugging
     */
    public ReviewStatistics getReviewStatistics() {
        try {
            LocalDateTime currentTime = LocalDateTime.now();

            long totalInReview = approvalRepository.countByStatus(ApprovalStatus.IN_REVIEW);
            long overdueCount = approvalRepository.countByStatusAndReviewDeadlineBefore(
                    ApprovalStatus.IN_REVIEW, currentTime);
            long withinDeadline = totalInReview - overdueCount;

            return new ReviewStatistics(totalInReview, overdueCount, withinDeadline, currentTime);

        } catch (Exception e) {
            logger.error("Error getting review statistics: {}", e.getMessage(), e);
            return new ReviewStatistics(0, 0, 0, LocalDateTime.now());
        }
    }

    /**
     * Statistics class for review monitoring
     */
    public static class ReviewStatistics {
        public final long totalInReview;
        public final long overdueCount;
        public final long withinDeadline;
        public final LocalDateTime checkTime;

        public ReviewStatistics(long totalInReview, long overdueCount, long withinDeadline, LocalDateTime checkTime) {
            this.totalInReview = totalInReview;
            this.overdueCount = overdueCount;
            this.withinDeadline = withinDeadline;
            this.checkTime = checkTime;
        }

        @Override
        public String toString() {
            return String.format("ReviewStats[Total: %d, Overdue: %d, OnTime: %d, CheckTime: %s]",
                    totalInReview, overdueCount, withinDeadline, checkTime);
        }
    }
}
