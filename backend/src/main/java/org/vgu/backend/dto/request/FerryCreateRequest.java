package org.vgu.backend.dto.request;

import org.vgu.backend.enums.FerryStatus;

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
public class FerryCreateRequest {

    @NotBlank(message = "Ferry name is required")
    private String ferryName;

    @NotBlank(message = "Ferry code is required")
    private String ferryCode;

    @NotNull(message = "Vehicle capacity is required")
    @Positive(message = "Vehicle capacity must be positive")
    private Integer capacityVehicles;

    @NotNull(message = "Passenger capacity is required")
    @Positive(message = "Passenger capacity must be positive")
    private Integer capacityPassengers;

    private FerryStatus status = FerryStatus.ACTIVE;
}