package org.vgu.backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.enums.ApprovalStatus;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Approval;
import org.vgu.backend.model.Booking;
import org.vgu.backend.repository.ApprovalRepository;

/**
 * Service class for handling booking approval workflow
 * Implements Single Responsibility Principle by separating approval logic from
 * booking logic
 */
@Service
@Transactional
public class ApprovalService {

    @Autowired
    private ApprovalRepository approvalRepository;

    /**
     * Create a new approval for a booking
     */
    public Approval createApproval(Booking booking) {
        // Check if approval already exists
        Optional<Approval> existingApproval = approvalRepository.findByBookingId(booking.getId());
        if (existingApproval.isPresent()) {
            throw new IllegalStateException("Approval already exists for booking: " + booking.getId());
        }

        Approval approval = Approval.builder()
                .booking(booking)
                .status(ApprovalStatus.PENDING)
                .build();

        return approvalRepository.save(approval);
    }

    /**
     * Start review process for an approval
     */
    public Approval startReview(Long approvalId) {
        Approval approval = getApprovalById(approvalId);
        approval.startReview();
        return approvalRepository.save(approval);
    }

    /**
     * Start review process by booking ID
     */
    public Approval startReviewByBookingId(Long bookingId) {
        Approval approval = getApprovalByBookingId(bookingId);
        approval.startReview();
        return approvalRepository.save(approval);
    }

    /**
     * Approve a booking
     */
    public Approval approve(Long approvalId, Account approver, String reviewNotes) {
        Approval approval = getApprovalById(approvalId);
        approval.approve(approver, reviewNotes);
        return approvalRepository.save(approval);
    }

    /**
     * Approve a booking by booking ID
     */
    public Approval approveByBookingId(Long bookingId, Account approver, String reviewNotes) {
        Approval approval = getApprovalByBookingId(bookingId);
        approval.approve(approver, reviewNotes);
        return approvalRepository.save(approval);
    }

    /**
     * Reject a booking
     */
    public Approval reject(Long approvalId, Account rejector, String rejectionReason) {
        Approval approval = getApprovalById(approvalId);
        approval.reject(rejector, rejectionReason);
        return approvalRepository.save(approval);
    }

    /**
     * Reject a booking by booking ID
     */
    public Approval rejectByBookingId(Long bookingId, Account rejector, String rejectionReason) {
        Approval approval = getApprovalByBookingId(bookingId);
        approval.reject(rejector, rejectionReason);
        return approvalRepository.save(approval);
    }

    /**
     * Get approval by ID
     */
    @Transactional(readOnly = true)
    public Approval getApprovalById(Long approvalId) {
        return approvalRepository.findById(approvalId)
                .orElseThrow(() -> new IllegalArgumentException("Approval not found with ID: " + approvalId));
    }

    /**
     * Get approval by booking ID
     */
    @Transactional(readOnly = true)
    public Approval getApprovalByBookingId(Long bookingId) {
        return approvalRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Approval not found for booking ID: " + bookingId));
    }

    /**
     * Get all approvals by status
     */
    @Transactional(readOnly = true)
    public List<Approval> getApprovalsByStatus(ApprovalStatus status) {
        return approvalRepository.findByStatus(status);
    }

    /**
     * Get pending approvals ordered by creation date
     */
    @Transactional(readOnly = true)
    public List<Approval> getPendingApprovals() {
        return approvalRepository.findByStatusOrderByCreatedAtAsc(ApprovalStatus.PENDING);
    }

    /**
     * Get approvals in review
     */
    @Transactional(readOnly = true)
    public List<Approval> getApprovalsInReview() {
        return approvalRepository.findByStatus(ApprovalStatus.IN_REVIEW);
    }

    /**
     * Get overdue approvals (review deadline passed)
     */
    @Transactional(readOnly = true)
    public List<Approval> getOverdueApprovals() {
        return approvalRepository.findOverdueApprovals(LocalDateTime.now());
    }

    /**
     * Get active reviews (still within deadline)
     */
    @Transactional(readOnly = true)
    public List<Approval> getActiveReviews() {
        return approvalRepository.findActiveReviews(LocalDateTime.now());
    }

    /**
     * Get approvals by reviewer
     */
    @Transactional(readOnly = true)
    public List<Approval> getApprovalsByReviewer(Long reviewerId) {
        return approvalRepository.findByReviewerId(reviewerId);
    }

    /**
     * Get approvals by approver
     */
    @Transactional(readOnly = true)
    public List<Approval> getApprovalsByApprover(Long approverId) {
        return approvalRepository.findByApproverId(approverId);
    }

    /**
     * Count approvals by status
     */
    @Transactional(readOnly = true)
    public long countApprovalsByStatus(ApprovalStatus status) {
        return approvalRepository.countByStatus(status);
    }

    /**
     * Get approvals in date range
     */
    @Transactional(readOnly = true)
    public List<Approval> getApprovalsInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return approvalRepository.findByDateRange(startDate, endDate);
    }

    /**
     * Check if approval exists for booking
     */
    @Transactional(readOnly = true)
    public boolean hasApproval(Long bookingId) {
        return approvalRepository.findByBookingId(bookingId).isPresent();
    }

    /**
     * Get approval statistics
     */
    @Transactional(readOnly = true)
    public ApprovalStatistics getStatistics() {
        return ApprovalStatistics.builder()
                .pending(countApprovalsByStatus(ApprovalStatus.PENDING))
                .inReview(countApprovalsByStatus(ApprovalStatus.IN_REVIEW))
                .approved(countApprovalsByStatus(ApprovalStatus.APPROVED))
                .rejected(countApprovalsByStatus(ApprovalStatus.REJECTED))
                .overdue(getOverdueApprovals().size())
                .build();
    }

    /**
     * Statistics DTO for approval metrics
     */
    public static class ApprovalStatistics {
        private final long pending;
        private final long inReview;
        private final long approved;
        private final long rejected;
        private final long overdue;

        private ApprovalStatistics(Builder builder) {
            this.pending = builder.pending;
            this.inReview = builder.inReview;
            this.approved = builder.approved;
            this.rejected = builder.rejected;
            this.overdue = builder.overdue;
        }

        // Getters
        public long getPending() {
            return pending;
        }

        public long getInReview() {
            return inReview;
        }

        public long getApproved() {
            return approved;
        }

        public long getRejected() {
            return rejected;
        }

        public long getOverdue() {
            return overdue;
        }

        public static Builder builder() {
            return new Builder();
        }

        public static class Builder {
            private long pending;
            private long inReview;
            private long approved;
            private long rejected;
            private long overdue;

            public Builder pending(long pending) {
                this.pending = pending;
                return this;
            }

            public Builder inReview(long inReview) {
                this.inReview = inReview;
                return this;
            }

            public Builder approved(long approved) {
                this.approved = approved;
                return this;
            }

            public Builder rejected(long rejected) {
                this.rejected = rejected;
                return this;
            }

            public Builder overdue(long overdue) {
                this.overdue = overdue;
                return this;
            }

            public ApprovalStatistics build() {
                return new ApprovalStatistics(this);
            }
        }
    }
}
