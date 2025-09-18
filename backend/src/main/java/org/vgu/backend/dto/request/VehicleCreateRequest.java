package org.vgu.backend.dto.request;

import org.vgu.backend.enums.VehicleType;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleCreateRequest {
    @NotNull(message = "Vehicle type is required")
    private VehicleType vehicleType;

    private String make;

    private String model;

    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
}
