package org.vgu.backend.service.payment;

import org.vgu.backend.dto.request.PaymentRequest;
import org.vgu.backend.dto.response.PaymentResponse;
import org.vgu.backend.enums.PaymentMethod;
import org.vgu.backend.model.Payment;
import org.vgu.backend.model.Account;

import java.util.List;

public interface IPaymentService {

    /**
     * Process a payment for a booking
     */
    PaymentResponse processPayment(PaymentRequest request, Account processedBy);

    /**
     * Simulate payment processing (for demo purposes)
     */
    PaymentResponse simulatePayment(Long bookingId, PaymentMethod method, Account processedBy);

    /**
     * Get payment by payment number
     */
    PaymentResponse getPaymentByNumber(String paymentNumber);

    /**
     * Get all payments for a booking
     */
    List<PaymentResponse> getPaymentsByBookingId(Long bookingId);

    /**
     * Refund a payment
     */
    PaymentResponse refundPayment(Long paymentId, String reason, Account processedBy);

    /**
     * Get payment history for a customer
     */
    List<PaymentResponse> getPaymentHistory(String customerUsername);

    /**
     * Validate payment status
     */
    boolean isPaymentValid(String transactionId);
}
