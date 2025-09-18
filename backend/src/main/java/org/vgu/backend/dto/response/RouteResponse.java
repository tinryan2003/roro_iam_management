package org.vgu.backend.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.vgu.backend.model.Route;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private Long id;
    private String routeName;
    private PortInfo departurePort;
    private PortInfo arrivalPort;
    private Integer durationHours;
    private BigDecimal price;
    private Boolean isActive;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PortInfo {
        private Long id;
        private String portName;
        private String portCode;
        private String city;
        private String country;
    }

    public static RouteResponse from(Route route) {
        return RouteResponse.builder()
                .id(route.getId())
                .routeName(route.getRouteName())
                .departurePort(PortInfo.builder()
                        .id(route.getDeparturePort().getId())
                        .portName(route.getDeparturePort().getPortName())
                        .portCode(route.getDeparturePort().getPortCode())
                        .city(route.getDeparturePort().getCity())
                        .country(route.getDeparturePort().getCountry())
                        .build())
                .arrivalPort(PortInfo.builder()
                        .id(route.getArrivalPort().getId())
                        .portName(route.getArrivalPort().getPortName())
                        .portCode(route.getArrivalPort().getPortCode())
                        .city(route.getArrivalPort().getCity())
                        .country(route.getArrivalPort().getCountry())
                        .build())
                .durationHours(route.getDurationHours())
                .price(route.getPrice())
                .isActive(route.getIsActive())
                .createdAt(route.getCreatedAt())
                .build();
    }
}
