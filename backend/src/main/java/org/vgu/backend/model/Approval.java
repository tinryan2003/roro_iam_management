package org.vgu.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.vgu.backend.enums.ApprovalStatus;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "approvals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ApprovalStatus status;

    // Review tracking fields
    @Column(name = "review_started_at")
    private LocalDateTime reviewStartedAt;

    @Column(name = "review_deadline")
    private LocalDateTime reviewDeadline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Account reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "review_notes", columnDefinition = "TEXT")
    private String reviewNotes;

    // Approval fields
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Account approvedBy;

    @Column(name = "approval_notes", columnDefinition = "TEXT")
    private String approvalNotes;

    // Rejection fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    @JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
    private Account rejectedBy;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper methods
    public boolean isPending() {
        return this.status == ApprovalStatus.PENDING;
    }

    public boolean isInReview() {
        return this.status == ApprovalStatus.IN_REVIEW;
    }

    public boolean isApproved() {
        return this.status == ApprovalStatus.APPROVED;
    }

    public boolean isRejected() {
        return this.status == ApprovalStatus.REJECTED;
    }

    public boolean isReviewOverdue() {
        return isInReview() && reviewDeadline != null && LocalDateTime.now().isAfter(reviewDeadline);
    }

    // Workflow methods
    public void startReview() {
        if (!isPending()) {
            throw new IllegalStateException("Can only start review for PENDING approvals");
        }
        this.status = ApprovalStatus.IN_REVIEW;
        this.reviewStartedAt = LocalDateTime.now();
        this.reviewDeadline = LocalDateTime.now().plusMinutes(30); // 30 minutes for review
    }

    public void approve(Account approver, String approvalNotes) {
        if (!isInReview() && !isPending()) {
            throw new IllegalStateException("Can only approve IN_REVIEW or PENDING approvals");
        }
        this.status = ApprovalStatus.APPROVED;
        this.approvedBy = approver;
        this.approvedAt = LocalDateTime.now();
        this.reviewedBy = approver;
        this.reviewedAt = LocalDateTime.now();
        this.approvalNotes = approvalNotes;
    }

    public void reject(Account rejector, String rejectionReason) {
        if (!isInReview() && !isPending()) {
            throw new IllegalStateException("Can only reject IN_REVIEW or PENDING approvals");
        }
        this.status = ApprovalStatus.REJECTED;
        this.rejectedBy = rejector;
        this.rejectedAt = LocalDateTime.now();
        this.rejectionReason = rejectionReason;
        this.reviewedBy = rejector;
        this.reviewedAt = LocalDateTime.now();
    }
}
