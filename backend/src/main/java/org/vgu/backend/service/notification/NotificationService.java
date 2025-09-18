package org.vgu.backend.service.notification;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.model.Notification;
import org.vgu.backend.repository.NotificationRepository;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing internal notifications within the application
 * Handles creation, retrieval, and management of user notifications
 */
@Service
@Slf4j
@Transactional
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * Create a new notification for a user
     */
    public Notification createNotification(String recipientId, String recipientType,
            String title, String message, String priority,
            String metadata) {
        try {
            Notification notification = Notification.builder()
                    .recipientId(recipientId)
                    .recipientType(recipientType)
                    .title(title)
                    .message(message)
                    .priority(priority)
                    .channel("IN_APP")
                    .status("UNREAD")
                    .read(false)
                    .metadata(metadata)
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.info("Created notification for user {}: {}", recipientId, title);
            return saved;
        } catch (Exception e) {
            log.error("Failed to create notification for user {}: {}", recipientId, e.getMessage());
            throw new RuntimeException("Failed to create notification", e);
        }
    }

    /**
     * Get notifications for a specific user with pagination (excluding welcome
     * messages)
     */
    @Transactional(readOnly = true)
    public Page<Notification> getNotificationsForUser(String recipientId, String recipientType,
            int page, int size) {
        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
            // Use new method that excludes welcome notifications
            return notificationRepository.findByRecipientIdAndRecipientTypeExcludingWelcomeOrderByCreatedAtDesc(
                    recipientId, recipientType, pageable);
        } catch (Exception e) {
            log.error("Failed to get notifications for user {}: {}", recipientId, e.getMessage());
            throw new RuntimeException("Failed to retrieve notifications", e);
        }
    }

    /**
     * Get unread notifications for a user (excluding welcome messages)
     */
    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(String recipientId, String recipientType) {
        try {
            // Use new method that excludes welcome notifications
            return notificationRepository
                    .findByRecipientIdAndRecipientTypeAndReadFalseExcludingWelcomeOrderByCreatedAtDesc(
                            recipientId, recipientType);
        } catch (Exception e) {
            log.error("Failed to get unread notifications for user {}: {}", recipientId, e.getMessage());
            throw new RuntimeException("Failed to retrieve unread notifications", e);
        }
    }

    /**
     * Get unread notification count for a user (excluding welcome messages)
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String recipientId, String recipientType) {
        try {
            // Use new method that excludes welcome notifications
            return notificationRepository.countByRecipientIdAndRecipientTypeAndReadFalseExcludingWelcome(
                    recipientId, recipientType);
        } catch (Exception e) {
            log.error("Failed to get unread count for user {}: {}", recipientId, e.getMessage());
            return 0;
        }
    }

    /**
     * Mark a notification as read
     */
    public void markAsRead(Long notificationId, String recipientId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            if (!notification.getRecipientId().equals(recipientId)) {
                throw new RuntimeException("Unauthorized access to notification");
            }

            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notification.setStatus("READ");

            notificationRepository.save(notification);
            log.info("Marked notification {} as read for user {}", notificationId, recipientId);
        } catch (Exception e) {
            log.error("Failed to mark notification {} as read: {}", notificationId, e.getMessage());
            throw new RuntimeException("Failed to mark notification as read", e);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(String recipientId, String recipientType) {
        try {
            List<Notification> unreadNotifications = getUnreadNotifications(recipientId, recipientType);

            for (Notification notification : unreadNotifications) {
                notification.setRead(true);
                notification.setReadAt(LocalDateTime.now());
                notification.setStatus("READ");
            }

            if (!unreadNotifications.isEmpty()) {
                notificationRepository.saveAll(unreadNotifications);
                log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), recipientId);
            }
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read for user {}: {}", recipientId, e.getMessage());
            throw new RuntimeException("Failed to mark all notifications as read", e);
        }
    }

    /**
     * Delete a notification
     */
    public void deleteNotification(Long notificationId, String recipientId) {
        try {
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            if (!notification.getRecipientId().equals(recipientId)) {
                throw new RuntimeException("Unauthorized access to notification");
            }

            notificationRepository.deleteById(notificationId);
            log.info("Deleted notification {} for user {}", notificationId, recipientId);
        } catch (Exception e) {
            log.error("Failed to delete notification {}: {}", notificationId, e.getMessage());
            throw new RuntimeException("Failed to delete notification", e);
        }
    }

    /**
     * Delete all notifications for a user
     */
    public void deleteAllNotifications(String recipientId, String recipientType) {
        try {
            notificationRepository.deleteByRecipientIdAndRecipientType(recipientId, recipientType);
            log.info("Deleted all notifications for user {}", recipientId);
        } catch (Exception e) {
            log.error("Failed to delete all notifications for user {}: {}", recipientId, e.getMessage());
            throw new RuntimeException("Failed to delete all notifications", e);
        }
    }

    // Booking-specific notification methods

    /**
     * Notify customer of booking creation
     */
    public void notifyCustomerOfBookingCreation(String customerId, String bookingCode) {
        try {
            String metadata = String.format("{\"type\":\"BOOKING_CREATED\",\"bookingCode\":\"%s\"}", bookingCode);

            createNotification(
                    customerId,
                    "CUSTOMER",
                    "Booking Created Successfully",
                    String.format("Your booking %s has been created and is pending approval.", bookingCode),
                    "NORMAL",
                    metadata);
        } catch (Exception e) {
            log.error("Failed to notify customer {} of booking creation: {}", customerId, e.getMessage());
        }
    }

    /**
     * Notify accountants of new booking for approval
     */
    public void notifyAccountantsOfNewBooking(List<String> accountantIds, String bookingCode) {
        try {
            String metadata = String.format("{\"type\":\"BOOKING_APPROVAL_REQUIRED\",\"bookingCode\":\"%s\"}",
                    bookingCode);

            for (String accountantId : accountantIds) {
                createNotification(
                        accountantId,
                        "EMPLOYEE",
                        "New Booking Requires Approval",
                        String.format("Booking %s is waiting for your approval.", bookingCode),
                        "HIGH",
                        metadata);
            }

            log.info("Notified {} accountants of new booking {}", accountantIds.size(), bookingCode);
        } catch (Exception e) {
            log.error("Failed to notify accountants of new booking {}: {}", bookingCode, e.getMessage());
        }
    }

    /**
     * Notify customer of booking status change
     */
    public void notifyCustomerOfStatusChange(String customerId, String bookingCode,
            String status, String message) {
        try {
            String metadata = String.format("{\"type\":\"BOOKING_%s\",\"bookingCode\":\"%s\"}", status, bookingCode);

            String title = switch (status) {
                case "APPROVED" -> "Booking Approved";
                case "REJECTED" -> "Booking Rejected";
                case "COMPLETED" -> "Journey Completed";
                default -> "Booking Status Updated";
            };

            String priority = status.equals("REJECTED") ? "HIGH" : "NORMAL";

            createNotification(
                    customerId,
                    "CUSTOMER",
                    title,
                    message,
                    priority,
                    metadata);
        } catch (Exception e) {
            log.error("Failed to notify customer {} of status change: {}", customerId, e.getMessage());
        }
    }

    /**
     * Notify customer of payment confirmation
     */
    public void notifyPaymentConfirmation(String customerId, String bookingCode, String amount) {
        try {
            String metadata = String.format("{\"type\":\"PAYMENT_CONFIRMED\",\"bookingCode\":\"%s\",\"amount\":\"%s\"}",
                    bookingCode, amount);

            createNotification(
                    customerId,
                    "CUSTOMER",
                    "Payment Confirmed",
                    String.format("Payment of %s for booking %s has been confirmed.", amount, bookingCode),
                    "NORMAL",
                    metadata);
        } catch (Exception e) {
            log.error("Failed to notify customer {} of payment confirmation: {}", customerId, e.getMessage());
        }
    }
}