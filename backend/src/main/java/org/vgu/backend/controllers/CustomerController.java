package org.vgu.backend.controllers;

import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.dto.request.CustomerUpdateRequest;
import org.vgu.backend.dto.response.CustomerResponse;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.repository.BookingRepository;
import org.vgu.backend.repository.CustomerRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.customer.ICustomerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final ICustomerService customerService;
    private final CustomerRepository customerRepository;
    private final BookingRepository bookingRepository;
    private final IAccountService accountService;
    private final Logger logger = LoggerFactory.getLogger(CustomerController.class);

    // Create a new customer (saved in database and Keycloak)
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> createCustomer(@Valid @RequestBody CustomerCreateRequest request) {
        try {
            logger.info("Creating customer: {}", request);
            CustomerResponse customer = customerService.createCustomer(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(customer);
        } catch (RuntimeException e) {
            logger.error("Error creating customer: {}", e.getMessage(), e);
            if (e.getMessage() != null && e.getMessage().contains("User already exists")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating customer: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred while creating the customer."));
        }
    }

    // Get all customers with pagination
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_PLANNER')")
    public ResponseEntity<Page<CustomerResponse>> getAllCustomers(
            @RequestParam(defaultValue = "", required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Getting all customers");
        Pageable pageable = PageRequest.of(page, limit, Sort.by("id").ascending());
        Page<CustomerResponse> customerPage = customerService.listAllCustomers(keyword, pageable);
        logger.info("Customers listed successfully");
        return ResponseEntity.ok(customerPage);
    }

    // Get customer by ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_PLANNER')")
    public ResponseEntity<?> getCustomerById(@PathVariable Long id) {
        try {
            logger.info("Getting customer by id: {}", id);
            CustomerResponse customer = customerService.getCustomerById(id);
            return ResponseEntity.ok(customer);
        } catch (DataNotFoundException e) {
            logger.error("Customer not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    // Update customer by ID
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> updateCustomer(@PathVariable Long id, @Valid @RequestBody CustomerUpdateRequest request) {
        try {
            logger.info("Updating customer: {}", id);
            CustomerResponse customer = customerService.updateCustomer(id, request);
            return ResponseEntity.ok(customer);
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating customer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Delete customer by ID
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        try {
            logger.info("Deleting customer: {}", id);
            customerService.deleteCustomer(id);
            return ResponseEntity.noContent().build();
        } catch (DataNotFoundException e) {
            logger.error("Customer not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error deleting customer {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    // Get customer statistics
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_OPERATION_MANAGER')")
    public ResponseEntity<Map<String, Object>> getCustomerStats() {
        try {
            logger.info("Getting customer statistics");
            Map<String, Object> stats = Map.of(
                    "totalCustomers", customerRepository.countAllCustomers(),
                    "activeCustomers", customerRepository.countActiveCustomers(),
                    "newThisMonth", customerRepository.countNewCustomersThisMonth(LocalDateTime.now().minusMonths(1)),
                    "totalBookings", bookingRepository.countAllBookings());

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.error("Error getting customer statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to retrieve customer statistics"));
        }
    }

    // Get my current customer profile
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> getMyCustomer(Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid authentication"));
            }
            String keycloakId = jwt.getClaimAsString("sub");
            var accountOpt = accountService.getAccountByKeycloakId(keycloakId);
            if (accountOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Account not found"));
            }
            var customerOpt = customerRepository.findByAccountId(accountOpt.get().getId());
            return customerOpt.<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(Map.of("error", "Customer profile not found")));
        } catch (Exception e) {
            logger.error("Error getting my customer profile: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }
}