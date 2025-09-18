package org.vgu.backend.model;

import java.time.LocalDateTime;

import org.vgu.backend.enums.FerryStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ferries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ferry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ferry_name", nullable = false)
    private String ferryName;

    @Column(name = "ferry_code", unique = true, nullable = false)
    private String ferryCode;

    @Column(name = "capacity_vehicles", nullable = false)
    private Integer capacityVehicles;

    @Column(name = "capacity_passengers", nullable = false)
    private Integer capacityPassengers;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private FerryStatus status = FerryStatus.ACTIVE;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}