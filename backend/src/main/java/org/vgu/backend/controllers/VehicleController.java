package org.vgu.backend.controllers;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.VehicleCreateRequest;
import org.vgu.backend.dto.request.VehicleUpdateRequest;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Customer;
import org.vgu.backend.model.Vehicle;
import org.vgu.backend.repository.CustomerRepository;
import org.vgu.backend.repository.VehicleRepository;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final CustomerRepository customerRepository;

    @GetMapping("/by-customer/{customerId}")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER','ROLE_ADMIN','ROLE_OPERATOR','ROLE_OPERATION_MANAGER','ROLE_PLANNER','ROLE_ACCOUNTANT')")
    public ResponseEntity<List<org.vgu.backend.dto.response.VehicleResponse>> getVehiclesByCustomer(
            @PathVariable Long customerId) {
        List<Vehicle> vehicles = vehicleRepository.findByCustomerId(customerId);
        List<org.vgu.backend.dto.response.VehicleResponse> result = vehicles.stream()
                .map(v -> org.vgu.backend.dto.response.VehicleResponse.builder()
                        .id(v.getId())
                        .vehicleType(v.getVehicleType() != null ? v.getVehicleType().toString() : null)
                        .make(v.getMake())
                        .model(v.getModel())
                        .quantity(v.getQuantity())
                        .isActive(v.getIsActive())
                        .createdAt(v.getCreatedAt())
                        .customerId(v.getCustomer() != null ? v.getCustomer().getId() : null)
                        .customerName(v.getCustomer() != null && v.getCustomer().getAccount() != null
                                ? v.getCustomer().getAccount().getUsername()
                                : null)
                        .bookingId(v.getBooking() != null ? v.getBooking().getId() : null)
                        .bookingCode(v.getBooking() != null ? v.getBooking().getBookingCode() : null)
                        .price(v.getVehicleType() != null ? v.getVehicleType().getPrice() : null)
                        .build())
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/by-customer/{customerId}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<org.vgu.backend.dto.response.VehicleResponse> createVehicle(@PathVariable Long customerId,
            @Valid @RequestBody VehicleCreateRequest req) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new DataNotFoundException("Customer not found with ID: " + customerId));
        Vehicle created = vehicleRepository.save(Vehicle.builder()
                .customer(customer)
                .vehicleType(req.getVehicleType())
                .make(req.getMake())
                .model(req.getModel())
                .quantity(req.getQuantity() != null ? req.getQuantity() : 1)
                .isActive(true)
                .build());
        org.vgu.backend.dto.response.VehicleResponse dto = org.vgu.backend.dto.response.VehicleResponse.builder()
                .id(created.getId())
                .vehicleType(created.getVehicleType() != null ? created.getVehicleType().toString() : null)
                .make(created.getMake())
                .model(created.getModel())
                .quantity(created.getQuantity())
                .isActive(created.getIsActive())
                .createdAt(created.getCreatedAt())
                .customerId(customer.getId())
                .customerName(customer.getAccount() != null ? customer.getAccount().getUsername() : null)
                .bookingId(created.getBooking() != null ? created.getBooking().getId() : null)
                .bookingCode(created.getBooking() != null ? created.getBooking().getBookingCode() : null)
                .price(created.getVehicleType() != null ? created.getVehicleType().getPrice() : null)
                .build();
        return ResponseEntity.created(URI.create("/api/vehicles/" + created.getId())).body(dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<org.vgu.backend.dto.response.VehicleResponse> updateVehicle(@PathVariable Long id,
            @RequestBody VehicleUpdateRequest req) {
        Vehicle v = vehicleRepository.findById(id)
                .orElseThrow(() -> new DataNotFoundException("Vehicle not found with ID: " + id));
        if (req.getVehicleType() != null)
            v.setVehicleType(req.getVehicleType());
        if (req.getMake() != null)
            v.setMake(req.getMake());
        if (req.getModel() != null)
            v.setModel(req.getModel());
        if (req.getQuantity() != null)
            v.setQuantity(req.getQuantity());
        if (req.getIsActive() != null)
            v.setIsActive(req.getIsActive());
        Vehicle saved = vehicleRepository.save(v);
        org.vgu.backend.dto.response.VehicleResponse dto = org.vgu.backend.dto.response.VehicleResponse.builder()
                .id(saved.getId())
                .vehicleType(saved.getVehicleType() != null ? saved.getVehicleType().toString() : null)
                .make(saved.getMake())
                .model(saved.getModel())
                .quantity(saved.getQuantity())
                .isActive(saved.getIsActive())
                .createdAt(saved.getCreatedAt())
                .customerId(saved.getCustomer() != null ? saved.getCustomer().getId() : null)
                .customerName(saved.getCustomer() != null && saved.getCustomer().getAccount() != null
                        ? saved.getCustomer().getAccount().getUsername()
                        : null)
                .bookingId(saved.getBooking() != null ? saved.getBooking().getId() : null)
                .bookingCode(saved.getBooking() != null ? saved.getBooking().getBookingCode() : null)
                .price(saved.getVehicleType() != null ? saved.getVehicleType().getPrice() : null)
                .build();
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> deleteVehicle(@PathVariable Long id) {
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
