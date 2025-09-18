package org.vgu.backend.controllers;

import java.time.LocalDate;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.service.validation.CapacityValidationService;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for ferry capacity management and checking
 * Provides endpoints to check real-time ferry capacity utilization
 */
@RestController
@RequestMapping("${api.prefix}/capacity")
@RequiredArgsConstructor
public class CapacityController {

    private final CapacityValidationService capacityValidationService;
    private final Logger logger = LoggerFactory.getLogger(CapacityController.class);

    /**
     * Get detailed capacity information for a specific ferry on a specific date
     * 
     * @param ferryId Ferry ID to check
     * @param date    Date in YYYY-MM-DD format
     * @return CapacityInfo with current utilization and availability
     */
    @GetMapping("/ferry/{ferryId}")
    public ResponseEntity<?> getFerryCapacity(
            @PathVariable Long ferryId,
            @RequestParam String date) {
        try {
            logger.info("Getting capacity info for ferry {} on date {}", ferryId, date);

            LocalDate requestDate = LocalDate.parse(date);
            CapacityValidationService.CapacityInfo capacityInfo = capacityValidationService.getCapacityInfo(ferryId,
                    requestDate);

            logger.info("Capacity info retrieved successfully for ferry {}", ferryId);
            return ResponseEntity.ok(capacityInfo);

        } catch (IllegalArgumentException e) {
            logger.error("Invalid date format: {}", date);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid date format. Use YYYY-MM-DD"));
        } catch (Exception e) {
            logger.error("Error getting ferry capacity: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get capacity info: " + e.getMessage()));
        }
    }

    /**
     * Check if specific capacity is available for booking
     * 
     * @param ferryId    Ferry ID to check
     * @param date       Date in YYYY-MM-DD format
     * @param vehicles   Number of vehicles to check availability for
     * @param passengers Number of passengers to check availability for
     * @return Availability status and remaining capacity
     */
    @GetMapping("/ferry/{ferryId}/check")
    public ResponseEntity<?> checkCapacityAvailability(
            @PathVariable Long ferryId,
            @RequestParam String date,
            @RequestParam(defaultValue = "0") int vehicles,
            @RequestParam(defaultValue = "1") int passengers) {
        try {
            logger.info("Checking capacity availability for ferry {} on {} - vehicles: {}, passengers: {}",
                    ferryId, date, vehicles, passengers);

            LocalDate requestDate = LocalDate.parse(date);
            CapacityValidationService.CapacityInfo capacityInfo = capacityValidationService.getCapacityInfo(ferryId,
                    requestDate);

            boolean vehicleAvailable = capacityInfo.isVehicleCapacityAvailable(vehicles);
            boolean passengerAvailable = capacityInfo.isPassengerCapacityAvailable(passengers);
            boolean overallAvailable = vehicleAvailable && passengerAvailable;

            Map<String, Object> result = Map.of(
                    "available", overallAvailable,
                    "vehicleAvailable", vehicleAvailable,
                    "passengerAvailable", passengerAvailable,
                    "remainingVehicleSlots", capacityInfo.getMaxVehicles() - capacityInfo.getCurrentVehicles(),
                    "remainingPassengerSlots", capacityInfo.getMaxPassengers() - capacityInfo.getCurrentPassengers(),
                    "requestedVehicles", vehicles,
                    "requestedPassengers", passengers,
                    "capacityInfo", capacityInfo);

            logger.info("Capacity check completed - available: {}", overallAvailable);
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            logger.error("Invalid date format: {}", date);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid date format. Use YYYY-MM-DD"));
        } catch (Exception e) {
            logger.error("Error checking capacity availability: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to check availability: " + e.getMessage()));
        }
    }
}
