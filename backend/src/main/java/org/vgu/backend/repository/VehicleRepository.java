package org.vgu.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.vgu.backend.enums.VehicleType;
import org.vgu.backend.model.Vehicle;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {

    // This relationship correctly points to Customer.
    List<Vehicle> findByCustomerId(Long customerId);

    List<Vehicle> findByVehicleType(VehicleType vehicleType);

    /**
     * Find vehicles by booking ID
     */
    List<Vehicle> findByBookingId(Long bookingId);

    /**
     * Find vehicles that are not attached to any booking
     */
    List<Vehicle> findByBookingIdIsNull();

    /**
     * Find vehicles by customer ID that are not attached to any booking
     */
    List<Vehicle> findByCustomerIdAndBookingIdIsNull(Long customerId);

    /**
     * Check if vehicle is attached to any booking
     */
    boolean existsByBookingIdIsNotNullAndId(Long vehicleId);
}