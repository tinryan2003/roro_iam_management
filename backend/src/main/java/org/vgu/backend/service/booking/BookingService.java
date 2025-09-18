package org.vgu.backend.service.booking;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.BookingCreateRequest;
import org.vgu.backend.enums.BookingStatus;
import org.vgu.backend.enums.TypeAction;
import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.exception.BusinessException;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Approval;
import org.vgu.backend.model.Booking;
import org.vgu.backend.model.Customer;
import org.vgu.backend.model.Schedule;
import org.vgu.backend.model.Vehicle;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.repository.CustomerRepository;
import org.vgu.backend.repository.EmployeeRepository;
import org.vgu.backend.repository.ScheduleRepository;
import org.vgu.backend.repository.VehicleRepository;
import org.vgu.backend.service.ApprovalService;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.bookingrecord.IBookingRecordService;
import org.vgu.backend.service.notification.NotificationService;
import org.vgu.backend.service.validation.CapacityValidationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BookingService implements IBookingService {

    private final BookingRepository bookingRepository;
    private final CustomerRepository customerRepository;
    private final ScheduleRepository scheduleRepository;
    private final VehicleRepository vehicleRepository;
    private final CapacityValidationService capacityValidationService;
    private final ApprovalService approvalService;
    private final IBookingRecordService bookingRecordService;
    private final IAccountService accountService;
    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;
    private final Logger logger = LoggerFactory.getLogger(BookingService.class);

    @Override
    @Transactional
    public Booking createBooking(BookingCreateRequest request) throws Exception {
        logger.info("Creating booking via service: {}", request);

        // Validate customer
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new DataNotFoundException("Customer not found: " + request.getCustomerId()));

        // Validate schedule
        Schedule schedule = scheduleRepository.findById(request.getScheduleId())
                .orElseThrow(() -> new DataNotFoundException("Schedule not found: " + request.getScheduleId()));

        // Validate vehicle if provided (can be single vehicleId or multiple vehicleIds)
        List<Vehicle> vehicles = new ArrayList<>();
        if (request.getVehicleId() != null) {
            Vehicle vehicle = vehicleRepository.findById(request.getVehicleId())
                    .orElseThrow(() -> new DataNotFoundException("Vehicle not found: " + request.getVehicleId()));
            // Assign to booking after it's created, but validate here
            vehicles.add(vehicle);
        }

        if (request.getVehicleIds() != null && !request.getVehicleIds().isEmpty()) {
            for (Long vehicleId : request.getVehicleIds()) {
                Vehicle vehicle = vehicleRepository.findById(vehicleId)
                        .orElseThrow(() -> new DataNotFoundException("Vehicle not found: " + vehicleId));
                // Add more validation here if needed, e.g., vehicle belongs to customer, is not
                // already booked
                vehicles.add(vehicle);
            }
        }

        BigDecimal totalAmount = request.getTotalAmount() != null
                ? request.getTotalAmount()
                : schedule.getRoute().getPrice(); // Use route price as base

        // No longer adding vehicle prices here, totalAmount is now passed from frontend
        // The frontend is responsible for calculating totalAmount including vehicle
        // prices.
        // We still need to validate that the passed totalAmount is reasonable.
        // This can be done by recalculating total here and comparing.

        // For now, assume frontend sends correct totalAmount.

        // ===== SCHEDULE VALIDATION =====
        if (!schedule.isBookingOpen()) {
            throw new BusinessException("Booking is closed for this schedule", "BOOKING_CLOSED");
        }

        // Determine number of vehicles and passengers for validation
        int vehiclesToAdd = vehicles.stream().mapToInt(Vehicle::getQuantity).sum();
        int passengersToAdd = Objects.requireNonNullElse(request.getPassengerCount(), 1);

        // Check schedule capacity
        if (!schedule.hasCapacityFor(vehiclesToAdd, passengersToAdd)) {
            throw new BusinessException("Insufficient capacity on this schedule", "INSUFFICIENT_CAPACITY");
        }

        logger.info(
                "Schedule capacity validation passed - Schedule: {}, Route: {}, Ferry: {}, Passengers: {}, Vehicles: {}",
                schedule.getId(),
                schedule.getRoute().getRouteName(),
                schedule.getFerry().getFerryName(),
                passengersToAdd,
                vehiclesToAdd);

        // Generate booking code if not provided
        String bookingCode = request.getBookingCode();
        if (bookingCode == null || bookingCode.isBlank()) {
            bookingCode = generateUniqueBookingCode();
        }

        // Create booking
        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .customer(customer)
                .schedule(schedule)
                // Do not set single vehicle here, will set list after booking save
                .passengerCount(passengersToAdd)
                .totalAmount(totalAmount)
                .status(BookingStatus.PENDING)
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        // Create approval for the booking (SRP - separate approval workflow)
        try {
            Approval approval = approvalService.createApproval(savedBooking);
            savedBooking.setApproval(approval);
            logger.info("Approval created for booking: {}", savedBooking.getBookingCode());
        } catch (Exception e) {
            logger.error("Failed to create approval for booking {}: {}",
                    savedBooking.getBookingCode(), e.getMessage());
            // Don't fail the whole booking creation, but log the error
        }

        // Associate vehicles with the saved booking and save them
        for (Vehicle vehicle : vehicles) {
            vehicle.setBooking(savedBooking);
            vehicleRepository.save(vehicle);
        }
        savedBooking.setVehicles(vehicles);

        // Update schedule capacity
        schedule.reduceCapacity(vehiclesToAdd, passengersToAdd);
        scheduleRepository.save(schedule);

        logger.info("Booking created successfully: {} for schedule: {}",
                savedBooking.getBookingCode(), schedule.getId());

        // Record the booking creation activity
        try {
            Account currentUser = getCurrentUser();
            String description = String.format("Booking created for %d passengers%s on %s to %s",
                    savedBooking.getPassengerCount(),
                    !vehicles.isEmpty() ? " with vehicle(s) " +
                            vehicles.stream().map(v -> v.getVehicleType().getDisplayName())
                                    .collect(Collectors.joining(", "))
                            : "",
                    schedule.getRoute().getDeparturePort().getPortName(),
                    schedule.getRoute().getArrivalPort().getPortName());

            bookingRecordService.createRecordWithValues(
                    savedBooking,
                    TypeAction.BOOKING_CREATED,
                    currentUser,
                    description,
                    null, // No previous values for creation
                    buildBookingSnapshot(savedBooking));
        } catch (Exception e) {
            logger.warn("Failed to record booking creation activity for {}: {}",
                    savedBooking.getBookingCode(), e.getMessage());
        }

        // Create internal notifications
        try {
            // Notify customer of booking creation
            notificationService.notifyCustomerOfBookingCreation(
                    savedBooking.getCustomer().getId().toString(),
                    savedBooking.getBookingCode());

            // Notify accountants of new booking requiring approval
            List<String> accountantIds = employeeRepository.findByPositionAndIsActiveTrue(TypePosition.ACCOUNTANT)
                    .stream()
                    .map(employee -> employee.getAccount().getId().toString())
                    .collect(Collectors.toList());

            if (!accountantIds.isEmpty()) {
                notificationService.notifyAccountantsOfNewBooking(accountantIds, savedBooking.getBookingCode());
            }

            logger.info("Notification sent for booking creation: {}", savedBooking.getBookingCode());
        } catch (Exception e) {
            logger.warn("Failed to send notifications for booking {}: {}",
                    savedBooking.getBookingCode(), e.getMessage());
            // Don't fail the booking creation if notifications fail
        }

        return savedBooking;
    }

    private String generateUniqueBookingCode() {
        String code;
        int attempts = 0;
        do {
            code = "BK" + System.currentTimeMillis() % 100000000 + randomAlphaNumeric(4);
            attempts++;
        } while (bookingRepository.existsByBookingCode(code) && attempts < 10);
        return code;
    }

    private String randomAlphaNumeric(int count) {
        final String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder(count);
        java.util.concurrent.ThreadLocalRandom rnd = java.util.concurrent.ThreadLocalRandom.current();
        for (int i = 0; i < count; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    @Override
    public Booking getBookingById(String bookingId) {
        logger.debug("Fetching booking with ID: {}", bookingId);

        // Try to parse as Long ID first
        try {
            Long id = Long.valueOf(bookingId);
            return bookingRepository.findById(id)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found with id: " + bookingId));
        } catch (NumberFormatException e) {
            // If not a valid Long, try to find by booking code
            return bookingRepository.findByBookingCode(bookingId)
                    .orElseThrow(() -> new DataNotFoundException("Booking not found with code: " + bookingId));
        }
    }

    @Override
    public void deleteBookingById(String bookingId) {
        logger.info("Deleting booking with ID: {}", bookingId);
        Booking booking = getBookingById(bookingId);

        // Restore schedule capacity
        Schedule schedule = booking.getSchedule();
        // Only restore capacity if vehicles were actually associated
        if (!booking.getVehicles().isEmpty()) {
            int vehiclesToRemove = booking.getVehicles().stream().mapToInt(Vehicle::getQuantity).sum();
            schedule.increaseCapacity(vehiclesToRemove, booking.getPassengerCount());
            scheduleRepository.save(schedule);
        } else {
            // If no vehicles, still restore passenger capacity
            schedule.increaseCapacity(0, booking.getPassengerCount());
            scheduleRepository.save(schedule);
        }
        bookingRepository.delete(booking);
        logger.info("Booking deleted successfully: {}", bookingId);
    }

    @Override
    public boolean existsBookingById(String bookingId) {
        try {
            return bookingRepository.existsById(Long.valueOf(bookingId));
        } catch (NumberFormatException e) {
            return bookingRepository.existsByBookingCode(bookingId);
        }
    }

    @Override
    public boolean existsBookingByBookingIdAndCustomerId(String bookingId, Long customerId) {
        try {
            Long id = Long.valueOf(bookingId);
            return bookingRepository.existsByIdAndCustomerId(id, customerId);
        } catch (NumberFormatException e) {
            return bookingRepository.existsByBookingCodeAndCustomerId(bookingId, customerId);
        }
    }

    @Override
    public CapacityValidationService.CapacityInfo getFerryCapacityInfo(Long ferryId, LocalDate date) {
        return capacityValidationService.getCapacityInfo(ferryId, date);
    }

    @Override
    public Optional<Account> getAccountByKeycloakId(String keycloakId) {
        return accountService.getAccountByKeycloakId(keycloakId);
    }

    private Account getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
            String keycloakId = jwt.getClaimAsString("sub");
            return accountService.getAccountByKeycloakId(keycloakId)
                    .orElseThrow(() -> new DataNotFoundException("Account not found for keycloak ID: " + keycloakId));
        }
        throw new IllegalStateException("User not authenticated");
    }

    private String buildBookingSnapshot(Booking booking) {
        // Simplified snapshot for now
        return String.format(
                "{\"id\":%d, \"bookingCode\":\"%s\", \"status\":\"%s\", \"totalAmount\":%s, \"passengerCount\":%d, \"vehicleCount\":%d}",
                booking.getId(),
                booking.getBookingCode(),
                booking.getStatus().toString(),
                booking.getTotalAmount(),
                booking.getPassengerCount(),
                booking.getVehicles().size() // Get count from the list
        );
    }
}
