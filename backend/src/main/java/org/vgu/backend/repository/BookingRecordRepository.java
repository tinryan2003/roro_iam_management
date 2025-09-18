package org.vgu.backend.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.model.BookingRecord;

@Repository
public interface BookingRecordRepository extends JpaRepository<BookingRecord, Long> {

    /**
     * Find all records for a specific booking
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.booking.id = :bookingId ORDER BY br.createdAt DESC")
    List<BookingRecord> findByBookingIdOrderByCreatedAtDesc(@Param("bookingId") Long bookingId);

    /**
     * Find all records for a specific booking with pagination
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.booking.id = :bookingId ORDER BY br.createdAt DESC")
    Page<BookingRecord> findByBookingId(@Param("bookingId") Long bookingId, Pageable pageable);

    /**
     * Find records by booking code
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.booking.bookingCode = :bookingCode ORDER BY br.createdAt DESC")
    List<BookingRecord> findByBookingCode(@Param("bookingCode") String bookingCode);

    /**
     * Find records by action type
     */
    List<BookingRecord> findByActionOrderByCreatedAtDesc(TypeAction action);

    /**
     * Find records by performer (account who performed the action)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.performedBy.id = :accountId ORDER BY br.createdAt DESC")
    Page<BookingRecord> findByPerformedByAccountId(@Param("accountId") Long accountId, Pageable pageable);

    /**
     * Find records within a date range
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.createdAt BETWEEN :startDate AND :endDate ORDER BY br.createdAt DESC")
    Page<BookingRecord> findByCreatedAtBetween(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Find records by action and date range
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.action = :action AND br.createdAt BETWEEN :startDate AND :endDate ORDER BY br.createdAt DESC")
    List<BookingRecord> findByActionAndCreatedAtBetween(@Param("action") TypeAction action,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find recent records (last 24 hours)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.createdAt >= :since ORDER BY br.createdAt DESC")
    List<BookingRecord> findRecentRecords(@Param("since") LocalDateTime since);

    /**
     * Count records by action type
     */
    @Query("SELECT COUNT(br) FROM BookingRecord br WHERE br.action = :action")
    Long countByAction(@Param("action") TypeAction action);

    /**
     * Count records for a specific booking
     */
    @Query("SELECT COUNT(br) FROM BookingRecord br WHERE br.booking.id = :bookingId")
    Long countByBookingId(@Param("bookingId") Long bookingId);

    /**
     * Find records by customer ID (through booking relationship)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.booking.customer.id = :customerId ORDER BY br.createdAt DESC")
    Page<BookingRecord> findByCustomerId(@Param("customerId") Long customerId, Pageable pageable);

    /**
     * Find all booking creation records within date range
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.action = 'BOOKING_CREATED' AND br.createdAt BETWEEN :startDate AND :endDate ORDER BY br.createdAt DESC")
    List<BookingRecord> findBookingCreationsInPeriod(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find all booking cancellation records within date range
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.action = 'BOOKING_CANCELLED' AND br.createdAt BETWEEN :startDate AND :endDate ORDER BY br.createdAt DESC")
    List<BookingRecord> findBookingCancellationsInPeriod(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find system-generated records (where performedBy is null)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.performedBy IS NULL ORDER BY br.createdAt DESC")
    Page<BookingRecord> findSystemGeneratedRecords(Pageable pageable);

    /**
     * Find user-generated records (where performedBy is not null)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.performedBy IS NOT NULL ORDER BY br.createdAt DESC")
    Page<BookingRecord> findUserGeneratedRecords(Pageable pageable);

    /**
     * Search records by description containing keyword
     */
    @Query("SELECT br FROM BookingRecord br WHERE LOWER(br.description) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY br.createdAt DESC")
    Page<BookingRecord> findByDescriptionContaining(@Param("keyword") String keyword, Pageable pageable);

    /**
     * Get audit trail summary for a booking
     */
    @Query("SELECT br.action, COUNT(br) FROM BookingRecord br WHERE br.booking.id = :bookingId GROUP BY br.action")
    List<Object[]> getAuditSummaryForBooking(@Param("bookingId") Long bookingId);

    /**
     * Find records with additional data (for debugging purposes)
     */
    @Query("SELECT br FROM BookingRecord br WHERE br.additionalData IS NOT NULL ORDER BY br.createdAt DESC")
    Page<BookingRecord> findRecordsWithAdditionalData(Pageable pageable);
}
