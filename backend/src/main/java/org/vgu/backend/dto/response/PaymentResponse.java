package org.vgu.backend.dto.response;

import org.vgu.backend.enums.PaymentMethod;
import org.vgu.backend.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    
    private Long id;
    private String paymentNumber;
    private Long bookingId;
    private String bookingCode;
    private BigDecimal amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String transactionId;
    private LocalDateTime paymentDate;
    private String referenceNumber;
    private String gatewayResponse;
    private String failureReason;
    private BigDecimal refundAmount;
    private LocalDateTime refundDate;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String processedBy;
    
    // Customer information
    private String customerName;
    private String customerEmail;
    
    // Booking details
    private String routeName;
    private LocalDateTime departureTime;
    private BigDecimal totalBookingAmount;
    
    // Payment status helpers
    private boolean isSuccessful;
    private boolean canBeRefunded;
    private BigDecimal refundableAmount;
}
