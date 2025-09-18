package org.vgu.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.ApprovalStatus;
import org.vgu.backend.model.Approval;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    Optional<Approval> findByBookingId(Long bookingId);

    List<Approval> findByStatus(ApprovalStatus status);

    @Query("SELECT a FROM Approval a JOIN FETCH a.booking WHERE a.status = 'IN_REVIEW' AND a.reviewDeadline < :currentTime")
    List<Approval> findOverdueApprovals(@Param("currentTime") LocalDateTime currentTime);

    List<Approval> findByStatusOrderByCreatedAtAsc(ApprovalStatus status);

    @Query("SELECT a FROM Approval a WHERE a.reviewedBy.id = :reviewerId")
    List<Approval> findByReviewerId(@Param("reviewerId") Long reviewerId);

    @Query("SELECT a FROM Approval a WHERE a.approvedBy.id = :approverId")
    List<Approval> findByApproverId(@Param("approverId") Long approverId);

    long countByStatus(ApprovalStatus status);

    /**
     * Find approvals by status and before a specific deadline
     * Used by scheduler to find overdue reviews
     */
    @Query("SELECT a FROM Approval a JOIN FETCH a.booking WHERE a.status = :status AND a.reviewDeadline < :deadline")
    List<Approval> findByStatusAndReviewDeadlineBefore(@Param("status") ApprovalStatus status,
            @Param("deadline") LocalDateTime deadline);

    /**
     * Count overdue approvals by status and deadline
     * Used for statistics and monitoring
     */
    @Query("SELECT COUNT(a) FROM Approval a WHERE a.status = :status AND a.reviewDeadline < :deadline")
    long countByStatusAndReviewDeadlineBefore(@Param("status") ApprovalStatus status,
            @Param("deadline") LocalDateTime deadline);

    /**
     * Find approvals within review deadline
     */
    @Query("SELECT a FROM Approval a JOIN FETCH a.booking WHERE a.status = 'IN_REVIEW' AND a.reviewDeadline >= :currentTime")
    List<Approval> findActiveReviews(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Find approvals by date range
     */
    @Query("SELECT a FROM Approval a WHERE a.createdAt BETWEEN :startDate AND :endDate")
    List<Approval> findByDateRange(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);
}
