package org.vgu.backend.dto.request;

import java.time.LocalDateTime;
import java.time.LocalTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleUpdateRequest {
    private Long routeId;
    private Long ferryId;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private Integer availablePassengerSpaces;
    private Integer availableVehicleSpaces;
    private LocalDateTime bookingDeadline;
    private LocalTime checkInStartTime;
    private LocalTime checkInEndTime;
    private String status;
    private String notes;
}
