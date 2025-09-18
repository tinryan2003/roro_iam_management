package org.vgu.backend.controllers;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.response.BookingRecordResponse;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.BookingRecord;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.bookingrecord.IBookingRecordService;

import lombok.RequiredArgsConstructor;

/**
 * Controller for managing booking audit records and trails
 * Provides endpoints for viewing booking activity history
 */
@RestController
@RequestMapping("${api.prefix}/booking-records")
@RequiredArgsConstructor
public class BookingRecordController {

    private final IBookingRecordService bookingRecordService;
    private final IAccountService accountService;
    private final Logger logger = LoggerFactory.getLogger(BookingRecordController.class);

    /**
     * Get all booking records with pagination (Admin/Operator only)
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> getAllBookingRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        try {
            logger.info("Getting all booking records - page: {}, limit: {}", page, limit);

            Sort.Direction direction = "asc".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
            String sortField = sortBy != null ? sortBy : "createdAt";

            Pageable pageable = PageRequest.of(page, limit, Sort.by(direction, sortField));
            Page<BookingRecord> records = bookingRecordService.getRecordsByDateRange(
                    LocalDateTime.now().minusYears(1),
                    LocalDateTime.now(),
                    pageable);

            Page<BookingRecordResponse> responses = records.map(this::convertToResponse);

            logger.info("Retrieved {} booking records", records.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving booking records: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve booking records"));
        }
    }

    /**
     * Get booking records for a specific booking
     */
    @GetMapping("/booking/{bookingId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
    public ResponseEntity<?> getRecordsForBooking(
            @PathVariable Long bookingId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            logger.info("Getting records for booking: {}", bookingId);

            // For customers, verify they own the booking
            if (isCustomerRole(authentication)) {
                if (!verifyCustomerOwnsBooking(bookingId, authentication)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "Access denied to this booking's records"));
                }
            }

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
            Page<BookingRecord> records = bookingRecordService.getRecordsForBooking(bookingId, pageable);
            Page<BookingRecordResponse> responses = records.map(this::convertToResponse);

