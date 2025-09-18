package org.vgu.backend.dto.request;

import org.vgu.backend.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {
    
    @NotNull(message = "Booking ID is required")
    private Long bookingId;
    
    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;
    
    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;
    
    @Size(max = 100, message = "Reference number cannot exceed 100 characters")
    private String referenceNumber;
    
    @Size(max = 500, message = "Notes cannot exceed 500 characters")
    private String notes;
    
    // For simulation purposes
    @Builder.Default
    private boolean isSimulation = false;
    
    // Mock payment gateway fields
    private String cardNumber;
    private String cardHolderName;
    private String expiryDate;
    private String cvv;
    
    // Bank transfer fields
    private String bankAccountNumber;
    private String bankName;
    
    // Digital wallet fields
    private String walletId;
    private String walletProvider;
}
