package org.vgu.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

import org.vgu.backend.enums.ScheduleStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleResponse {

    private Long id;
    private Long routeId;
    private String routeName;
    private Long ferryId;
    private String ferryName;
    private String ferryCode;
    private String departurePortName;
    private String arrivalPortName;
    private LocalDateTime departureTime;
    private LocalDateTime arrivalTime;
    private ScheduleStatus status;
    private Integer availableVehicleSpaces;
    private Integer availablePassengerSpaces;
    private BigDecimal basePrice;
    private LocalDateTime bookingDeadline;
    private LocalTime checkInStartTime;
    private LocalTime checkInEndTime;
    private Boolean isBookingOpen;
    private String notes;
}
