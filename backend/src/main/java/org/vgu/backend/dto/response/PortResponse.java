package org.vgu.backend.dto.response;

import java.time.LocalDateTime;

import org.vgu.backend.model.Port;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortResponse {
    private Long id;
    private String portCode;
    private String portName;
    private String city;
    private String country;
    private Boolean isActive;
    private LocalDateTime createdAt;

    public static PortResponse from(Port port) {
        return PortResponse.builder()
                .id(port.getId())
                .portCode(port.getPortCode())
                .portName(port.getPortName())
                .city(port.getCity())
                .country(port.getCountry())
                .isActive(port.getIsActive())
                .createdAt(port.getCreatedAt())
                .build();
    }
}