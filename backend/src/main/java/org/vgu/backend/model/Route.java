package org.vgu.backend.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "routes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "route_name", nullable = false)
    private String routeName;

    @ManyToOne
    @JoinColumn(name = "departure_port_id", nullable = false)
    private Port departurePort;

    @ManyToOne
    @JoinColumn(name = "arrival_port_id", nullable = false)
    private Port arrivalPort;

    @Column(name = "duration_hours")
    private Integer durationHours;

    @Column(name = "price", nullable = false)
    private BigDecimal price;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Ferries are now linked through Schedule entity

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}