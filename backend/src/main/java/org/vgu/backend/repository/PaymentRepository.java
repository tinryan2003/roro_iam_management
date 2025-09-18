package org.vgu.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.vgu.backend.enums.PaymentStatus;
import org.vgu.backend.model.Payment;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByPaymentNumber(String paymentNumber);

    Optional<Payment> findByTransactionId(String transactionId);

    List<Payment> findByBookingId(Long bookingId);

    List<Payment> findByStatus(PaymentStatus status);
}