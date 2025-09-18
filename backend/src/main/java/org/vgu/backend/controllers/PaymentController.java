package org.vgu.backend.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.vgu.backend.dto.request.PaymentRequest;
import org.vgu.backend.dto.response.PaymentResponse;
import org.vgu.backend.enums.PaymentMethod;
import org.vgu.backend.model.Account;
import org.vgu.backend.service.payment.IPaymentService;
import org.vgu.backend.repository.AccountRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("${api.prefix}/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger logger = LoggerFactory.getLogger(PaymentController.class);

    @Autowired
    private IPaymentService paymentService;

    @Autowired
    private AccountRepository accountRepository;

    /**
     * Process a payment for a booking
     */
    @PostMapping("/process")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> processPayment(
            @Valid @RequestBody PaymentRequest request,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Processing payment for booking {} by {}", request.getBookingId(), currentUser.getUsername());

            PaymentResponse response = paymentService.processPayment(request, currentUser);
            
            return ResponseEntity.ok(Map.of(
                "message", "Payment processed successfully",
                "payment", response
            ));

        } catch (Exception e) {
            logger.error("Error processing payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Simulate payment for demo purposes
     */
    @PostMapping("/simulate/{bookingId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> simulatePayment(
            @PathVariable Long bookingId,
            @RequestParam PaymentMethod method,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Simulating payment for booking {} using {} by {}", bookingId, method, currentUser.getUsername());

            PaymentResponse response = paymentService.simulatePayment(bookingId, method, currentUser);
            
            return ResponseEntity.ok(Map.of(
                "message", "Payment simulated successfully",
                "payment", response,
                "simulation", true
            ));

        } catch (Exception e) {
            logger.error("Error simulating payment: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payment by payment number
     */
    @GetMapping("/{paymentNumber}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT', 'ROLE_PLANNER')")
    public ResponseEntity<?> getPayment(@PathVariable String paymentNumber) {
        try {
            PaymentResponse response = paymentService.getPaymentByNumber(paymentNumber);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error getting payment {}: {}", paymentNumber, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all payments for a booking
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT', 'ROLE_PLANNER')")
    public ResponseEntity<?> getPaymentsByBooking(@PathVariable Long bookingId) {
        try {
            List<PaymentResponse> responses = paymentService.getPaymentsByBookingId(bookingId);
            return ResponseEntity.ok(Map.of(
                "payments", responses,
                "count", responses.size()
            ));
        } catch (Exception e) {
            logger.error("Error getting payments for booking {}: {}", bookingId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get payment history for current customer
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> getPaymentHistory(Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            List<PaymentResponse> responses = paymentService.getPaymentHistory(currentUser.getUsername());
            return ResponseEntity.ok(Map.of(
                "payments", responses,
                "count", responses.size()
            ));
        } catch (Exception e) {
            logger.error("Error getting payment history: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Refund a payment
     */
    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasRole('ROLE_ACCOUNTANT')")
    @Transactional
    public ResponseEntity<?> refundPayment(
            @PathVariable Long paymentId,
            @RequestParam String reason,
            Authentication authentication) {
        try {
            Account currentUser = getCurrentUser(authentication);
            if (currentUser == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            logger.info("Processing refund for payment {} by {}", paymentId, currentUser.getUsername());

            PaymentResponse response = paymentService.refundPayment(paymentId, reason, currentUser);
            
            return ResponseEntity.ok(Map.of(
                "message", "Payment refunded successfully",
                "payment", response
            ));

        } catch (Exception e) {
            logger.error("Error refunding payment {}: {}", paymentId, e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get available payment methods
     */
    @GetMapping("/methods")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> getPaymentMethods() {
        return ResponseEntity.ok(Map.of(
            "methods", PaymentMethod.values(),
            "simulation_available", true
        ));
    }

    /**
     * Validate payment transaction
     */
    @GetMapping("/validate/{transactionId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER', 'ROLE_ACCOUNTANT', 'ROLE_PLANNER')")
    public ResponseEntity<?> validatePayment(@PathVariable String transactionId) {
        try {
            boolean isValid = paymentService.isPaymentValid(transactionId);
            return ResponseEntity.ok(Map.of(
                "transactionId", transactionId,
                "isValid", isValid
            ));
        } catch (Exception e) {
            logger.error("Error validating payment {}: {}", transactionId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private Account getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        try {
            return accountRepository.findByUsername(authentication.getName())
                    .orElse(null);
        } catch (Exception e) {
            logger.error("Error getting current user: {}", e.getMessage());
            return null;
        }
    }
}
