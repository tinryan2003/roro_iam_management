package org.vgu.backend.service.bookingrecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Booking;
import org.vgu.backend.model.BookingRecord;

/**
 * Service interface for managing booking records and audit trails
 */
public interface IBookingRecordService {

    /**
     * Create a new booking record
     * @param booking The booking this record relates to
     * @param action The action that was performed
     * @param performedBy The account that performed the action (null for system actions)
     * @param description Description of what happened
     * @return The created booking record
     */
    BookingRecord createRecord(Booking booking, TypeAction action, Account performedBy, String description);

    /**
     * Create a booking record with additional context
     * @param booking The booking this record relates to
     * @param action The action that was performed
     * @param performedBy The account that performed the action
     * @param description Description of what happened
     * @param previousValues JSON string of previous values (for updates)
     * @param currentValues JSON string of current values (for updates)
     * @param additionalData Any additional data to store
     * @return The created booking record
     */
    BookingRecord createDetailedRecord(Booking booking, TypeAction action, Account performedBy, 
                                     String description, String previousValues, String currentValues, 
                                     String additionalData);

    /**
     * Create a system-generated record
     * @param booking The booking this record relates to
     * @param action The action that was performed
     * @param description Description of what happened
     * @return The created booking record
     */
    BookingRecord createSystemRecord(Booking booking, TypeAction action, String description);

    /**
     * Get all records for a specific booking
     * @param bookingId The booking ID
     * @return List of booking records
     */
    List<BookingRecord> getRecordsForBooking(Long bookingId);

    /**
     * Get paginated records for a specific booking
     * @param bookingId The booking ID
     * @param pageable Pagination information
     * @return Page of booking records
     */
    Page<BookingRecord> getRecordsForBooking(Long bookingId, Pageable pageable);

    /**
     * Get records by booking code
     * @param bookingCode The booking code
     * @return List of booking records
     */
    List<BookingRecord> getRecordsByBookingCode(String bookingCode);

    /**
     * Get records by action type
     * @param action The action type
     * @return List of booking records
     */
    List<BookingRecord> getRecordsByAction(TypeAction action);

    /**
     * Get records performed by a specific account
     * @param accountId The account ID
     * @param pageable Pagination information
     * @return Page of booking records
     */
    Page<BookingRecord> getRecordsByPerformer(Long accountId, Pageable pageable);

    /**
     * Get records within a date range
     * @param startDate Start date
     * @param endDate End date
     * @param pageable Pagination information
     * @return Page of booking records
     */
    Page<BookingRecord> getRecordsByDateRange(LocalDateTime startDate, LocalDateTime endDate, Pageable pageable);

    /**
     * Get recent records (last 24 hours)
     * @return List of recent booking records
     */
    List<BookingRecord> getRecentRecords();

    /**
     * Get records for a specific customer
     * @param customerId The customer ID
     * @param pageable Pagination information
     * @return Page of booking records
     */
    Page<BookingRecord> getRecordsByCustomer(Long customerId, Pageable pageable);

    /**
     * Search records by description
     * @param keyword The search keyword
     * @param pageable Pagination information
     * @return Page of booking records
     */
    Page<BookingRecord> searchRecordsByDescription(String keyword, Pageable pageable);

    /**
     * Get audit trail summary for a booking
     * @param bookingId The booking ID
     * @return Map of action types to counts
     */
    Map<TypeAction, Long> getAuditSummary(Long bookingId);

    /**
     * Get statistics for booking actions
     * @return Map of action types to counts
     */
    Map<TypeAction, Long> getActionStatistics();

    /**
     * Get system-generated records
     * @param pageable Pagination information
     * @return Page of system-generated records
     */
    Page<BookingRecord> getSystemGeneratedRecords(Pageable pageable);

    /**
     * Get user-generated records
     * @param pageable Pagination information
     * @return Page of user-generated records
     */
    Page<BookingRecord> getUserGeneratedRecords(Pageable pageable);

    /**
     * Count records for a specific booking
     * @param bookingId The booking ID
     * @return Number of records
     */
    Long countRecordsForBooking(Long bookingId);

    /**
     * Delete old records (for cleanup)
     * @param beforeDate Delete records created before this date
     * @return Number of records deleted
     */
    Long deleteOldRecords(LocalDateTime beforeDate);

    /**
     * Export records to CSV format
     * @param startDate Start date
     * @param endDate End date
     * @return CSV content as string
     */
    String exportRecordsToCsv(LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Create a booking record with automatic JSON serialization of previous/current values
     * @param booking The booking this record relates to
     * @param action The action that was performed
     * @param performedBy The account that performed the action
     * @param description Description of what happened
     * @param previousValues Object to be serialized as JSON for previous values
     * @param currentValues Object to be serialized as JSON for current values
     * @return The created booking record
     */
    BookingRecord createRecordWithValues(Booking booking, TypeAction action, Account performedBy, 
                                       String description, Object previousValues, Object currentValues);
}
