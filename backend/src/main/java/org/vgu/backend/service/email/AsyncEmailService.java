package org.vgu.backend.service.email;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

/**
 * Asynchronous email service for sending booking-related emails
 * This is a mock implementation that logs emails instead of actually sending
 * them
 * In production, integrate with actual email providers like SendGrid, AWS SES,
 * etc.
 */
@Service
@RequiredArgsConstructor
public class AsyncEmailService {

    private static final Logger logger = LoggerFactory.getLogger(AsyncEmailService.class);

    /**
     * Asynchronously send an email
     */
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendEmailAsync(String to, String subject, String body) {
        try {
            logger.info("Sending async email to: {} with subject: {}", to, subject);

            // Simulate email sending processing time
            Thread.sleep(200);

            // Log the email content (in production, integrate with real email service)
            logger.info("EMAIL SENT TO: {}", to);
            logger.info("SUBJECT: {}", subject);
            logger.info("BODY: {}", body);
            logger.info("TIMESTAMP: {}", LocalDateTime.now());

            // Simulate 95% success rate
            boolean success = Math.random() > 0.05;

            if (success) {
                logger.info("Email successfully sent to: {}", to);
            } else {
                logger.error("Failed to send email to: {}", to);
            }

            return CompletableFuture.completedFuture(success);

        } catch (Exception e) {
            logger.error("Error sending email to {}: {}", to, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }

    /**
     * Send notification email to accountant about new booking
     */
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendNewBookingNotification(String accountantEmail, String bookingCode,
            String customerName, Double totalAmount) {
        String subject = String.format("New Booking Requires Approval - %s", bookingCode);
        String body = String.format(
                "Dear Accountant,\n\n" +
                        "A new booking requires your approval:\n" +
                        "- Booking Code: %s\n" +
                        "- Customer: %s\n" +
                        "- Total Amount: $%.2f\n" +
                        "- Time: %s\n\n" +
                        "Please review and approve/reject this booking in the accountant dashboard.\n\n" +
                        "Best regards,\n" +
                        "RORO Management System",
                bookingCode, customerName, totalAmount, LocalDateTime.now());

        return sendEmailAsync(accountantEmail, subject, body);
    }

    /**
     * Send booking status update to customer
     */
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendStatusUpdateNotification(String customerEmail, String bookingCode,
            String status, String message) {
        String subject = String.format("Booking Status Update - %s", bookingCode);
        String body = String.format(
                "Dear Customer,\n\n" +
                        "Your booking status has been updated:\n" +
                        "- Booking Code: %s\n" +
                        "- New Status: %s\n" +
                        "- Message: %s\n" +
                        "- Updated: %s\n\n" +
                        "You can check your booking details in the customer dashboard.\n\n" +
                        "Best regards,\n" +
                        "RORO Management System",
                bookingCode, status, message, LocalDateTime.now());

        return sendEmailAsync(customerEmail, subject, body);
    }

    /**
     * Send review notification to planner/operation manager
     */
    @Async("emailExecutor")
    public CompletableFuture<Boolean> sendReviewNotification(String reviewerEmail, String bookingCode,
            String customerName, String deadline) {
        String subject = String.format("Booking Ready for Review - %s", bookingCode);
        String body = String.format(
                "Dear Team,\n\n" +
                        "A paid booking is ready for your review:\n" +
                        "- Booking Code: %s\n" +
                        "- Customer: %s\n" +
                        "- Review Deadline: %s\n" +
                        "- Time: %s\n\n" +
                        "Please review this booking within the 30-minute window.\n\n" +
                        "Best regards,\n" +
                        "RORO Management System",
                bookingCode, customerName, deadline, LocalDateTime.now());

        return sendEmailAsync(reviewerEmail, subject, body);
    }
}
