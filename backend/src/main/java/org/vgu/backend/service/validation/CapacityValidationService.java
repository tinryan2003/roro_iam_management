package org.vgu.backend.service.validation;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.vgu.backend.exception.BusinessException;
import org.vgu.backend.model.Ferry;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.repository.FerryRepository;

import lombok.RequiredArgsConstructor;

/**
 * Service for validating ferry capacity constraints
 * Ensures bookings don't exceed ferry vehicle and passenger limits
 */
@Service
@RequiredArgsConstructor
public class CapacityValidationService {

    private final BookingRepository bookingRepository;
    private final FerryRepository ferryRepository;
    private final Logger logger = LoggerFactory.getLogger(CapacityValidationService.class);

    /**
     * Validates if ferry has enough vehicle capacity for the booking
     * 
     * @param ferryId            Ferry ID to check
     * @param departureDate      Date of departure
     * @param additionalVehicles Number of additional vehicles to book (default 1)
     * @throws BusinessException if capacity exceeded
     */
    public void validateVehicleCapacity(Long ferryId, LocalDateTime departureTime, int additionalVehicles) {
        logger.debug("Validating vehicle capacity for ferry {} on {}", ferryId, departureTime.toLocalDate());

        Ferry ferry = ferryRepository.findById(ferryId)
                .orElseThrow(() -> new BusinessException("Ferry not found: " + ferryId, "FERRY_NOT_FOUND"));

        // Count current vehicle bookings for this ferry on this date
        int currentVehicleBookings = bookingRepository.countVehicleBookingsByFerryAndDate(
                ferryId, departureTime.toLocalDate());

        int totalVehiclesAfterBooking = currentVehicleBookings + additionalVehicles;

        logger.debug("Ferry {} - Current vehicles: {}, Capacity: {}, Requested: {}, Total after: {}",
                ferryId, currentVehicleBookings, ferry.getCapacityVehicles(),
                additionalVehicles, totalVehiclesAfterBooking);

        if (totalVehiclesAfterBooking > ferry.getCapacityVehicles()) {
            String message = String.format(
                    "Ferry capacity exceeded. Ferry '%s' can carry %d vehicles, " +
                            "currently has %d bookings, cannot add %d more vehicles",
                    ferry.getFerryName(), ferry.getCapacityVehicles(),
                    currentVehicleBookings, additionalVehicles);
            logger.warn(message);
            throw new BusinessException(message, "VEHICLE_CAPACITY_EXCEEDED");
        }

        logger.debug("Vehicle capacity validation passed for ferry {}", ferryId);
    }

    /**
     * Validates if ferry has enough passenger capacity for the booking
     * 
     * @param ferryId              Ferry ID to check
     * @param departureDate        Date of departure
     * @param additionalPassengers Number of additional passengers to book
     * @throws BusinessException if capacity exceeded
     */
    public void validatePassengerCapacity(Long ferryId, LocalDateTime departureTime, int additionalPassengers) {
        logger.debug("Validating passenger capacity for ferry {} on {}", ferryId, departureTime.toLocalDate());

        Ferry ferry = ferryRepository.findById(ferryId)
                .orElseThrow(() -> new BusinessException("Ferry not found: " + ferryId, "FERRY_NOT_FOUND"));

        // Sum current passenger count for this ferry on this date
        int currentPassengerCount = bookingRepository.sumPassengersByFerryAndDate(
                ferryId, departureTime.toLocalDate());

        int totalPassengersAfterBooking = currentPassengerCount + additionalPassengers;

        logger.debug("Ferry {} - Current passengers: {}, Capacity: {}, Requested: {}, Total after: {}",
                ferryId, currentPassengerCount, ferry.getCapacityPassengers(),
                additionalPassengers, totalPassengersAfterBooking);

        if (totalPassengersAfterBooking > ferry.getCapacityPassengers()) {
            String message = String.format(
                    "Ferry passenger capacity exceeded. Ferry '%s' can carry %d passengers, " +
                            "currently has %d bookings, cannot add %d more passengers",
                    ferry.getFerryName(), ferry.getCapacityPassengers(),
                    currentPassengerCount, additionalPassengers);
            logger.warn(message);
            throw new BusinessException(message, "PASSENGER_CAPACITY_EXCEEDED");
        }

        logger.debug("Passenger capacity validation passed for ferry {}", ferryId);
    }

    /**
     * Comprehensive capacity validation for both vehicles and passengers
     * 
     * @param ferryId              Ferry ID to check
     * @param departureTime        Departure date and time
     * @param additionalVehicles   Number of vehicles to add (0 if no vehicle)
     * @param additionalPassengers Number of passengers to add
     * @throws BusinessException if any capacity exceeded
     */
    public void validateCapacity(Long ferryId, LocalDateTime departureTime,
            int additionalVehicles, int additionalPassengers) {
        logger.info("Validating full capacity for ferry {} on {} - vehicles: {}, passengers: {}",
                ferryId, departureTime.toLocalDate(), additionalVehicles, additionalPassengers);

        // Validate vehicle capacity (only if booking includes vehicle)
        if (additionalVehicles > 0) {
            validateVehicleCapacity(ferryId, departureTime, additionalVehicles);
        }

        // Validate passenger capacity
        if (additionalPassengers > 0) {
            validatePassengerCapacity(ferryId, departureTime, additionalPassengers);
        }

        logger.info("All capacity validations passed for ferry {}", ferryId);
    }

    /**
     * Get current capacity utilization for a ferry on a specific date
     * 
     * @param ferryId Ferry ID
     * @param date    Date to check
     * @return CapacityInfo with current utilization
     */
    public CapacityInfo getCapacityInfo(Long ferryId, LocalDate date) {
        Ferry ferry = ferryRepository.findById(ferryId)
                .orElseThrow(() -> new BusinessException("Ferry not found: " + ferryId, "FERRY_NOT_FOUND"));

        int currentVehicles = bookingRepository.countVehicleBookingsByFerryAndDate(ferryId, date);
        int currentPassengers = bookingRepository.sumPassengersByFerryAndDate(ferryId, date);

        return CapacityInfo.builder()
                .ferryId(ferryId)
                .ferryName(ferry.getFerryName())
                .date(date)
                .currentVehicles(currentVehicles)
                .maxVehicles(ferry.getCapacityVehicles())
                .currentPassengers(currentPassengers)
                .maxPassengers(ferry.getCapacityPassengers())
                .vehicleUtilizationPercent((double) currentVehicles / ferry.getCapacityVehicles() * 100)
                .passengerUtilizationPercent((double) currentPassengers / ferry.getCapacityPassengers() * 100)
                .build();
    }

    /**
     * Inner class to represent capacity information
     */
    @lombok.Data
    @lombok.Builder
    public static class CapacityInfo {
        private Long ferryId;
        private String ferryName;
        private LocalDate date;
        private int currentVehicles;
        private int maxVehicles;
        private int currentPassengers;
        private int maxPassengers;
        private double vehicleUtilizationPercent;
        private double passengerUtilizationPercent;

        public boolean isVehicleCapacityAvailable(int requestedVehicles) {
            return (currentVehicles + requestedVehicles) <= maxVehicles;
        }

        public boolean isPassengerCapacityAvailable(int requestedPassengers) {
            return (currentPassengers + requestedPassengers) <= maxPassengers;
        }
    }
}
