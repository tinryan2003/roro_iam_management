package org.vgu.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.vgu.backend.model.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

        /**
         * Find notifications by recipient ID and type with pagination
         */
        Page<Notification> findByRecipientIdAndRecipientTypeOrderByCreatedAtDesc(
                        String recipientId, String recipientType, Pageable pageable);

        /**
         * Find unread notifications by recipient ID and type
         */
        List<Notification> findByRecipientIdAndRecipientTypeAndReadFalseOrderByCreatedAtDesc(
                        String recipientId, String recipientType);

        /**
         * Count unread notifications by recipient ID and type
         */
        long countByRecipientIdAndRecipientTypeAndReadFalse(String recipientId, String recipientType);

        /**
         * Delete notifications by recipient ID and type
         */
        void deleteByRecipientIdAndRecipientType(String recipientId, String recipientType);

        /**
         * Find notifications by recipient ID
         */
        List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

        /**
         * Find notifications by recipient ID with pagination
         */
        Page<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId, Pageable pageable);

        /**
         * Find unread notifications by recipient ID
         */
        List<Notification> findByRecipientIdAndReadFalseOrderByCreatedAtDesc(String recipientId);

        /**
         * Count unread notifications by recipient ID
         */
        long countByRecipientIdAndReadFalse(String recipientId);

        /**
         * Find notifications by recipient type
         */
        List<Notification> findByRecipientTypeOrderByCreatedAtDesc(String recipientType);

        /**
         * Find notifications by channel
         */
        List<Notification> findByChannelOrderByCreatedAtDesc(String channel);

        /**
         * Find notifications by status
         */
        List<Notification> findByStatusOrderByCreatedAtDesc(String status);

        /**
         * Find notifications by priority
         */
        List<Notification> findByPriorityOrderByCreatedAtDesc(String priority);

        /**
         * Find notifications created within a date range
         */
        List<Notification> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

        /**
         * Find notifications by recipient and date range
         */
        List<Notification> findByRecipientIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        String recipientId, LocalDateTime start, LocalDateTime end);

        /**
         * Find recent unread notifications by recipient
         */
        @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.read = false " +
                        "AND n.createdAt >= :since ORDER BY n.createdAt DESC")
        List<Notification> findRecentUnreadNotifications(
                        @Param("recipientId") String recipientId,
                        @Param("since") LocalDateTime since);

        /**
         * Find high priority unread notifications by recipient
         */
        @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.read = false " +
                        "AND n.priority IN ('HIGH', 'URGENT') ORDER BY n.createdAt DESC")
        List<Notification> findHighPriorityUnreadNotifications(@Param("recipientId") String recipientId);

        /**
         * Find notifications by multiple criteria
         */
        @Query("SELECT n FROM Notification n WHERE " +
                        "(:recipientId IS NULL OR n.recipientId = :recipientId) AND " +
                        "(:recipientType IS NULL OR n.recipientType = :recipientType) AND " +
                        "(:channel IS NULL OR n.channel = :channel) AND " +
                        "(:status IS NULL OR n.status = :status) AND " +
                        "(:priority IS NULL OR n.priority = :priority) AND " +
                        "(:isRead IS NULL OR n.read = :isRead) " +
                        "ORDER BY n.createdAt DESC")
        Page<Notification> findByCriteria(
                        @Param("recipientId") String recipientId,
                        @Param("recipientType") String recipientType,
                        @Param("channel") String channel,
                        @Param("status") String status,
                        @Param("priority") String priority,
                        @Param("isRead") Boolean isRead,
                        Pageable pageable);

        /**
         * Count notifications by status and date range for reporting
         */
        @Query("SELECT n.status, COUNT(n) FROM Notification n WHERE " +
                        "n.createdAt BETWEEN :start AND :end GROUP BY n.status")
        List<Object[]> countNotificationsByStatusAndDateRange(
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Count notifications by channel and date range for reporting
         */
        @Query("SELECT n.channel, COUNT(n) FROM Notification n WHERE " +
                        "n.createdAt BETWEEN :start AND :end GROUP BY n.channel")
        List<Object[]> countNotificationsByChannelAndDateRange(
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end);

        /**
         * Delete old read notifications (for cleanup)
         */
        @Query("DELETE FROM Notification n WHERE n.read = true AND n.readAt < :cutoffDate")
        int deleteOldReadNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);

        /**
         * Find notifications excluding welcome messages by recipient ID and type with
         * pagination
         */
        @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.recipientType = :recipientType " +
                        "AND (n.metadata IS NULL OR n.metadata NOT LIKE '%\"type\":\"WELCOME\"%') " +
                        "ORDER BY n.createdAt DESC")
        Page<Notification> findByRecipientIdAndRecipientTypeExcludingWelcomeOrderByCreatedAtDesc(
                        @Param("recipientId") String recipientId,
                        @Param("recipientType") String recipientType,
                        Pageable pageable);

        /**
         * Find unread notifications excluding welcome messages by recipient ID and type
         */
        @Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId AND n.recipientType = :recipientType " +
                        "AND n.read = false " +
                        "AND (n.metadata IS NULL OR n.metadata NOT LIKE '%\"type\":\"WELCOME\"%') " +
                        "ORDER BY n.createdAt DESC")
        List<Notification> findByRecipientIdAndRecipientTypeAndReadFalseExcludingWelcomeOrderByCreatedAtDesc(
                        @Param("recipientId") String recipientId,
                        @Param("recipientType") String recipientType);

        /**
         * Count unread notifications excluding welcome messages by recipient ID and
         * type
         */
        @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipientId = :recipientId AND n.recipientType = :recipientType "
                        +
                        "AND n.read = false " +
                        "AND (n.metadata IS NULL OR n.metadata NOT LIKE '%\"type\":\"WELCOME\"%')")
        long countByRecipientIdAndRecipientTypeAndReadFalseExcludingWelcome(
                        @Param("recipientId") String recipientId,
                        @Param("recipientType") String recipientType);
}
