package org.vgu.backend.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.enums.BookingStatus;
import org.vgu.backend.model.Booking;

@Repository

public interface BookingRepository extends JpaRepository<Booking, Long> {

        // Corrected to match the entity's field name "bookingCode".
        Optional<Booking> findByBookingCode(String bookingCode);

        /**
         * Find booking by ID with eagerly fetched relationships to prevent lazy loading
         * issues
         */
        @Query("SELECT b FROM Booking b " +
                        "LEFT JOIN FETCH b.customer c " +
                        "LEFT JOIN FETCH c.account " +
                        "LEFT JOIN FETCH b.schedule s " +
                        "LEFT JOIN FETCH s.route " +
                        "LEFT JOIN FETCH s.ferry " +
                        "LEFT JOIN FETCH b.vehicles " +
                        "LEFT JOIN FETCH b.approval " +
                        "WHERE b.id = :id")
        Optional<Booking> findByIdWithDetails(@Param("id") Long id);

        @Modifying(clearAutomatically = true, flushAutomatically = true)
        @Transactional
        void deleteByBookingCode(String bookingCode);

        @Query("select b from Booking b where b.customer.account.id = :accountId")
        Page<Booking> findByAccountId(@Param("accountId") Long accountId, Pageable pageable);

        @Query("select b from Booking b where b.customer.account.id = :accountId order by b.createdAt desc")
        Page<Booking> findByCustomerAccountId(@Param("accountId") Long accountId, Pageable pageable);

        List<Booking> findByStatus(BookingStatus status);

        @Query("SELECT b FROM Booking b WHERE b.schedule.departureTime BETWEEN :start AND :end")
        List<Booking> findByDepartureTimeBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

        @Query("SELECT COUNT(b) FROM Booking b")
        Long countAllBookings();

        // Capacity validation queries for ferry management

        /**
         * Count vehicle bookings for a specific ferry on a specific date
         * Only counts bookings that have vehicles and are not cancelled
         */
        @Query(value = """
                                SELECT COALESCE(SUM(v.quantity), 0)
                                FROM bookings b
                                JOIN vehicles v ON v.booking_id = b.id
                                JOIN schedules s ON s.id = b.schedule_id
                                WHERE s.ferry_id = :ferryId
                                AND DATE(s.departure_time) = :departureDate
                                AND b.status <> 'CANCELLED'
                        """, nativeQuery = true)
        int countVehicleBookingsByFerryAndDate(@Param("ferryId") Long ferryId,
                        @Param("departureDate") LocalDate departureDate);

        /**
         * Sum total passengers for a specific ferry on a specific date
         * Only counts bookings that are not cancelled
         */
        @Query(value = """
                                SELECT COALESCE(SUM(b.passenger_count), 0)
                                FROM bookings b
                                JOIN schedules s ON s.id = b.schedule_id
                                WHERE s.ferry_id = :ferryId
                                AND DATE(s.departure_time) = :departureDate
                                AND b.status <> 'CANCELLED'
                        """, nativeQuery = true)
        int sumPassengersByFerryAndDate(@Param("ferryId") Long ferryId,
                        @Param("departureDate") LocalDate departureDate);

        /**
         * Find all active bookings for a ferry on a specific date
         * Useful for detailed capacity analysis
         */
        @Query(value = """
                                SELECT
                                        b.id,
                                        b.booking_code,
                                        b.customer_id,
                                        b.schedule_id,
                                        b.passenger_count,
                                        b.total_amount,
                                        b.status,
                                        b.note,
                                        b.created_at,
                                        b.updated_at,
                                        b.cancelled_at,
                                        b.cancelled_by,
                                        b.cancellation_reason,
                                        b.confirmed_arrival_at,
                                        b.confirmed_arrival_by,
                                        b.completed_at
                                FROM bookings b
                                JOIN schedules s ON s.id = b.schedule_id
                                WHERE s.ferry_id = :ferryId
                                AND DATE(s.departure_time) = :departureDate
                                AND b.status NOT IN ('CANCELLED', 'COMPLETED')
                        """, nativeQuery = true)
        List<Booking> findActiveBookingsByFerryAndDate(@Param("ferryId") Long ferryId,
                        @Param("departureDate") LocalDate departureDate);

