package org.vgu.backend.controllers;

import java.time.LocalDate;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.model.Customer;
import org.vgu.backend.service.customer.ICustomerService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/keycloak/events")
@RequiredArgsConstructor
public class KeycloakEventsController {

    private static final Logger logger = LoggerFactory.getLogger(KeycloakEventsController.class);

    private final ICustomerService customerService;

    @Value("${keycloak.events.secret:}")
    private String eventsSharedSecret;

    @PostMapping
    public ResponseEntity<?> receive(@RequestBody Map<String, Object> event,
            @RequestHeader(value = "X-Event-Token", required = false) String token) {
        try {
            logger.info("Received Keycloak event: {}", event.get("type"));

            String type = string(event.get("type"));
            if (type == null) {
                logger.warn("Event without type received");
                return ResponseEntity.badRequest().body(Map.of("error", "missing type"));
            }

            if (!"REGISTER".equalsIgnoreCase(type)) {
                logger.debug("Ignoring non-REGISTER event type: {}", type);
                return ResponseEntity.ok().build();
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> userData = (Map<String, Object>) event.get("userData");
            if (userData == null) {
                logger.warn("REGISTER event missing userData");
                return ResponseEntity.badRequest().body(Map.of("error", "missing userData"));
            }

            String username = string(userData.get("username"));
            String email = string(userData.get("email"));
            String firstName = string(userData.get("firstName"));
            String lastName = string(userData.get("lastName"));

            if (username == null || email == null) {
                logger.warn("REGISTER event missing required user fields");
                return ResponseEntity.badRequest().body(Map.of("error", "missing required user fields"));
            }

            logger.info("Processing registration for user: {} ({})", username, email);

            // Extract additional fields from userData.attributes
            @SuppressWarnings("unchecked")
            Map<String, Object> attributes = (Map<String, Object>) userData.get("attributes");

            logger.info("📋 Extracting user attributes: {}", attributes);

            String phoneNumber = null;
            String address = null;
            String city = null;
            String country = null;
            Integer postalCode = null;
            String companyName = null;
            LocalDate dateOfBirth = null;

            if (attributes != null) {
                phoneNumber = string(attributes.get("phoneNumber"));
                address = string(attributes.get("address"));
                city = string(attributes.get("city"));
                country = string(attributes.get("country"));

                // Parse postal code to Integer
                String postalCodeString = string(attributes.get("postalCode"));
                if (postalCodeString != null && !postalCodeString.trim().isEmpty()) {
                    try {
                        postalCode = Integer.parseInt(postalCodeString.trim());
                        // Validate postal code range
                        if (postalCode < 10000 || postalCode > 999999999) {
                            logger.warn("Postal code {} is out of range (5-9 digits), setting to null", postalCode);
                            postalCode = null;
                        }
                    } catch (NumberFormatException e) {
                        logger.warn("Failed to parse postal code '{}': {}", postalCodeString, e.getMessage());
                    }
                }

                companyName = string(attributes.get("companyName"));

                // Parse date of birth if available
                String dobString = string(attributes.get("dateOfBirth"));
                if (dobString != null && !dobString.trim().isEmpty()) {
                    try {
                        dateOfBirth = LocalDate.parse(dobString);
                    } catch (Exception e) {
                        logger.warn("Failed to parse date of birth '{}': {}", dobString, e.getMessage());
                    }
                }
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> details = (Map<String, Object>) event.get("details");
            String userId = details != null ? string(details.get("userId")) : null;

            CustomerCreateRequest createRequest = CustomerCreateRequest.builder()
                    .username(username)
                    .email(email)
                    .firstName(firstName)
                    .lastName(lastName)
                    .phoneNumber(phoneNumber)
                    .address(address)
                    .city(city)
                    .country(country)
                    .postalCode(postalCode)
                    .companyName(companyName)
                    .dateOfBirth(dateOfBirth)
                    .password("")
                    .build();

            logger.info(
                    "📝 CustomerCreateRequest built: username={}, email={}, phone={}, address={}, city={}, country={}, postalCode={}, companyName={}, dateOfBirth={}",
                    createRequest.getUsername(), createRequest.getEmail(), createRequest.getPhoneNumber(),
                    createRequest.getAddress(), createRequest.getCity(), createRequest.getCountry(),
                    createRequest.getPostalCode(), createRequest.getCompanyName(), createRequest.getDateOfBirth());

            try {
                Customer customer = customerService.createCustomerFromKeycloak(userId, createRequest);
                logger.info("Successfully created customer: {} (ID: {})",
                        customer.getAccount().getUsername(), customer.getId());
                return ResponseEntity.ok().body(Map.of("status", "success"));
            } catch (Exception e) {
                logger.error("Failed to create customer: {}", e.getMessage(), e);
                String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error";
                return ResponseEntity.ok().body(Map.of("status", "error", "message", errorMessage));
            }
        } catch (Exception e) {
            logger.error("  Error processing Keycloak event: {}", e.getMessage(), e);
            String errorMessage = e.getMessage() != null ? e.getMessage() : "Unknown error";
            return ResponseEntity.internalServerError().body(Map.of("error", errorMessage));
        }
    }

    private static String string(Object o) {
        return o == null ? null : o.toString();
    }
}
