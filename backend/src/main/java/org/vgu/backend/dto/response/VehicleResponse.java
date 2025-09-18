package org.vgu.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleResponse {
    private Long id;
    private String vehicleType;
    private String make;
    private String model;
    private Integer quantity;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private BigDecimal price; // Price of the vehicle based on its type

    // Customer information
    private Long customerId;
    private String customerName;

    // Booking information (if attached)
    private Long bookingId;
    private String bookingCode;
}
