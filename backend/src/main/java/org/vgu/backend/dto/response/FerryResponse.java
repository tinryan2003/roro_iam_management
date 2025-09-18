package org.vgu.backend.dto.response;

import java.time.LocalDateTime;

import org.vgu.backend.enums.FerryStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FerryResponse {
    private Long id;
    private String ferryName;
    private String ferryCode;
    private Integer capacityVehicles;
    private Integer capacityPassengers;
    private FerryStatus status;
    private LocalDateTime createdAt;
}