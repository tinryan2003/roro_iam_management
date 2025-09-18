package org.vgu.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notifications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private String recipientId;

    @Column(name = "recipient_type", nullable = false)
    private String recipientType; // CUSTOMER, EMPLOYEE, ADMIN

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "priority")
    private String priority; // LOW, NORMAL, HIGH, URGENT

    @Column(name = "channel", nullable = false)
    private String channel; // EMAIL, SMS, PUSH, IN_APP, SYSTEM_LOG

    @Column(name = "status", nullable = false)
    private String status; // SENT, FAILED, UNREAD, READ, LOGGED

    @Column(name = "is_read")
    @Builder.Default
    private Boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata; // JSON string for additional data

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (read == null) {
            read = false;
        }
        if (priority == null) {
            priority = "NORMAL";
        }
        if (status == null) {
            status = "UNREAD";
        }
    }
}