        /**
         * Check if ferry is available for new bookings on a specific date
         * Returns true if ferry has available capacity
         */
        @Query(value = """
                                SELECT CASE WHEN (
                                        SELECT COALESCE(SUM(v.quantity), 0)
                                        FROM bookings b
                                        JOIN vehicles v ON v.booking_id = b.id
                                        JOIN schedules s ON s.id = b.schedule_id
                                        WHERE s.ferry_id = :ferryId
                                        AND DATE(s.departure_time) = :departureDate
                                        AND b.status <> 'CANCELLED'
                                ) < f.capacity_vehicles THEN TRUE ELSE FALSE END AS available
                                FROM ferries f
                                WHERE f.id = :ferryId
                        """, nativeQuery = true)
        boolean isVehicleCapacityAvailable(@Param("ferryId") Long ferryId,
                        @Param("departureDate") LocalDate departureDate);

        // Workflow-specific queries

        /**
         * Find bookings by status with pagination
         */
        Page<Booking> findByStatusOrderByCreatedAtAsc(BookingStatus status, Pageable pageable);

        /**
         * Find bookings by customer account ID and status
         */
        Page<Booking> findByCustomer_Account_IdAndStatus(Long accountId, BookingStatus status, Pageable pageable);

        /**
         * Find bookings requiring approval
         */
        @Query(value = """
                                SELECT
                                        b.id,
                                        b.booking_code,
                                        b.customer_id,
                                        b.schedule_id,
                                        b.passenger_count,
                                        b.total_amount,
                                        b.status,
                                        b.note,
                                        b.created_at,
                                        b.updated_at,
                                        b.cancelled_at,
                                        b.cancelled_by,
                                        b.cancellation_reason,
                                        b.confirmed_arrival_at,
                                        b.confirmed_arrival_by,
                                        b.completed_at
                                FROM bookings b
                                WHERE b.status = 'PENDING'
                                ORDER BY b.created_at ASC
                        """, nativeQuery = true)
        List<Booking> findPendingApprovalBookings();

        /**
         * Find bookings in refund process
         */
        @Query(value = """
                                SELECT *
                                FROM bookings b
                                WHERE b.status = 'IN_REFUND'
                                ORDER BY b.created_at ASC
                        """, nativeQuery = true)
        List<Booking> findRefundRequestBookings();

        /**
         * Find bookings with pending refund requests for accountant review
         */
        @Query("SELECT b FROM Booking b WHERE b.refundRequested = true AND b.refundProcessedAt IS NULL ORDER BY b.refundRequestedAt ASC")
        List<Booking> findPendingRefundRequests();

        /**
         * Find bookings with pending refund requests for a specific customer
         */
        @Query("SELECT b FROM Booking b WHERE b.customer.id = :customerId AND b.refundRequested = true AND b.refundProcessedAt IS NULL ORDER BY b.refundRequestedAt ASC")
        List<Booking> findPendingRefundRequestsByCustomer(@Param("customerId") Long customerId);

        /**
         * Count bookings by status
         */
        Long countByStatus(BookingStatus status);

        /**
         * Find bookings by multiple statuses
         */
        @Query("SELECT b FROM Booking b WHERE b.status IN :statuses ORDER BY b.createdAt DESC")
        List<Booking> findByStatusIn(@Param("statuses") List<BookingStatus> statuses);

        /**
         * Find confirmed bookings that need planner notification
         */
        @Query(value = """
                        SELECT b.*
                        FROM bookings b
                        WHERE b.status IN ('CONFIRMED', 'PAID')
                        ORDER BY b.created_at ASC
                        """, nativeQuery = true)
        List<Booking> findBookingsForPlannerNotification();

        boolean existsByBookingCode(String bookingCode);

        boolean existsByIdAndCustomerId(Long id, Long customerId);

        boolean existsByBookingCodeAndCustomerId(String bookingCode, Long customerId);

        @Override
        boolean existsById(@NonNull Long id);

}