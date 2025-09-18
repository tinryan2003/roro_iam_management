package org.vgu.backend.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteUpdateRequest {

    @NotBlank(message = "Route name is required")
    private String routeName;

    @NotNull(message = "Departure port ID is required")
    private Long departurePortId;

    @NotNull(message = "Arrival port ID is required")
    private Long arrivalPortId;

    @NotNull(message = "Duration hours is required")
    @Positive(message = "Duration hours must be positive")
    private Integer durationHours;

    @NotNull(message = "Price is required")
    @Positive(message = "Price must be positive")
    private BigDecimal price;

    @NotNull(message = "Active status is required")
    private Boolean isActive;
}