package org.vgu.backend.dto.request;

import lombok.*;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.jboss.logging.annotations.Pos;

import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * Request DTO for updating booking information
 * Used with async notification system for real-time updates
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class BookingUpdateRequest {

    @NotNull(message = "Booking ID is required")
    @Positive(message = "Booking ID must be positive")
    private Long id;

    @Size(max = 100, message = "Customer name cannot exceed 100 characters")
    private String customerName;

    @Positive(message = "Customer ID must be positive")
    private Long customerId;

    @Positive(message = "Route ID must be positive")
    private Long routeId;

    @Positive(message = "Ferry ID must be positive")
    private Long ferryId;

    @Positive(message = "Vehicle ID must be positive")
    private Long vehicleId;

    @Positive(message = "Schedule ID must be positive")
    private Long scheduleId;

    @Size(max = 20, message = "Booking code cannot exceed 20 characters")
    @Pattern(regexp = "^[A-Z0-9-]+$", message = "Booking code must contain only uppercase letters, numbers, and hyphens")
    private String bookingCode;

    @Positive(message = "Passenger count must be positive")
    @Max(value = 200, message = "Passenger count cannot exceed 200")
    private Integer passengerCount;

    @DecimalMin(value = "0.0", inclusive = false, message = "Total amount must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Total amount must have at most 10 integer digits and 2 decimal places")
    private BigDecimal totalAmount;

    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime departureTime;

    // Additional fields for async workflow
    @Size(max = 500, message = "Update notes cannot exceed 500 characters")
    private String updateNotes;

    @Size(max = 100, message = "Updated by field cannot exceed 100 characters")
    private String updatedBy;

    // Validation flag for async processing
    @Builder.Default
    private Boolean skipAsyncNotification = false;

    // Priority level for async processing (LOW, NORMAL, HIGH)
    @Builder.Default
    @Pattern(regexp = "^(LOW|NORMAL|HIGH)$", message = "Priority must be LOW, NORMAL, or HIGH")
    private String priority = "NORMAL";

}
