package org.vgu.backend.dto.request;

import org.vgu.backend.enums.VehicleType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VehicleUpdateRequest {
    private VehicleType vehicleType;
    private String make;
    private String model;
    private Integer quantity;
    private Boolean isActive;
}


