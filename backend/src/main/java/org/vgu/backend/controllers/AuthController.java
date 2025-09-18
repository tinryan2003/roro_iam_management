package org.vgu.backend.controllers;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.AccountUpdateRequest;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.dto.response.AccountResponse;
import org.vgu.backend.dto.response.CustomerResponse;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Customer;
import org.vgu.backend.repository.CustomerRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.service.customer.ICustomerService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/auth")
@RequiredArgsConstructor
public class AuthController {

    private final IAccountService accountService;
    private final ICustomerService customerService;
    private final CustomerRepository customerRepository;
    private final Logger logger = LoggerFactory.getLogger(AuthController.class);

    /**
     * Get current user profile information
     * Extracts user from JWT token and returns account details
     */
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER', 'ROLE_PLANNER', 'ROLE_ACCOUNTANT', 'ROLE_CUSTOMER')")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract user identifier from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            String firstName = jwt.getClaimAsString("given_name");
            String lastName = jwt.getClaimAsString("family_name");

            logger.info("Getting profile for user: {}", username);

            // Try to find account by Keycloak ID first
            Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

            Account account;
            if (accountOpt.isPresent()) {
                account = accountOpt.get();
            } else {
                // If account doesn't exist in our database, create a minimal response from JWT
                // claims
                account = Account.builder()
                        .keycloakId(keycloakId)
                        .username(username)
                        .email(email)
                        .firstName(firstName)
                        .lastName(lastName)
                        .isActive(true)
                        .build();

                logger.info("Account not found in database for keycloakId: {}, returning JWT claims", keycloakId);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "User profile retrieved successfully",
                    "user", AccountResponse.fromAccount(account),
                    "token", jwt.getTokenValue()));

        } catch (Exception e) {
            logger.error("Error retrieving user profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to retrieve user profile"));
        }
    }

    /**
     * Get current employee profile information
     * Retrieves profile for authenticated employees
     */
    @GetMapping("/employee/me")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER', 'ROLE_PLANNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> getCurrentEmployee(Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract user identifier from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");

            logger.info("Getting employee profile for user: {}", username);

            // Find account by Keycloak ID
            Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

            Account account;
            if (accountOpt.isPresent()) {
                account = accountOpt.get();
            } else {
                // If account doesn't exist in our database, create a minimal response from JWT
                // claims
                account = Account.builder()
                        .keycloakId(keycloakId)
                        .username(username)
                        .email(jwt.getClaimAsString("email"))
                        .firstName(jwt.getClaimAsString("given_name"))
                        .lastName(jwt.getClaimAsString("family_name"))
                        .isActive(true)
                        .build();

                logger.info("Account not found in database for keycloakId: {}, returning JWT claims", keycloakId);
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Employee profile retrieved successfully",
                    "user", AccountResponse.fromAccount(account),
                    "token", jwt.getTokenValue()));

        } catch (Exception e) {
            logger.error("Error retrieving employee profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to retrieve employee profile"));
        }
    }

    /**
     * Update current user profile information
     * Allows users to update their own profile data
     */
    @PutMapping("/employee/me")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_OPERATION_MANAGER', 'ROLE_PLANNER', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> updateCurrentEmployeeUser(
            Authentication authentication,
            @Valid @RequestBody Map<String, String> updateRequest) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract user identifier from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");

            logger.info("Updating profile for user: {}", username);

            // Find account by Keycloak ID, create if doesn't exist
            Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

            Account account;
            if (accountOpt.isEmpty()) {
                // Create local account record for existing Keycloak user
                logger.info("Creating local account for Keycloak user: {}", username);
                try {
                    // Handle missing or malformed date_of_birth claim
                    String dateOfBirthStr = jwt.getClaimAsString("date_of_birth");
                    LocalDate dateOfBirth = null;
                    if (dateOfBirthStr != null && !dateOfBirthStr.isEmpty()) {
                        try {
                            dateOfBirth = LocalDate.parse(dateOfBirthStr);
                        } catch (Exception e) {
                            logger.warn("Could not parse date_of_birth from token: {}", dateOfBirthStr);
                        }
                    }

                    account = accountService.createAccountFromKeycloak(
                            keycloakId,
                            AccountCreateRequest.builder()
                                    .username(username)
                                    .email(jwt.getClaimAsString("email"))
                                    .firstName(jwt.getClaimAsString("given_name"))
                                    .lastName(jwt.getClaimAsString("family_name"))
                                    .phoneNumber(jwt.getClaimAsString("phone_number"))
                                    .dateOfBirth(dateOfBirth)
                                    .address(jwt.getClaimAsString("address"))
                                    .city(jwt.getClaimAsString("city"))
                                    .country(jwt.getClaimAsString("country"))
                                    .postalCode(parsePostalCode(jwt.getClaimAsString("postal_code")))
                                    .build());

                    logger.info("Local account created for Keycloak user: {}", username);
                } catch (Exception e) {
                    logger.error("Failed to create local account for user {}: {}", username, e.getMessage());
                    return ResponseEntity.badRequest().body(Map.of("error", "Failed to create local account"));
                }
            } else {
                account = accountOpt.get();
            }

            // Update account fields if provided
            if (updateRequest.containsKey("firstName")) {
                account.setFirstName(updateRequest.get("firstName"));
            }
            if (updateRequest.containsKey("lastName")) {
                account.setLastName(updateRequest.get("lastName"));
            }
            if (updateRequest.containsKey("email")) {
                account.setEmail(updateRequest.get("email"));
            }
            if (updateRequest.containsKey("phone")) {
                account.setPhoneNumber(updateRequest.get("phone"));
            }

            // Create update request for service
            AccountUpdateRequest serviceRequest = AccountUpdateRequest
                    .builder()
                    .firstName(account.getFirstName())
                    .lastName(account.getLastName())
                    .phoneNumber(account.getPhoneNumber())
                    .build();

            Account updatedAccount = accountService.updateUser(account.getId(), serviceRequest);

            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "user", AccountResponse.fromAccount(updatedAccount)));

        } catch (Exception e) {
            logger.error("Error updating user profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * Get current customer profile information
     * Retrieves profile for authenticated customers including customer-specific
     * data
     */
    @GetMapping("/customer/me")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> getCurrentCustomer(Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract user identifier from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");

            logger.info("Getting customer profile for user: {}", username);

            // Find account by Keycloak ID
            Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

            Account account;
            Customer customer = null;

            if (accountOpt.isPresent()) {
                account = accountOpt.get();
                // Try to get customer data if account exists
                customer = customerService.getCustomerByAccountId(account.getId());
            } else {
                // If account doesn't exist in our database, create a minimal response from JWT
                // claims
                account = Account.builder()
                        .keycloakId(keycloakId)
                        .username(username)
                        .email(jwt.getClaimAsString("email"))
                        .firstName(jwt.getClaimAsString("given_name"))
                        .lastName(jwt.getClaimAsString("family_name"))
                        .isActive(true)
                        .build();

                logger.info("Account not found in database for keycloakId: {}, returning JWT claims", keycloakId);
            }

            // Build response with customer data if available
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Customer profile retrieved successfully");
            response.put("user", AccountResponse.fromAccount(account));

            if (customer != null) {
                Map<String, Object> customerData = new HashMap<>();
                customerData.put("id", customer.getId());
                customerData.put("firstName", customer.getAccount().getFirstName());
                customerData.put("lastName", customer.getAccount().getLastName());
                customerData.put("email", customer.getAccount().getEmail());
                customerData.put("phone", customer.getAccount().getPhoneNumber());
                customerData.put("dateOfBirth", customer.getAccount().getDateOfBirth());
                customerData.put("address", customer.getAccount().getAddress());
                customerData.put("city", customer.getAccount().getCity());
                customerData.put("country", customer.getAccount().getCountry());
                customerData.put("postalCode", customer.getAccount().getPostalCode());
                customerData.put("companyName", customer.getCompanyName());
                response.put("customer", customerData);
            } else {
                response.put("customer", null);
            }

            response.put("token", jwt.getTokenValue());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error retrieving customer profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to retrieve customer profile"));
        }
    }

    @PutMapping("/customer/me")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> updateCurrentCustomer(
            Authentication authentication,
            @Valid @RequestBody Map<String, String> updateRequest) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract user identifier from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");

            logger.info("Updating profile for user: {}", username);

            // Find account by Keycloak ID, create if doesn't exist
            Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);

            Account account;
            if (accountOpt.isEmpty()) {
                // Create local account record for existing Keycloak user
                logger.info("Creating local account for Keycloak user: {}", username);
                try {
                    // Handle missing or malformed date_of_birth claim
                    String dateOfBirthStr = jwt.getClaimAsString("date_of_birth");
                    LocalDate dateOfBirth = null;
                    if (dateOfBirthStr != null && !dateOfBirthStr.isEmpty()) {
                        try {
                            dateOfBirth = LocalDate.parse(dateOfBirthStr);
                        } catch (Exception e) {
                            logger.warn("Could not parse date_of_birth from token: {}", dateOfBirthStr);
                        }
                    }

                    Customer customer = customerService.createCustomerFromKeycloak(
                            keycloakId,
                            CustomerCreateRequest.builder()
                                    .username(username)
                                    .email(jwt.getClaimAsString("email"))
                                    .firstName(jwt.getClaimAsString("given_name"))
                                    .lastName(jwt.getClaimAsString("family_name"))
                                    .phoneNumber(jwt.getClaimAsString("phone_number"))
                                    .dateOfBirth(dateOfBirth)
                                    .password("keycloak-managed") // Not used for Keycloak users
                                    .address("To be provided")
                                    .city("To be provided")
                                    .country("To be provided")
                                    .build());
                    account = customer.getAccount();

                    logger.info("Local account created for Keycloak user: {}", username);
                } catch (Exception e) {
                    logger.error("Failed to create local account for user {}: {}", username, e.getMessage());
                    return ResponseEntity.badRequest().body(Map.of("error", "Failed to create local account"));
                }
            } else {
                account = accountOpt.get();
            }

            // Update account fields if provided
            if (updateRequest.containsKey("firstName")) {
                account.setFirstName(updateRequest.get("firstName"));
            }
            if (updateRequest.containsKey("lastName")) {
                account.setLastName(updateRequest.get("lastName"));
            }
            if (updateRequest.containsKey("email")) {
                account.setEmail(updateRequest.get("email"));
            }
            if (updateRequest.containsKey("phone")) {
                account.setPhoneNumber(updateRequest.get("phone"));
            }
            if (updateRequest.containsKey("address")) {
                account.setAddress(updateRequest.get("address"));
            }
            if (updateRequest.containsKey("city")) {
                account.setCity(updateRequest.get("city"));
            }
            if (updateRequest.containsKey("country")) {
                account.setCountry(updateRequest.get("country"));
            }
            if (updateRequest.containsKey("postalCode")) {
                try {
                    Integer postalCode = parsePostalCode(updateRequest.get("postalCode"));
                    account.setPostalCode(postalCode);
                } catch (Exception e) {
                    logger.warn("Invalid postal code format: {}", updateRequest.get("postalCode"));
                    return ResponseEntity.badRequest()
                            .body(Map.of("error", "Invalid postal code format. Must be 5-9 digits."));
                }
            }
            if (updateRequest.containsKey("dateOfBirth")) {
                try {
                    LocalDate dateOfBirth = LocalDate.parse(updateRequest.get("dateOfBirth"));
                    account.setDateOfBirth(dateOfBirth);
                } catch (Exception e) {
                    logger.warn("Invalid date format: {}", updateRequest.get("dateOfBirth"));
                    return ResponseEntity.badRequest().body(Map.of("error", "Invalid date format. Use YYYY-MM-DD."));
                }
            }
            if (updateRequest.containsKey("companyName")) {
                // Update customer-specific field
                Customer customer = customerService.getCustomerByAccountId(account.getId());
                if (customer != null) {
                    customer.setCompanyName(updateRequest.get("companyName"));
                    customerRepository.save(customer);
                }
            }

            // Create update request for service with all fields
            AccountUpdateRequest serviceRequest = AccountUpdateRequest
                    .builder()
                    .firstName(account.getFirstName())
                    .lastName(account.getLastName())
                    .phoneNumber(account.getPhoneNumber())
                    .dateOfBirth(account.getDateOfBirth())
                    .address(account.getAddress())
                    .city(account.getCity())
                    .country(account.getCountry())
                    .postalCode(account.getPostalCode())
                    .build();

            Account updatedAccount = accountService.updateUser(account.getId(), serviceRequest);

            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "user", AccountResponse.fromAccount(updatedAccount)));

        } catch (Exception e) {
            logger.error("Error updating user profile: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update profile: " + e.getMessage()));
        }
    }

    /**
     * Register customer from Keycloak JWT data
     * Extracts all available data from JWT and creates customer record
     */
    @PostMapping("/customer/register-from-jwt")
    @PreAuthorize("hasAnyRole('ROLE_CUSTOMER')")
    public ResponseEntity<?> registerCustomerFromJWT(
            Authentication authentication,
            @RequestBody(required = false) Map<String, String> additionalData) {

        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid authentication"));
            }

            // Extract all available data from JWT
            String keycloakId = jwt.getClaimAsString("sub");
            String username = jwt.getClaimAsString("preferred_username");
            String email = jwt.getClaimAsString("email");
            String firstName = jwt.getClaimAsString("given_name");
            String lastName = jwt.getClaimAsString("family_name");
            String phoneNumber = jwt.getClaimAsString("phone_number");

            // Handle date of birth
            String dateOfBirthStr = jwt.getClaimAsString("date_of_birth");
            LocalDate dateOfBirth = null;
            if (dateOfBirthStr != null && !dateOfBirthStr.isEmpty()) {
                try {
                    dateOfBirth = LocalDate.parse(dateOfBirthStr);
                } catch (Exception e) {
                    logger.warn("Could not parse date_of_birth from token: {}", dateOfBirthStr);
                }
            }

            logger.info("Registering customer from JWT for user: {}", username);

            // Check if customer already exists
            Optional<Account> existingAccount = accountService.getAccountByKeycloakId(keycloakId);
            if (existingAccount.isPresent()) {
                try {
                    Customer existingCustomer = customerService.getCustomerByAccountId(existingAccount.get().getId());
                    return ResponseEntity.ok(Map.of(
                            "message", "Customer already registered",
                            "customer", CustomerResponse.fromCustomer(existingCustomer)));
                } catch (Exception e) {
                    // Customer doesn't exist, continue with creation
                }
            }

            String address = extractJWTClaim(jwt, "address", additionalData, "address");
            String city = extractJWTClaim(jwt, "city", additionalData, "city");
            String country = extractJWTClaim(jwt, "country", additionalData, "country");
            String postalCode = extractJWTClaim(jwt, "postal_code", additionalData, "postalCode");
            String companyName = extractJWTClaim(jwt, "companyName", additionalData, "companyName");

            // Create customer with JWT data
            CustomerCreateRequest customerRequest = CustomerCreateRequest.builder()
                    .username(username)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .phoneNumber(phoneNumber)
                    .dateOfBirth(dateOfBirth)
                    .password("keycloak-managed")
                    .address(address != null ? address : "To be provided")
                    .city(city != null ? city : "To be provided")
                    .country(country != null ? country : "To be provided")
                    .postalCode(parsePostalCode(postalCode))
                    .companyName(companyName)
                    .build();

            // Create customer using existing service method
            Customer customer = customerService.createCustomerFromKeycloak(keycloakId, customerRequest);

            logger.info("Customer registered successfully from JWT: {}", customer.getCustomerCode());

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "success", true,
                    "message", "Customer registered successfully from Keycloak data",
                    "customer", CustomerResponse.fromCustomer(customer),
                    "customerCode", customer.getCustomerCode()));

        } catch (Exception e) {
            logger.error("Error registering customer from JWT: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Failed to register customer: " + e.getMessage()));
        }
    }

    /**
     * Helper method to extract data from JWT or additional request data
     */
    private String extractJWTClaim(Jwt jwt, String jwtClaimName, Map<String, String> additionalData,
            String requestKey) {
        // Try JWT first
        String value = jwt.getClaimAsString(jwtClaimName);
        if (value != null && !value.isEmpty()) {
            return value;
        }

        // Fallback to additional data provided by client
        if (additionalData != null && additionalData.containsKey(requestKey)) {
            return additionalData.get(requestKey);
        }

        return null;
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(Authentication authentication) {
        try {
            String username = "unknown";
            if (authentication != null && authentication.getPrincipal() instanceof Jwt jwt) {
                username = jwt.getClaimAsString("preferred_username");
                if (username == null) {
                    username = jwt.getClaimAsString("sub");
                }
            }

            logger.info("Logout request received for user: {}", username);

            return ResponseEntity.ok(Map.of(
                    "message", "Logout successful",
                    "username", username,
                    "timestamp", System.currentTimeMillis()));

        } catch (Exception e) {
            logger.error("Error during logout process: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of(
                    "message", "Logout completed with warnings",
                    "warning", "Some cleanup operations failed but logout was successful"));
        }
    }

    @GetMapping("/debug")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> debugAuth(Authentication authentication) {
        Map<String, Object> debugInfo = new HashMap<>();

        if (authentication != null) {
            debugInfo.put("authenticated", true);
            debugInfo.put("principal", authentication.getPrincipal().getClass().getSimpleName());
            debugInfo.put("authorities", authentication.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()));
            debugInfo.put("hasCustomerRole", authentication.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_CUSTOMER")));

            if (authentication.getPrincipal() instanceof Jwt jwt) {
                debugInfo.put("tokenType", "JWT");
                debugInfo.put("subject", jwt.getClaimAsString("sub"));
                debugInfo.put("username", jwt.getClaimAsString("preferred_username"));
                debugInfo.put("email", jwt.getClaimAsString("email"));
                debugInfo.put("issuer", jwt.getClaimAsString("iss"));
                debugInfo.put("realm_access", jwt.getClaim("realm_access"));
                debugInfo.put("resource_access", jwt.getClaim("resource_access"));
                debugInfo.put("tokenExpiry", jwt.getClaimAsString("exp"));
            }
        } else {
            debugInfo.put("authenticated", false);
            debugInfo.put("message", "No authentication found - token missing or invalid");
        }

        return ResponseEntity.ok(debugInfo);
    }

    /**
     * Helper method to parse postal code string to Integer with validation
     */
    private Integer parsePostalCode(String postalCodeStr) {
        if (postalCodeStr == null || postalCodeStr.trim().isEmpty()) {
            return null;
        }

        try {
            Integer postalCode = Integer.parseInt(postalCodeStr.trim());
            // Validate postal code range (5-9 digits)
            if (postalCode < 10000 || postalCode > 999999999) {
                logger.warn("Postal code {} is out of range (5-9 digits), setting to null", postalCode);
                return null;
            }
            return postalCode;
        } catch (NumberFormatException e) {
            logger.warn("Failed to parse postal code '{}': {}", postalCodeStr, e.getMessage());
            return null;
        }
    }
}