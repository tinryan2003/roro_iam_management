package org.vgu.backend.dto.response;

import org.vgu.backend.enums.ApprovalStatus;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ApprovalResponse {
    private Long id;
    private Long bookingId;
    private String bookingCode;
    private ApprovalStatus status;
    private String reviewStartedAt;
    private String reviewDeadline;
    private String reviewedBy;
    private String reviewedAt;
    private String reviewNotes;
    private String approvedBy;
    private String approvedAt;
    private String rejectedBy;
    private String rejectionReason;
    private String rejectedAt;
    private String createdAt;
    private String updatedAt;

    // Helper status checks for frontend
    private Boolean isPending;
    private Boolean isInReview;
    private Boolean isApproved;
    private Boolean isRejected;
    private Boolean isOverdue;
}
