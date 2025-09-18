package org.vgu.backend.service.booking;

import java.time.LocalDate;
import java.util.Optional;

import org.vgu.backend.dto.request.BookingCreateRequest;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Booking;
import org.vgu.backend.service.validation.CapacityValidationService;

public interface IBookingService {
    Booking createBooking(BookingCreateRequest request) throws Exception;

    Booking getBookingById(String bookingId);

    void deleteBookingById(String bookingId);

    boolean existsBookingById(String bookingId);

    boolean existsBookingByBookingIdAndCustomerId(String bookingId, Long customerId);

    /**
     * Get ferry capacity information for a specific date
     * 
     * @param ferryId Ferry ID to check
     * @param date    Date to check capacity for
     * @return CapacityInfo with current utilization details
     */
    CapacityValidationService.CapacityInfo getFerryCapacityInfo(Long ferryId, LocalDate date);

    /**
     * Get account by Keycloak ID for booking record purposes
     * 
     * @param keycloakId The Keycloak ID
     * @return Optional Account if found
     */
    Optional<Account> getAccountByKeycloakId(String keycloakId);
}
