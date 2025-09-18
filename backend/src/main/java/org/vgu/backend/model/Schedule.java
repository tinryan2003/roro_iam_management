package org.vgu.backend.model;

import java.time.LocalDateTime;
import java.time.LocalTime;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.vgu.backend.enums.ScheduleStatus;

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
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Schedule entity represents a specific ferry departure on a route
 * This is the core entity for RoRo ferry operations
 */
@Entity
@Table(name = "schedules", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "ferry_id", "departure_time" }) // Prevent double-booking ferry
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Schedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ferry_id", nullable = false)
    private Ferry ferry;

    @Column(name = "departure_time", nullable = false)
    private LocalDateTime departureTime;

    @Column(name = "arrival_time", nullable = false)
    private LocalDateTime arrivalTime;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ScheduleStatus status = ScheduleStatus.SCHEDULED;

    // Capacity tracking
    @Column(name = "available_vehicle_spaces")
    private Integer availableVehicleSpaces;

    @Column(name = "available_passenger_spaces")
    private Integer availablePassengerSpaces;

    @Column(name = "booking_deadline")
    private LocalDateTime bookingDeadline;

    @Column(name = "check_in_start_time")
    private LocalTime checkInStartTime;

    @Column(name = "check_in_end_time")
    private LocalTime checkInEndTime;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at")
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Helper methods
    public boolean isBookingOpen() {
        return status == ScheduleStatus.SCHEDULED &&
                (bookingDeadline == null || LocalDateTime.now().isBefore(bookingDeadline));
    }

    public boolean hasCapacityFor(int vehicles, int passengers) {
        return (availableVehicleSpaces == null || availableVehicleSpaces >= vehicles) &&
                (availablePassengerSpaces == null || availablePassengerSpaces >= passengers);
    }

    public void reduceCapacity(int vehicles, int passengers) {
        if (availableVehicleSpaces != null) {
            availableVehicleSpaces = Math.max(0, availableVehicleSpaces - vehicles);
        }
        if (availablePassengerSpaces != null) {
            availablePassengerSpaces = Math.max(0, availablePassengerSpaces - passengers);
        }
    }

    public void increaseCapacity(int vehicles, int passengers) {
        if (availableVehicleSpaces != null) {
            availableVehicleSpaces += vehicles;
        }
        if (availablePassengerSpaces != null) {
            availablePassengerSpaces += passengers;
        }
    }
}