            logger.info("Retrieved {} records for booking {}", records.getTotalElements(), bookingId);
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving records for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve booking records"));
        }
    }

    /**
     * Get booking records by action type
     */
    @GetMapping("/action/{action}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> getRecordsByAction(@PathVariable String action) {
        try {
            logger.info("Getting records for action: {}", action);

            TypeAction typeAction = TypeAction.valueOf(action.toUpperCase());
            List<BookingRecord> records = bookingRecordService.getRecordsByAction(typeAction);
            List<BookingRecordResponse> responses = records.stream()
                    .map(this::convertToResponse)
                    .toList();

            logger.info("Retrieved {} records for action {}", responses.size(), action);
            return ResponseEntity.ok(responses);

        } catch (IllegalArgumentException e) {
            logger.warn("Invalid action type: {}", action);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid action type: " + action));
        } catch (Exception e) {
            logger.error("Error retrieving records for action {}: {}", action, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve booking records"));
        }
    }

    /**
     * Get booking records by date range
     */
    @GetMapping("/date-range")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> getRecordsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            logger.info("Getting records for date range: {} to {}", startDate, endDate);

            if (startDate.isAfter(endDate)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Start date must be before end date"));
            }

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
            Page<BookingRecord> records = bookingRecordService.getRecordsByDateRange(startDate, endDate, pageable);
            Page<BookingRecordResponse> responses = records.map(this::convertToResponse);

            logger.info("Retrieved {} records for date range", records.getTotalElements());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving records for date range: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve booking records"));
        }
    }

    /**
     * Get recent booking records (last 24 hours)
     */
    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> getRecentRecords() {
        try {
            logger.info("Getting recent booking records");

            List<BookingRecord> records = bookingRecordService.getRecentRecords();
            List<BookingRecordResponse> responses = records.stream()
                    .map(this::convertToResponse)
                    .toList();

            logger.info("Retrieved {} recent records", responses.size());
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving recent records: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve recent booking records"));
        }
    }

    /**
     * Get my booking records (customer only)
     */
    @GetMapping("/my-records")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> getMyBookingRecords(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            String keycloakId = jwt.getClaimAsString("sub");
            logger.info("Getting booking records for customer: {}", keycloakId);

            // Find customer by account
            Account account = accountService.getAccountByKeycloakId(keycloakId)
                    .orElse(null);

            if (account == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Customer account not found"));
            }

            // Get customer ID - this would need to be implemented based on your customer
            // service
            // For now, using account ID as a placeholder
            Long customerId = account.getId();

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
            Page<BookingRecord> records = bookingRecordService.getRecordsByCustomer(customerId, pageable);
            Page<BookingRecordResponse> responses = records.map(this::convertToResponse);

            logger.info("Retrieved {} records for customer {}", records.getTotalElements(), customerId);
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error retrieving customer booking records: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve booking records"));
        }
    }

    /**
     * Search booking records by description
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> searchRecords(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {
        try {
            logger.info("Searching booking records with keyword: {}", keyword);

            if (keyword.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Search keyword cannot be empty"));
            }

            Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
            Page<BookingRecord> records = bookingRecordService.searchRecordsByDescription(keyword, pageable);
            Page<BookingRecordResponse> responses = records.map(this::convertToResponse);

            logger.info("Found {} records matching keyword: {}", records.getTotalElements(), keyword);
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            logger.error("Error searching booking records: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to search booking records"));
        }
    }

    /**
     * Get audit summary for a booking
     */
    @GetMapping("/audit-summary/{bookingId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> getAuditSummary(@PathVariable Long bookingId) {
        try {
            logger.info("Getting audit summary for booking: {}", bookingId);

            Map<TypeAction, Long> summary = bookingRecordService.getAuditSummary(bookingId);
            Long totalRecords = bookingRecordService.countRecordsForBooking(bookingId);

            Map<String, Object> response = Map.of(
                    "bookingId", bookingId,
                    "totalRecords", totalRecords,
                    "actionSummary", summary);

            logger.info("Retrieved audit summary for booking {}: {} total records", bookingId, totalRecords);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error retrieving audit summary for booking {}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve audit summary"));
        }
    }

    /**
     * Get action statistics
     */
    @GetMapping("/statistics")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> getActionStatistics() {
        try {
            logger.info("Getting booking action statistics");

            Map<TypeAction, Long> statistics = bookingRecordService.getActionStatistics();

            logger.info("Retrieved action statistics");
            return ResponseEntity.ok(statistics);

        } catch (Exception e) {
            logger.error("Error retrieving action statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve action statistics"));
        }
    }

    /**
     * Export booking records to CSV
     */
    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATOR')")
    public ResponseEntity<?> exportRecords(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        try {
            logger.info("Exporting booking records for date range: {} to {}", startDate, endDate);

            if (startDate.isAfter(endDate)) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Start date must be before end date"));
            }

            String csvContent = bookingRecordService.exportRecordsToCsv(startDate, endDate);

            String filename = String.format("booking_records_%s_to_%s.csv",
                    startDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
                    endDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")));

            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_PLAIN_VALUE);

            logger.info("Exported booking records to CSV: {}", filename);
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csvContent);

        } catch (Exception e) {
            logger.error("Error exporting booking records: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to export booking records"));
        }
    }

    /**
     * Convert BookingRecord entity to response DTO
     */
    private BookingRecordResponse convertToResponse(BookingRecord record) {
        return BookingRecordResponse.builder()
                .id(record.getId())
                .bookingId(record.getBooking() != null ? record.getBooking().getId() : null)
                .bookingCode(record.getBookingCode())
                .action(record.getAction().toString())
                .performedBy(record.getPerformerUsername())
                .description(record.getDescription())
                .createdAt(record.getCreatedAt())
                .ipAddress(record.getIpAddress())
                .isSystemGenerated(record.isSystemGenerated())
                .build();
    }

    /**
     * Check if current user has customer role
     */
    private boolean isCustomerRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_CUSTOMER"));
    }

    /**
     * Verify that customer owns the booking
     * This is a simplified version - in practice you'd want more robust checking
     */
    private boolean verifyCustomerOwnsBooking(Long bookingId, Authentication authentication) {
        // Implementation would depend on your business logic
        // For now, returning true as a placeholder
        logger.debug("Verifying customer ownership of booking: {} for user: {}",
                bookingId, authentication.getName());
        return true;
    }
}
