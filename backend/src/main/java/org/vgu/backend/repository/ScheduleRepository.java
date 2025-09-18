package org.vgu.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.ScheduleStatus;
import org.vgu.backend.model.Schedule;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

        // Find schedules by status with pagination and fetch ferry/route
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort WHERE s.status = :status")
        Page<Schedule> findByStatusWithFerryAndRoute(ScheduleStatus status, Pageable pageable);

        // Find all schedules with ferry and route data
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort")
        Page<Schedule> findAllWithFerryAndRoute(Pageable pageable);

        // Find schedules by status with pagination (original method for compatibility)
        Page<Schedule> findByStatus(ScheduleStatus status, Pageable pageable);

        // Find schedules by route
        List<Schedule> findByRouteIdAndStatusOrderByDepartureTime(Long routeId, ScheduleStatus status);

        // Find available schedules for booking
        @Query("SELECT s FROM Schedule s WHERE s.route.id = :routeId " +
                        "AND s.status = :status " +
                        "AND s.departureTime > :fromTime " +
                        "AND (s.bookingDeadline IS NULL OR s.bookingDeadline > :now) " +
                        "ORDER BY s.departureTime")
        List<Schedule> findAvailableSchedules(@Param("routeId") Long routeId,
                        @Param("status") ScheduleStatus status,
                        @Param("fromTime") LocalDateTime fromTime,
                        @Param("now") LocalDateTime now);

        // Find schedules by ferry
        List<Schedule> findByFerryIdAndDepartureTimeBetweenOrderByDepartureTime(
                        Long ferryId, LocalDateTime startTime, LocalDateTime endTime);

        // Find schedules with capacity
        @Query("SELECT s FROM Schedule s WHERE s.id = :scheduleId " +
                        "AND (s.availableVehicleSpaces IS NULL OR s.availableVehicleSpaces >= :vehicles) " +
                        "AND (s.availablePassengerSpaces IS NULL OR s.availablePassengerSpaces >= :passengers)")
        Optional<Schedule> findScheduleWithCapacity(@Param("scheduleId") Long scheduleId,
                        @Param("vehicles") int vehicles,
                        @Param("passengers") int passengers);

        // Find upcoming departures by port
        @Query("SELECT s FROM Schedule s WHERE s.route.departurePort.id = :portId " +
                        "AND s.departureTime > :fromTime " +
                        "AND s.status IN :statuses " +
                        "ORDER BY s.departureTime")
        List<Schedule> findUpcomingDeparturesByPort(@Param("portId") Long portId,
                        @Param("fromTime") LocalDateTime fromTime,
                        @Param("statuses") List<ScheduleStatus> statuses);

        // Check for schedule conflicts (same ferry at same time)
        @Query("SELECT COUNT(s) > 0 FROM Schedule s WHERE s.ferry.id = :ferryId " +
                        "AND s.id != :excludeId " +
                        "AND s.status != 'CANCELLED' " +
                        "AND ((s.departureTime <= :departureTime AND s.arrivalTime > :departureTime) " +
                        "OR (s.departureTime < :arrivalTime AND s.arrivalTime >= :arrivalTime) " +
                        "OR (s.departureTime >= :departureTime AND s.arrivalTime <= :arrivalTime))")
        boolean hasScheduleConflict(@Param("ferryId") Long ferryId,
                        @Param("departureTime") LocalDateTime departureTime,
                        @Param("arrivalTime") LocalDateTime arrivalTime,
                        @Param("excludeId") Long excludeId);

        // Find schedules from current time to future (excluding past schedules)
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort WHERE s.departureTime >= :fromTime ORDER BY s.departureTime ASC")
        Page<Schedule> findUpcomingSchedules(@Param("fromTime") LocalDateTime fromTime, Pageable pageable);

        // Find schedules from current time to future with status filter
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort WHERE s.departureTime >= :fromTime AND s.status = :status ORDER BY s.departureTime ASC")
        Page<Schedule> findUpcomingSchedulesByStatus(@Param("fromTime") LocalDateTime fromTime,
                        @Param("status") ScheduleStatus status, Pageable pageable);

        // Find all schedules within date range
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort WHERE s.departureTime >= :fromTime AND s.departureTime <= :toTime ORDER BY s.departureTime ASC")
        Page<Schedule> findSchedulesByDateRange(@Param("fromTime") LocalDateTime fromTime,
                        @Param("toTime") LocalDateTime toTime, Pageable pageable);

        // Find schedules within date range with status filter
        @Query("SELECT s FROM Schedule s JOIN FETCH s.ferry JOIN FETCH s.route r JOIN FETCH r.departurePort JOIN FETCH r.arrivalPort WHERE s.departureTime >= :fromTime AND s.departureTime <= :toTime "
                        +
                        "AND s.status = :status ORDER BY s.departureTime ASC")
        Page<Schedule> findSchedulesByDateRangeAndStatus(@Param("fromTime") LocalDateTime fromTime,
                        @Param("toTime") LocalDateTime toTime, @Param("status") ScheduleStatus status,
                        Pageable pageable);
}
