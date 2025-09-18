package org.vgu.backend.model;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;
import org.vgu.backend.enums.TypeAction;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity to track all booking-related activities for audit purposes
 * Records what actions were performed, by whom, and when
 */
@Entity
@Table(name = "booking_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false)
    private TypeAction action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "performed_by")
    private Account performedBy;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "previous_values", columnDefinition = "TEXT")
    private String previousValues;

    @Column(name = "current_values", columnDefinition = "TEXT")
    private String currentValues;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "session_id")
    private String sessionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "additional_data", columnDefinition = "TEXT")
    private String additionalData;

    // Convenience constructor for common use cases
    public BookingRecord(Booking booking, TypeAction action, Account performedBy, String description) {
        this.booking = booking;
        this.action = action;
        this.performedBy = performedBy;
        this.description = description;
    }

    // Helper method to get booking code for easier identification
    public String getBookingCode() {
        return booking != null ? booking.getBookingCode() : null;
    }

    // Helper method to get performer's username
    public String getPerformerUsername() {
        return performedBy != null ? performedBy.getUsername() : "SYSTEM";
    }

    // Helper method to check if this is a system-generated record
    public boolean isSystemGenerated() {
        return performedBy == null;
    }

    // Helper method to format for logging
    public String getLogFormat() {
        return String.format("[%s] %s - %s performed by %s on booking %s",
                createdAt,
                action,
                description,
                getPerformerUsername(),
                getBookingCode());
    }
}
