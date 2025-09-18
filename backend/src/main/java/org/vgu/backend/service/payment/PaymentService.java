package org.vgu.backend.service.payment;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.PaymentRequest;
import org.vgu.backend.dto.response.PaymentResponse;
import org.vgu.backend.enums.PaymentMethod;
import org.vgu.backend.enums.PaymentStatus;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Booking;
import org.vgu.backend.model.Customer;
import org.vgu.backend.model.Payment;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class PaymentService implements IPaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private BookingRepository bookingRepository;

    private final Random random = new Random();

    @Override
    public PaymentResponse processPayment(PaymentRequest request, Account processedBy) {
        logger.info("Processing payment for booking {} by {}", request.getBookingId(), processedBy.getUsername());

        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new DataNotFoundException("Booking not found: " + request.getBookingId()));

        // Create payment record
        Payment payment = Payment.builder()
                .paymentNumber(generatePaymentNumber())
                .booking(booking)
                .amount(request.getAmount())
                .paymentMethod(request.getPaymentMethod())
                .referenceNumber(request.getReferenceNumber())
                .notes(request.getNotes())
                .processedBy(processedBy)
                .build();

        if (request.isSimulation()) {
            return simulatePaymentProcessing(payment);
        } else {
            return processRealPayment(payment, request);
        }
    }

    @Override
    public PaymentResponse simulatePayment(Long bookingId, PaymentMethod method, Account processedBy) {
        logger.info("Simulating payment for booking {} using {} by {}", bookingId, method, processedBy.getUsername());

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new DataNotFoundException("Booking not found: " + bookingId));

        Payment payment = Payment.builder()
                .paymentNumber(generatePaymentNumber())
                .booking(booking)
                .amount(booking.getTotalAmount())
                .paymentMethod(method)
                .referenceNumber("SIM-" + System.currentTimeMillis())
                .notes("Simulated payment for demo purposes")
                .processedBy(processedBy)
                .build();

        return simulatePaymentProcessing(payment);
    }

    private PaymentResponse simulatePaymentProcessing(Payment payment) {
        // Simulate payment gateway processing time
        try {
            Thread.sleep(1000 + random.nextInt(2000)); // 1-3 seconds delay
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simulate payment success/failure (90% success rate)
        boolean isSuccess = random.nextDouble() < 0.9;

        if (isSuccess) {
            payment.setStatus(PaymentStatus.COMPLETED);
            payment.setTransactionId("TXN-SIM-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            payment.setPaymentDate(LocalDateTime.now());
            payment.setGatewayResponse("Payment processed successfully via simulation");
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Simulated payment failure - insufficient funds");
            payment.setGatewayResponse("Payment failed via simulation");
        }

        Payment savedPayment = paymentRepository.save(payment);
        logger.info("Simulated payment {} with status: {}", savedPayment.getPaymentNumber(), savedPayment.getStatus());

        return convertToResponse(savedPayment);
    }

    private PaymentResponse processRealPayment(Payment payment, PaymentRequest request) {
        // This would integrate with real payment gateways
        // For now, we'll simulate it as well
        payment.setStatus(PaymentStatus.PROCESSING);
        payment.setTransactionId("TXN-REAL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        payment.setGatewayResponse("Processing payment through gateway...");

        Payment savedPayment = paymentRepository.save(payment);

        // Simulate gateway processing
        try {
            Thread.sleep(2000); // 2 seconds processing time
            
            // Update with final status
            savedPayment.setStatus(PaymentStatus.COMPLETED);
            savedPayment.setPaymentDate(LocalDateTime.now());
            savedPayment.setGatewayResponse("Payment completed successfully");
            savedPayment = paymentRepository.save(savedPayment);
            
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            savedPayment.setStatus(PaymentStatus.FAILED);
            savedPayment.setFailureReason("Payment processing interrupted");
            savedPayment = paymentRepository.save(savedPayment);
        }

        logger.info("Processed real payment {} with status: {}", savedPayment.getPaymentNumber(), savedPayment.getStatus());
        return convertToResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentResponse getPaymentByNumber(String paymentNumber) {
        Payment payment = paymentRepository.findByPaymentNumber(paymentNumber)
                .orElseThrow(() -> new DataNotFoundException("Payment not found: " + paymentNumber));
        return convertToResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByBookingId(Long bookingId) {
        List<Payment> payments = paymentRepository.findByBookingId(bookingId);
        return payments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PaymentResponse refundPayment(Long paymentId, String reason, Account processedBy) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new DataNotFoundException("Payment not found: " + paymentId));

        if (!payment.canBeRefunded()) {
            throw new IllegalStateException("Payment cannot be refunded");
        }

        BigDecimal refundAmount = payment.getRefundableAmount();
        payment.setRefundAmount(refundAmount);
        payment.setRefundDate(LocalDateTime.now());
        payment.setStatus(PaymentStatus.REFUNDED);
        payment.setNotes((payment.getNotes() != null ? payment.getNotes() + "; " : "") + "Refund reason: " + reason);
        payment.setProcessedBy(processedBy);

        Payment savedPayment = paymentRepository.save(payment);
        logger.info("Refunded payment {} with amount: {}", savedPayment.getPaymentNumber(), refundAmount);

        return convertToResponse(savedPayment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentHistory(String customerUsername) {
        // Get all payments for bookings made by this customer
        List<Payment> payments = paymentRepository.findAll().stream()
                .filter(payment -> {
                    Customer customer = payment.getBooking().getCustomer();
                    return customer != null && customer.getAccount().getUsername().equals(customerUsername);
                })
                .collect(Collectors.toList());

        return payments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isPaymentValid(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId)
                .map(Payment::isSuccessful)
                .orElse(false);
    }

    private PaymentResponse convertToResponse(Payment payment) {
        Booking booking = payment.getBooking();
        Customer customer = booking.getCustomer();

        return PaymentResponse.builder()
                .id(payment.getId())
                .paymentNumber(payment.getPaymentNumber())
                .bookingId(booking.getId())
                .bookingCode(booking.getBookingCode())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .status(payment.getStatus())
                .transactionId(payment.getTransactionId())
                .paymentDate(payment.getPaymentDate())
                .referenceNumber(payment.getReferenceNumber())
                .gatewayResponse(payment.getGatewayResponse())
                .failureReason(payment.getFailureReason())
                .refundAmount(payment.getRefundAmount())
                .refundDate(payment.getRefundDate())
                .notes(payment.getNotes())
                .createdAt(payment.getCreatedAt())
                .updatedAt(payment.getUpdatedAt())
                .processedBy(payment.getProcessedBy() != null ? payment.getProcessedBy().getUsername() : null)
                .customerName(customer != null ? customer.getAccount().getFirstName() + " " + customer.getAccount().getLastName() : "Unknown")
                .customerEmail(customer != null ? customer.getAccount().getEmail() : "Unknown")
                .routeName(booking.getSchedule() != null && booking.getSchedule().getRoute() != null ? 
                    booking.getSchedule().getRoute().getRouteName() : "Unknown Route")
                .departureTime(booking.getSchedule() != null ? booking.getSchedule().getDepartureTime() : null)
                .totalBookingAmount(booking.getTotalAmount())
                .isSuccessful(payment.isSuccessful())
                .canBeRefunded(payment.canBeRefunded())
                .refundableAmount(payment.getRefundableAmount())
                .build();
    }

    private String generatePaymentNumber() {
        return "PAY-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + 
               "-" + String.format("%06d", random.nextInt(999999));
    }
}
