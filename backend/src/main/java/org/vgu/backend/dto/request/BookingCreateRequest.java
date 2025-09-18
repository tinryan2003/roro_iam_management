package org.vgu.backend.dto.request;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class BookingCreateRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Schedule ID is required")
    private Long scheduleId;

    // Optional - booking can be for passengers only
    private Long vehicleId; // Optional: Can be null if no vehicle is being booked
    private List<Long> vehicleIds; // New: For multiple vehicles

    // Optional - will be auto-generated if not provided
    private String bookingCode;

    @NotNull(message = "Passenger count is required")
    @Min(value = 1, message = "At least 1 passenger is required")
    private Integer passengerCount;

    @NotNull(message = "Total amount is required")
    @Min(value = 0, message = "Total amount must be positive")
    private BigDecimal totalAmount;
}
