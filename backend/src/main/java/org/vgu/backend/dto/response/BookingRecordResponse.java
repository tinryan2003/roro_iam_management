package org.vgu.backend.dto.response;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

/**
 * Response DTO for booking record audit trail data
 */
@Setter
@Getter
@Builder
public class BookingRecordResponse {
    
    private Long id;
    private Long bookingId;
    private String bookingCode;
    private String action;
    private String performedBy;
    private String description;
    private LocalDateTime createdAt;
    private String ipAddress;
    private boolean isSystemGenerated;
    
    // Additional fields for detailed view (optional)
    private String previousValues;
    private String currentValues;
    private String additionalData;
    private String userAgent;
    private String sessionId;
}
