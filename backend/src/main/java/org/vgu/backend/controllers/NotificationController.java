package org.vgu.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.model.Notification;
import org.vgu.backend.service.notification.NotificationService;

import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for managing user notifications
 * Provides endpoints for viewing, marking as read, and deleting notifications
 */
@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    /**
     * Get user's notifications with pagination
     */
    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyNotifications(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        try {
            // Handle case when authentication is disabled
            String username = getUsername(authentication);
            String recipientType = determineRecipientType(authentication);

            Page<Notification> notifications = notificationService.getNotificationsForUser(
                    username, recipientType, page, size);

            Map<String, Object> response = new HashMap<>();
            response.put("content", notifications.getContent());
            response.put("totalElements", notifications.getTotalElements());
            response.put("totalPages", notifications.getTotalPages());
            response.put("currentPage", notifications.getNumber());
            response.put("size", notifications.getSize());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get notifications for user: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get user's unread notifications
     */
    @GetMapping("/my/unread")
    public ResponseEntity<Map<String, Object>> getUnreadNotifications(Authentication authentication) {
        try {
            String username = getUsername(authentication);
            String recipientType = determineRecipientType(authentication);

            List<Notification> notifications = notificationService.getUnreadNotifications(username, recipientType);

            Map<String, Object> response = new HashMap<>();
            response.put("notifications", notifications);
            response.put("count", notifications.size());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get unread notifications for user: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get unread notification count
     */
    @GetMapping("/my/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(Authentication authentication) {
        try {
            String username = getUsername(authentication);
            String recipientType = determineRecipientType(authentication);

            long count = notificationService.getUnreadCount(username, recipientType);

            Map<String, Object> response = new HashMap<>();
            response.put("count", count);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get unread count for user: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark a notification as read
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        try {
            String username = getUsername(authentication);
            notificationService.markAsRead(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to mark notification {} as read: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Mark all notifications as read
     */
    @PatchMapping("/my/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        try {
            String username = getUsername(authentication);
            String recipientType = determineRecipientType(authentication);

            notificationService.markAllAsRead(username, recipientType);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to mark all notifications as read for user: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete a notification
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, Authentication authentication) {
        try {
            String username = getUsername(authentication);
            notificationService.deleteNotification(id, username);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to delete notification {}: {}", id, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Delete all notifications
     */
    @DeleteMapping("/my")
    public ResponseEntity<Void> deleteAllNotifications(Authentication authentication) {
        try {
            String username = getUsername(authentication);
            String recipientType = determineRecipientType(authentication);

            notificationService.deleteAllNotifications(username, recipientType);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to delete all notifications for user: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Get username from authentication, with fallback for disabled auth
     */
    private String getUsername(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            // Fallback when authentication is disabled - use a default user
            return "anonymous";
        }
        return authentication.getName();
    }

    /**
     * Determine recipient type based on user's authorities/roles
     */
    private String determineRecipientType(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            // Fallback when authentication is disabled
            return "CUSTOMER";
        }

        // Check user authorities to determine type
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));
        boolean isEmployee = authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_EMPLOYEE") ||
                        auth.getAuthority().equals("ROLE_ACCOUNTANT"));

        if (isAdmin) {
            return "ADMIN";
        } else if (isEmployee) {
            return "EMPLOYEE";
        } else {
            return "CUSTOMER";
        }
    }
}