package org.vgu.backend.controllers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.ScheduleCreateRequest;
import org.vgu.backend.dto.request.ScheduleUpdateRequest;
import org.vgu.backend.dto.response.ScheduleResponse;
import org.vgu.backend.enums.ScheduleStatus;
import org.vgu.backend.model.Ferry;
import org.vgu.backend.model.Route;
import org.vgu.backend.model.Schedule;
import org.vgu.backend.repository.FerryRepository;
import org.vgu.backend.repository.RouteRepository;
import org.vgu.backend.repository.ScheduleRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/schedules")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ScheduleController {

        private final ScheduleRepository scheduleRepository;
        private final RouteRepository routeRepository;
        private final FerryRepository ferryRepository;
        private final Logger logger = LoggerFactory.getLogger(ScheduleController.class);

        /**
         * Get all schedules with pagination
         */
        @GetMapping
        public ResponseEntity<Map<String, Object>> getAllSchedules(
                        @RequestParam(defaultValue = "0") int page,
                        @RequestParam(defaultValue = "10") int limit,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) String sortBy,
                        @RequestParam(defaultValue = "asc") String sortDirection,
                        @RequestParam(defaultValue = "false") boolean upcomingOnly,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {

                logger.info("Getting schedules - page: {}, limit: {}, status: {}, upcomingOnly: {}, fromDate: {}, toDate: {}",
                                page, limit, status, upcomingOnly, fromDate, toDate);

                // Default sort by departureTime ascending for better timeline view
                Sort sort = Sort.by(Sort.Direction.fromString(sortDirection),
                                sortBy != null ? sortBy : "departureTime");
                Pageable pageable = PageRequest.of(page, limit, sort);

                Page<Schedule> schedulePage;
                LocalDateTime now = LocalDateTime.now();

                try {
                        if (upcomingOnly) {
                                // Show only upcoming schedules (from current time to future)
                                LocalDateTime fromTime = fromDate != null ? fromDate : now;
                                if (status != null && !status.isEmpty()) {
                                        ScheduleStatus statusEnum = ScheduleStatus.valueOf(status.toUpperCase());
                                        if (toDate != null) {
                                                schedulePage = scheduleRepository.findSchedulesByDateRangeAndStatus(
                                                                fromTime, toDate, statusEnum, pageable);
                                        } else {
                                                schedulePage = scheduleRepository.findUpcomingSchedulesByStatus(
                                                                fromTime, statusEnum, pageable);
                                        }
                                } else {
                                        if (toDate != null) {
                                                schedulePage = scheduleRepository.findSchedulesByDateRange(fromTime,
                                                                toDate, pageable);
                                        } else {
                                                schedulePage = scheduleRepository.findUpcomingSchedules(fromTime,
                                                                pageable);
                                        }
                                }
                        } else if (fromDate != null || toDate != null) {
                                // Date range query
                                LocalDateTime startTime = fromDate != null ? fromDate
                                                : LocalDateTime.of(1900, 1, 1, 0, 0);
                                LocalDateTime endTime = toDate != null ? toDate
                                                : LocalDateTime.of(2100, 12, 31, 23, 59);

                                if (status != null && !status.isEmpty()) {
                                        ScheduleStatus statusEnum = ScheduleStatus.valueOf(status.toUpperCase());
                                        schedulePage = scheduleRepository.findSchedulesByDateRangeAndStatus(startTime,
                                                        endTime, statusEnum, pageable);
                                } else {
                                        schedulePage = scheduleRepository.findSchedulesByDateRange(startTime, endTime,
                                                        pageable);
                                }
                        } else {
                                // Default behavior - all schedules with optional status filter
                                if (status != null && !status.isEmpty()) {
                                        ScheduleStatus statusEnum = ScheduleStatus.valueOf(status.toUpperCase());
                                        schedulePage = scheduleRepository.findByStatusWithFerryAndRoute(statusEnum,
                                                        pageable);
                                } else {
                                        schedulePage = scheduleRepository.findAllWithFerryAndRoute(pageable);
                                }
                        }
                } catch (IllegalArgumentException e) {
                        logger.warn("Invalid status provided: {}", status);
                        // Fallback to all schedules if status is invalid
                        schedulePage = scheduleRepository.findAllWithFerryAndRoute(pageable);
                }

                List<ScheduleResponse> scheduleResponses = schedulePage.getContent().stream()
                                .map(this::convertToResponse)
                                .toList();

                Map<String, Object> response = Map.of(
                                "content", scheduleResponses,
                                "totalElements", schedulePage.getTotalElements(),
                                "totalPages", schedulePage.getTotalPages(),
                                "size", schedulePage.getSize(),
                                "number", schedulePage.getNumber());

                return ResponseEntity.ok(response);
        }

        /**
         * Create a new schedule
         */
        @PostMapping
        public ResponseEntity<ScheduleResponse> createSchedule(@RequestBody ScheduleCreateRequest request) {
                logger.info("Creating new schedule: {}", request);

                try {
                        // Validate route and ferry exist
                        Route route = routeRepository.findById(request.getRouteId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Route not found with id: " + request.getRouteId()));

                        Ferry ferry = ferryRepository.findById(request.getFerryId())
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Ferry not found with id: " + request.getFerryId()));

                        // Create new schedule
                        Schedule schedule = Schedule.builder()
                                        .route(route)
                                        .ferry(ferry)
                                        .departureTime(request.getDepartureTime())
                                        .arrivalTime(request.getArrivalTime())
                                        .availablePassengerSpaces(request.getAvailablePassengerSpaces())
                                        .availableVehicleSpaces(request.getAvailableVehicleSpaces())
                                        .bookingDeadline(request.getBookingDeadline())
                                        .checkInStartTime(request.getCheckInStartTime())
                                        .checkInEndTime(request.getCheckInEndTime())
                                        .status(ScheduleStatus.valueOf(request.getStatus().toUpperCase()))
                                        .notes(request.getNotes())
                                        .build();

                        Schedule savedSchedule = scheduleRepository.save(schedule);
                        logger.info("Schedule created successfully with ID: {}", savedSchedule.getId());

                        return ResponseEntity.status(HttpStatus.CREATED).body(convertToResponse(savedSchedule));
                } catch (Exception e) {
                        logger.error("Error creating schedule", e);
                        throw new RuntimeException("Failed to create schedule: " + e.getMessage());
                }
        }

        /**
         * Update an existing schedule
         */
        @PutMapping("/{scheduleId}")
        public ResponseEntity<ScheduleResponse> updateSchedule(
                        @PathVariable Long scheduleId,
                        @RequestBody ScheduleUpdateRequest request) {
                logger.info("Updating schedule ID: {} with data: {}", scheduleId, request);

                try {
                        Schedule existingSchedule = scheduleRepository.findById(scheduleId)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Schedule not found with id: " + scheduleId));

                        // Update route if changed
                        if (request.getRouteId() != null
                                        && !request.getRouteId().equals(existingSchedule.getRoute().getId())) {
                                Route route = routeRepository.findById(request.getRouteId())
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Route not found with id: " + request.getRouteId()));
                                existingSchedule.setRoute(route);
                        }

                        // Update ferry if changed
                        if (request.getFerryId() != null
                                        && !request.getFerryId().equals(existingSchedule.getFerry().getId())) {
                                Ferry ferry = ferryRepository.findById(request.getFerryId())
                                                .orElseThrow(() -> new RuntimeException(
                                                                "Ferry not found with id: " + request.getFerryId()));
                                existingSchedule.setFerry(ferry);
                        }

                        // Update other fields
                        if (request.getDepartureTime() != null) {
                                existingSchedule.setDepartureTime(request.getDepartureTime());
                        }
                        if (request.getArrivalTime() != null) {
                                existingSchedule.setArrivalTime(request.getArrivalTime());
                        }
                        if (request.getAvailablePassengerSpaces() != null) {
                                existingSchedule.setAvailablePassengerSpaces(request.getAvailablePassengerSpaces());
                        }
                        if (request.getAvailableVehicleSpaces() != null) {
                                existingSchedule.setAvailableVehicleSpaces(request.getAvailableVehicleSpaces());
                        }
                        if (request.getBookingDeadline() != null) {
                                existingSchedule.setBookingDeadline(request.getBookingDeadline());
                        }
                        if (request.getCheckInStartTime() != null) {
                                existingSchedule.setCheckInStartTime(request.getCheckInStartTime());
                        }
                        if (request.getCheckInEndTime() != null) {
                                existingSchedule.setCheckInEndTime(request.getCheckInEndTime());
                        }
                        if (request.getStatus() != null) {
                                existingSchedule.setStatus(ScheduleStatus.valueOf(request.getStatus().toUpperCase()));
                        }
                        if (request.getNotes() != null) {
                                existingSchedule.setNotes(request.getNotes());
                        }

                        Schedule updatedSchedule = scheduleRepository.save(existingSchedule);
                        logger.info("Schedule updated successfully: {}", updatedSchedule.getId());

                        return ResponseEntity.ok(convertToResponse(updatedSchedule));
                } catch (Exception e) {
                        logger.error("Error updating schedule", e);
                        throw new RuntimeException("Failed to update schedule: " + e.getMessage());
                }
        }

        /**
         * Delete a schedule
         */
        @DeleteMapping("/{scheduleId}")
        public ResponseEntity<Map<String, String>> deleteSchedule(@PathVariable Long scheduleId) {
                logger.info("Deleting schedule ID: {}", scheduleId);

                try {
                        Schedule schedule = scheduleRepository.findById(scheduleId)
                                        .orElseThrow(() -> new RuntimeException(
                                                        "Schedule not found with id: " + scheduleId));

                        // Check if schedule has bookings - you might want to add this logic
                        // if (hasBookings(scheduleId)) {
                        // throw new RuntimeException("Cannot delete schedule with existing bookings");
                        // }

                        scheduleRepository.delete(schedule);
                        logger.info("Schedule deleted successfully: {}", scheduleId);

                        return ResponseEntity.ok(Map.of("message", "Schedule deleted successfully"));
                } catch (Exception e) {
                        logger.error("Error deleting schedule", e);
                        throw new RuntimeException("Failed to delete schedule: " + e.getMessage());
                }
        }

        /**
         * Get available schedules for a specific route
         */
        @GetMapping("/route/{routeId}")
        public ResponseEntity<List<ScheduleResponse>> getSchedulesByRoute(
                        @PathVariable Long routeId,
                        @RequestParam(defaultValue = "SCHEDULED") ScheduleStatus status,
                        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate) {

                logger.info("Getting schedules for route: {}, status: {}, fromDate: {}", routeId, status, fromDate);

                LocalDateTime fromTime = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.now();

                List<Schedule> schedules = scheduleRepository.findAvailableSchedules(
                                routeId, status, fromTime, LocalDateTime.now());

                List<ScheduleResponse> responses = schedules.stream()
                                .map(this::convertToResponse)
                                .toList();

                return ResponseEntity.ok(responses);
        }

        /**
         * Get schedule by ID
         */
        @GetMapping("/{scheduleId}")
        public ResponseEntity<ScheduleResponse> getScheduleById(@PathVariable Long scheduleId) {
                logger.info("Getting schedule by ID: {}", scheduleId);

                return scheduleRepository.findById(scheduleId)
                                .map(this::convertToResponse)
                                .map(ResponseEntity::ok)
                                .orElse(ResponseEntity.notFound().build());
        }

        /**
         * Get upcoming departures from a specific port
         */
        @GetMapping("/port/{portId}/departures")
        public ResponseEntity<List<ScheduleResponse>> getUpcomingDepartures(
                        @PathVariable Long portId,
                        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate,
                        @RequestParam(defaultValue = "7") int days) {

                logger.info("Getting upcoming departures for port: {}, fromDate: {}, days: {}", portId, fromDate, days);

                LocalDateTime fromTime = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.now();
                List<ScheduleStatus> activeStatuses = List.of(ScheduleStatus.SCHEDULED, ScheduleStatus.BOARDING);

                List<Schedule> schedules = scheduleRepository.findUpcomingDeparturesByPort(
                                portId, fromTime, activeStatuses);

                List<ScheduleResponse> responses = schedules.stream()
                                .filter(s -> s.getDepartureTime().isBefore(fromTime.plusDays(days)))
                                .map(this::convertToResponse)
                                .toList();

                return ResponseEntity.ok(responses);
        }

        /**
         * Check capacity for a specific schedule
         */
        @GetMapping("/{scheduleId}/capacity")
        public ResponseEntity<Map<String, Object>> getScheduleCapacity(@PathVariable Long scheduleId) {
                logger.info("Getting capacity for schedule: {}", scheduleId);

                return scheduleRepository.findById(scheduleId)
                                .map(schedule -> {
                                        Map<String, Object> capacity = Map.of(
                                                        "scheduleId", schedule.getId(),
                                                        "totalVehicleCapacity",
                                                        schedule.getFerry().getCapacityVehicles(),
                                                        "totalPassengerCapacity",
                                                        schedule.getFerry().getCapacityPassengers(),
                                                        "availableVehicleSpaces", schedule.getAvailableVehicleSpaces(),
                                                        "availablePassengerSpaces",
                                                        schedule.getAvailablePassengerSpaces(),
                                                        "isBookingOpen", schedule.isBookingOpen(),
                                                        "bookingDeadline", schedule.getBookingDeadline());
                                        return ResponseEntity.ok(capacity);
                                })
                                .orElse(ResponseEntity.notFound().build());
        }

        /**
         * Search schedules with filters
         */
        @GetMapping("/search")
        public ResponseEntity<List<ScheduleResponse>> searchSchedules(
                        @RequestParam(required = false) Long departurePortId,
                        @RequestParam(required = false) Long arrivalPortId,
                        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate departureDate,
                        @RequestParam(defaultValue = "SCHEDULED") ScheduleStatus status) {

                logger.info("Searching schedules - departure: {}, arrival: {}, date: {}, status: {}",
                                departurePortId, arrivalPortId, departureDate, status);

                // This is a simplified search - you can enhance it based on your needs
                List<Schedule> schedules;

                if (departureDate != null) {
                        LocalDateTime startOfDay = departureDate.atStartOfDay();
                        LocalDateTime endOfDay = departureDate.atTime(23, 59, 59);

                        schedules = scheduleRepository.findAll().stream()
                                        .filter(s -> s.getStatus() == status)
                                        .filter(s -> s.getDepartureTime().isAfter(startOfDay)
                                                        && s.getDepartureTime().isBefore(endOfDay))
                                        .filter(s -> departurePortId == null
                                                        || s.getRoute().getDeparturePort().getId()
                                                                        .equals(departurePortId))
                                        .filter(s -> arrivalPortId == null
                                                        || s.getRoute().getArrivalPort().getId().equals(arrivalPortId))
                                        .toList();
                } else {
                        schedules = scheduleRepository.findAll().stream()
                                        .filter(s -> s.getStatus() == status)
                                        .filter(s -> s.getDepartureTime().isAfter(LocalDateTime.now()))
                                        .filter(s -> departurePortId == null
                                                        || s.getRoute().getDeparturePort().getId()
                                                                        .equals(departurePortId))
                                        .filter(s -> arrivalPortId == null
                                                        || s.getRoute().getArrivalPort().getId().equals(arrivalPortId))
                                        .limit(50) // Limit results
                                        .toList();
                }

                List<ScheduleResponse> responses = schedules.stream()
                                .map(this::convertToResponse)
                                .toList();

                return ResponseEntity.ok(responses);
        }

        /**
         * Convert Schedule entity to ScheduleResponse DTO
         */
        private ScheduleResponse convertToResponse(Schedule schedule) {
                return ScheduleResponse.builder()
                                .id(schedule.getId())
                                .routeId(schedule.getRoute().getId())
                                .routeName(schedule.getRoute().getRouteName())
                                .ferryId(schedule.getFerry().getId())
                                .ferryName(schedule.getFerry().getFerryName())
                                .ferryCode(schedule.getFerry().getFerryCode())
                                .departurePortName(schedule.getRoute().getDeparturePort().getPortName())
                                .arrivalPortName(schedule.getRoute().getArrivalPort().getPortName())
                                .departureTime(schedule.getDepartureTime())
                                .arrivalTime(schedule.getArrivalTime())
                                .status(schedule.getStatus())
                                .availableVehicleSpaces(schedule.getAvailableVehicleSpaces())
                                .availablePassengerSpaces(schedule.getAvailablePassengerSpaces())
                                .basePrice(schedule.getRoute().getPrice())
                                .bookingDeadline(schedule.getBookingDeadline())
                                .checkInStartTime(schedule.getCheckInStartTime())
                                .checkInEndTime(schedule.getCheckInEndTime())
                                .isBookingOpen(schedule.isBookingOpen())
                                .build();
        }

        /**
         * Public endpoint to get all available schedules
         */
        @GetMapping("/public/schedules")
        public ResponseEntity<List<ScheduleResponse>> getPublicSchedules(
                        @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fromDate,
                        @RequestParam(required = false) Long routeId) {

                logger.info("Getting public schedules - fromDate: {}, routeId: {}", fromDate, routeId);

                LocalDateTime fromTime = fromDate != null ? fromDate.atStartOfDay() : LocalDateTime.now();

                List<Schedule> schedules;
                if (routeId != null) {
                        schedules = scheduleRepository.findAvailableSchedules(
                                        routeId, ScheduleStatus.SCHEDULED, fromTime, LocalDateTime.now());
                } else {
                        // Get all available schedules from all routes
                        schedules = scheduleRepository.findAll().stream()
                                        .filter(s -> s.getStatus() == ScheduleStatus.SCHEDULED)
                                        .filter(s -> s.getDepartureTime().isAfter(fromTime))
                                        .filter(s -> s.getBookingDeadline() == null
                                                        || s.getBookingDeadline().isAfter(LocalDateTime.now()))
                                        .sorted((s1, s2) -> s1.getDepartureTime().compareTo(s2.getDepartureTime()))
                                        .toList();
                }

                List<ScheduleResponse> responses = schedules.stream()
                                .map(this::convertToResponse)
                                .toList();

                return ResponseEntity.ok(responses);
        }
}
