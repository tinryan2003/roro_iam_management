package org.vgu.backend.controllers;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.ApprovalRequest;
import org.vgu.backend.dto.request.RejectionRequest;
import org.vgu.backend.dto.response.ApprovalResponse;
import org.vgu.backend.enums.ApprovalStatus;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Approval;
import org.vgu.backend.service.ApprovalService;

import jakarta.validation.Valid;

/**
 * REST Controller for managing booking approvals
 * Implements Single Responsibility Principle by handling only approval-related
 * operations
 */
@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    @Autowired
    private ApprovalService approvalService;

    /**
     * Get current authenticated user
     * For now, returns null - should be implemented based on your authentication
     * setup
     */
    private Account getCurrentUser() {
        // TODO: Implement based on your authentication mechanism
        // This could involve:
        // 1. Getting user from SecurityContext
        // 2. Looking up Account by Keycloak ID
        // 3. Or other authentication method
        return null;
    }

    /**
     * Get approval by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApprovalResponse> getApproval(@PathVariable Long id) {
        try {
            Approval approval = approvalService.getApprovalById(id);
            return ResponseEntity.ok(convertToResponse(approval));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get approval by booking ID
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> getApprovalByBookingId(@PathVariable Long bookingId) {
        try {
            Approval approval = approvalService.getApprovalByBookingId(bookingId);
            return ResponseEntity.ok(approval);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get all approvals by status
     */
    @GetMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getApprovalsByStatus(
            @RequestParam(required = false) ApprovalStatus status) {

        List<Approval> approvals;
        if (status != null) {
            approvals = approvalService.getApprovalsByStatus(status);
        } else {
            approvals = approvalService.getPendingApprovals();
        }

        return ResponseEntity.ok(approvals);
    }

    /**
     * Get pending approvals
     */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getPendingApprovals() {
        List<Approval> approvals = approvalService.getPendingApprovals();
        return ResponseEntity.ok(approvals);
    }

    /**
     * Get approvals in review
     */
    @GetMapping("/in-review")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getApprovalsInReview() {
        List<Approval> approvals = approvalService.getApprovalsInReview();
        return ResponseEntity.ok(approvals);
    }

    /**
     * Get overdue approvals
     */
    @GetMapping("/overdue")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getOverdueApprovals() {
        List<Approval> approvals = approvalService.getOverdueApprovals();
        return ResponseEntity.ok(approvals);
    }

    /**
     * Get active reviews
     */
    @GetMapping("/active-reviews")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getActiveReviews() {
        List<Approval> approvals = approvalService.getActiveReviews();
        return ResponseEntity.ok(approvals);
    }

    /**
     * Start review for an approval
     */
    @PostMapping("/{id}/start-review")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> startReview(@PathVariable Long id) {
        try {
            Approval approval = approvalService.startReview(id);
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Start review by booking ID
     */
    @PostMapping("/booking/{bookingId}/start-review")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> startReviewByBookingId(@PathVariable Long bookingId) {
        try {
            Approval approval = approvalService.startReviewByBookingId(bookingId);
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Approve a booking
     */
    @PutMapping("/{id}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> approve(
            @PathVariable Long id,
            @RequestBody @Valid ApprovalRequest request) {
        try {
            Account approver = getCurrentUser();
            Approval approval = approvalService.approve(id, approver, request.getReviewNotes());
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Approve by booking ID
     */
    @PutMapping("/booking/{bookingId}/approve")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> approveByBookingId(
            @PathVariable Long bookingId,
            @RequestBody @Valid ApprovalRequest request) {
        try {
            Account approver = getCurrentUser();
            Approval approval = approvalService.approveByBookingId(bookingId, approver, request.getReviewNotes());
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Reject a booking
     */
    @PutMapping("/{id}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> reject(
            @PathVariable Long id,
            @RequestBody @Valid RejectionRequest request) {
        try {
            Account rejector = getCurrentUser();
            Approval approval = approvalService.reject(id, rejector, request.getRejectionReason());
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Reject by booking ID
     */
    @PutMapping("/booking/{bookingId}/reject")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Approval> rejectByBookingId(
            @PathVariable Long bookingId,
            @RequestBody @Valid RejectionRequest request) {
        try {
            Account rejector = getCurrentUser();
            Approval approval = approvalService.rejectByBookingId(bookingId, rejector, request.getRejectionReason());
            return ResponseEntity.ok(approval);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get approvals by date range
     */
    @GetMapping("/date-range")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getApprovalsInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {

        List<Approval> approvals = approvalService.getApprovalsInDateRange(startDate, endDate);
        return ResponseEntity.ok(approvals);
    }

    /**
     * Get approval statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ApprovalService.ApprovalStatistics> getStatistics() {
        ApprovalService.ApprovalStatistics stats = approvalService.getStatistics();
        return ResponseEntity.ok(stats);
    }

    /**
     * Get approvals by reviewer
     */
    @GetMapping("/reviewer/{reviewerId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getApprovalsByReviewer(@PathVariable Long reviewerId) {
        List<Approval> approvals = approvalService.getApprovalsByReviewer(reviewerId);
        return ResponseEntity.ok(approvals);
    }

    /**
     * Get approvals by approver
     */
    @GetMapping("/approver/{approverId}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<Approval>> getApprovalsByApprover(@PathVariable Long approverId) {
        List<Approval> approvals = approvalService.getApprovalsByApprover(approverId);
        return ResponseEntity.ok(approvals);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Convert Approval entity to ApprovalResponse DTO
     */
    private ApprovalResponse convertToResponse(Approval approval) {
        if (approval == null) {
            return null;
        }

        return ApprovalResponse.builder()
                .id(approval.getId())
                .bookingId(approval.getBooking() != null ? approval.getBooking().getId() : null)
                .bookingCode(approval.getBooking() != null ? approval.getBooking().getBookingCode() : null)
                .status(approval.getStatus())
                .reviewStartedAt(
                        approval.getReviewStartedAt() != null ? approval.getReviewStartedAt().toString() : null)
                .reviewDeadline(approval.getReviewDeadline() != null ? approval.getReviewDeadline().toString() : null)
                .reviewedBy(approval.getReviewedBy() != null ? approval.getReviewedBy().getUsername() : null)
                .reviewedAt(approval.getReviewedAt() != null ? approval.getReviewedAt().toString() : null)
                .reviewNotes(approval.getReviewNotes())
                .approvedBy(approval.getApprovedBy() != null ? approval.getApprovedBy().getUsername() : null)
                .approvedAt(approval.getApprovedAt() != null ? approval.getApprovedAt().toString() : null)
                .rejectedBy(approval.getRejectedBy() != null ? approval.getRejectedBy().getUsername() : null)
                .rejectionReason(approval.getRejectionReason())
                .rejectedAt(approval.getRejectedAt() != null ? approval.getRejectedAt().toString() : null)
                .createdAt(approval.getCreatedAt() != null ? approval.getCreatedAt().toString() : null)
                .updatedAt(approval.getUpdatedAt() != null ? approval.getUpdatedAt().toString() : null)
                .isPending(approval.isPending())
                .isInReview(approval.isInReview())
                .isApproved(approval.isApproved())
                .isRejected(approval.isRejected())
                .isOverdue(approval.isReviewOverdue())
                .build();
    }

    // ==================== REQUEST DTOS ====================
    // Note: DTOs have been moved to dedicated files:
    // - org.vgu.backend.dto.request.ApprovalRequest
    // - org.vgu.backend.dto.request.RejectionRequest
}
