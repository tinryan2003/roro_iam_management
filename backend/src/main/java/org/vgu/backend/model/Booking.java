package org.vgu.backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.vgu.backend.enums.BookingStatus;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "bookings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_code", unique = true, nullable = false)
    private String bookingCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "account" })
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler", "route", "ferry", "schedules" })
    private Schedule schedule;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonManagedReference
    private List<Vehicle> vehicles = new ArrayList<>();

    @Column(name = "passenger_count")
    private Integer passengerCount;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BookingStatus status;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Approval relationship
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({ "booking" })
    private Approval approval;

    // Cancellation fields
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cancelled_by")
    private Account cancelledBy;
    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    // Refund request fields
    @Column(name = "refund_requested")
    @Builder.Default
    private Boolean refundRequested = false;

    @Column(name = "refund_reason", columnDefinition = "TEXT")
    private String refundReason;

    @Column(name = "refund_requested_at")
    private LocalDateTime refundRequestedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_requested_by")
    private Account refundRequestedBy;

    @Column(name = "refund_processed_at")
    private LocalDateTime refundProcessedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "refund_processed_by")
    private Account refundProcessedBy;

    @Column(name = "refund_decision_notes", columnDefinition = "TEXT")
    private String refundDecisionNotes;

    // Arrival confirmation fields
    @Column(name = "confirmed_arrival_at")
    private LocalDateTime confirmedArrivalAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_arrival_by")
    private Account confirmedArrivalBy;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties({ "booking" })
    private List<Payment> payments = new ArrayList<>();

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties({ "booking" })
    private List<BookingRecord> auditRecords = new ArrayList<>();

    // Helper methods
    public boolean isPending() {
        return this.status == BookingStatus.PENDING;
    }

    public boolean isConfirmed() {
        return this.status == BookingStatus.CONFIRMED;
    }

    public boolean isWaitingForPayment() {
        return this.status == BookingStatus.WAITING_FOR_PAYMENT;
    }

    public boolean isPaid() {
        return this.status == BookingStatus.PAID;
    }

    public boolean isInReview() {
        return this.status == BookingStatus.IN_REVIEW;
    }

    public boolean isInProgress() {
        return this.status == BookingStatus.IN_PROGRESS;
    }

    public boolean isCancelled() {
        return this.status == BookingStatus.CANCELLED;
    }

    public boolean isCompleted() {
        return this.status == BookingStatus.COMPLETED;
    }

    public boolean isInRefund() {
        return this.status == BookingStatus.IN_REFUND;
    }

    public boolean isRefunded() {
        return this.status == BookingStatus.REFUNDED;
    }

    public boolean isReviewOverdue() {
        return isInReview() && approval != null && approval.isReviewOverdue();
    }

    // Refund-related helper methods
    public boolean canRequestRefund() {
        // Can only request refund before IN_REVIEW status
        return !isInReview() && !isInProgress() && !isCompleted() &&
                !isCancelled() && !isInRefund() && !isRefunded() &&
                !this.refundRequested;
    }

    public boolean hasRefundRequested() {
        return this.refundRequested != null && this.refundRequested;
    }

    public void submitRefundRequest(Account requester, String reason) {
        if (!canRequestRefund()) {
            throw new IllegalStateException("Cannot request refund for booking in status: " + this.status);
        }

        this.refundRequested = true;
        this.refundReason = reason;
        this.refundRequestedAt = LocalDateTime.now();
        this.refundRequestedBy = requester;
    }

    public void approveRefund(Account processor, String notes) {
        if (!hasRefundRequested()) {
            throw new IllegalStateException("No refund request exists for this booking");
        }

        // Set booking status to CANCELLED first, then to REFUNDED to properly terminate
        // the process
        this.status = BookingStatus.CANCELLED;
        this.refundProcessedAt = LocalDateTime.now();
        this.refundProcessedBy = processor;
        this.refundDecisionNotes = notes;

        // Set cancellation fields
        this.cancelledAt = LocalDateTime.now();
        this.cancelledBy = processor;
        this.cancellationReason = "Refund approved: " + notes;

        // Handle pending approval - reject it since the booking is being cancelled
        if (this.approval != null) {
            org.vgu.backend.enums.ApprovalStatus currentStatus = this.approval.getStatus();
            if (currentStatus == org.vgu.backend.enums.ApprovalStatus.PENDING ||
                    currentStatus == org.vgu.backend.enums.ApprovalStatus.IN_REVIEW) {
                try {
                    this.approval.reject(processor, "Booking cancelled due to approved refund request: " + notes);
                } catch (IllegalStateException e) {
                    // Log the error but don't fail the refund process
                    System.err.println("Warning: Could not reject approval for booking " + this.id +
                            " - approval status: " + currentStatus + ", error: " + e.getMessage());
                    // Manually set approval to rejected status
                    this.approval.setStatus(org.vgu.backend.enums.ApprovalStatus.REJECTED);
                    this.approval.setRejectedBy(processor);
                    this.approval.setRejectedAt(LocalDateTime.now());
                    this.approval.setRejectionReason("Booking cancelled due to approved refund request: " + notes);
                    this.approval.setReviewedBy(processor);
                    this.approval.setReviewedAt(LocalDateTime.now());
                }
            }
        }

        // Finally set status to REFUNDED to indicate the refund process is complete
        this.status = BookingStatus.REFUNDED;
    }

    public void rejectRefund(Account processor, String notes) {
        if (!hasRefundRequested()) {
            throw new IllegalStateException("No refund request exists for this booking");
        }

        this.refundRequested = false;
        this.refundProcessedAt = LocalDateTime.now();
        this.refundProcessedBy = processor;
        this.refundDecisionNotes = notes;
        // Keep the original status, just clear the refund request
    }

    /**
     * Cancel pending approvals when refund is approved
     * This ensures that any pending workflow approvals are properly terminated
     */
    public void cancelPendingApprovals(Account canceller, String reason) {
        if (this.approval != null) {
            org.vgu.backend.enums.ApprovalStatus currentStatus = this.approval.getStatus();
            if (currentStatus == org.vgu.backend.enums.ApprovalStatus.PENDING ||
                    currentStatus == org.vgu.backend.enums.ApprovalStatus.IN_REVIEW) {
                try {
                    this.approval.reject(canceller, reason);
                } catch (IllegalStateException e) {
                    // Log the error but don't fail the process
                    System.err.println("Warning: Could not reject approval for booking " + this.id +
                            " - approval status: " + currentStatus + ", error: " + e.getMessage());
                    // Manually set approval to rejected status
                    this.approval.setStatus(org.vgu.backend.enums.ApprovalStatus.REJECTED);
                    this.approval.setRejectedBy(canceller);
                    this.approval.setRejectedAt(LocalDateTime.now());
                    this.approval.setRejectionReason(reason);
                    this.approval.setReviewedBy(canceller);
                    this.approval.setReviewedAt(LocalDateTime.now());
                }
            }
        }
    }

    // Workflow methods
    public void confirm() {
        if (!isPending()) {
            throw new IllegalStateException("Can only confirm PENDING bookings");
        }
        this.status = BookingStatus.CONFIRMED;
        // Payment deadline is now handled in the Payment entity
    }

    public void markAsPaid() {
        if (!isConfirmed() && !isWaitingForPayment()) {
            throw new IllegalStateException("Can only mark CONFIRMED or WAITING_FOR_PAYMENT bookings as PAID");
        }
        this.status = BookingStatus.PAID;
        // Payment timestamp is now handled in the Payment entity
    }

    public void moveToReview() {
        // Allow moving to review either right after accountant confirmation or after
        // payment
        if (!isPaid() && !isConfirmed()) {
            throw new IllegalStateException("Can only move to review after confirmation or payment");
        }
        this.status = BookingStatus.IN_REVIEW;

        // Create or update approval
        if (this.approval == null) {
            this.approval = Approval.builder()
                    .booking(this)
                    .status(org.vgu.backend.enums.ApprovalStatus.IN_REVIEW)
                    .build();
        }
        this.approval.startReview();
    }

    public void startProgress(Account reviewer, String reviewNotes) {
        if (!isInReview() && !isPaid()) {
            throw new IllegalStateException("Can only start progress for IN_REVIEW or PAID bookings");
        }
        this.status = BookingStatus.IN_PROGRESS;

        // Approve the booking through approval
        if (this.approval != null) {
            this.approval.approve(reviewer, reviewNotes);
        }
    }

    public void complete() {
        if (!isInProgress()) {
            throw new IllegalStateException("Can only complete IN_PROGRESS bookings");
        }
        this.status = BookingStatus.COMPLETED;
    }

    public void requestRefund(Account canceller, String reason) {
        if (isCancelled() || isCompleted() || isRefunded() || isInRefund()) {
            throw new IllegalStateException("Booking cannot be cancelled/refunded in current status: " + status);
        }

        // Special handling for review window: allow refund during 30-min review
        if (isInReview()) {
            if (approval != null && approval.getReviewDeadline() != null &&
                    LocalDateTime.now().isBefore(approval.getReviewDeadline())) {
                // Move to refund process during the review window
                this.status = BookingStatus.IN_REFUND;
                this.cancellationReason = reason;
                this.cancelledBy = canceller;
                this.cancelledAt = LocalDateTime.now();
                // Refund details will be handled in the Payment entity
                return;
            } else {
                // Refund window expired; lock refund
                throw new IllegalStateException("Refund window has expired; booking is progressing");
            }
        }

        // If paid or already in progress, move to refund process
        if (isPaid() || isInProgress()) {
            this.status = BookingStatus.IN_REFUND;
            // Refund details will be handled in the Payment entity
        }
        this.status = BookingStatus.IN_REFUND;
        this.cancellationReason = reason;
        this.cancelledBy = canceller;
        this.cancelledAt = LocalDateTime.now();
    }

    public void processRefund(Account processor) {
        if (!isInRefund()) {
            throw new IllegalStateException("Can only process IN_REFUND bookings");
        }
        this.status = BookingStatus.REFUNDED;
        // Refund processing details are now handled in the Payment entity
    }

    public void cancel(Account canceller, String reason) {
        if (isCancelled() || isCompleted() || isRefunded() || isInRefund()) {
            throw new IllegalStateException("Booking cannot be cancelled in current status: " + status);
        }

        // Special handling for review window: allow refund during 30-min review
        if (isInReview()) {
            if (approval != null && approval.getReviewDeadline() != null &&
                    LocalDateTime.now().isBefore(approval.getReviewDeadline())) {
                // Move to refund process during the review window
                this.status = BookingStatus.IN_REFUND;
                this.cancellationReason = reason;
                this.cancelledBy = canceller;
                this.cancelledAt = LocalDateTime.now();
                // Refund details will be handled in the Payment entity
                return;
            } else {
                // Refund window expired; lock refund
                throw new IllegalStateException("Refund window has expired; booking is progressing");
            }
        }

        this.status = BookingStatus.CANCELLED;
        this.cancelledBy = canceller;
        this.cancelledAt = LocalDateTime.now();
        this.cancellationReason = reason;

        // If paid or already in progress, move to refund process
        if (isPaid() || isInProgress()) {
            this.status = BookingStatus.IN_REFUND;
        }
    }
}