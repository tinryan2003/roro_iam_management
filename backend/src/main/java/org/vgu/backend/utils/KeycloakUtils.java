package org.vgu.backend.utils;

import java.net.URI;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.keycloak.admin.client.Keycloak;
import org.keycloak.admin.client.resource.RealmResource;
import org.keycloak.admin.client.resource.UserResource;
import org.keycloak.admin.client.resource.UsersResource;
import org.keycloak.representations.idm.ClientRepresentation;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.RoleRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.keycloak.representations.idm.UserSessionRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.AccountUpdateRequest;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.dto.request.EmployeeCreateRequest;
import org.vgu.backend.enums.TypeClient;

import jakarta.ws.rs.core.Response;

@Component
public class KeycloakUtils {

    private final Logger logger = LoggerFactory.getLogger(KeycloakUtils.class);

    @Value("${keycloak.employee.realm}")
    private String employeeRealm;

    @Value("${keycloak.customer.realm}")
    private String customerRealm;

    @Value("${keycloak.employee.client-id}")
    private String employeeClientId;

    private final Keycloak adminKeycloak;

    public KeycloakUtils(Keycloak adminKeycloak) {
        this.adminKeycloak = adminKeycloak;
    }

    public String createEmployee(EmployeeCreateRequest createRequest) throws Exception {
        try {
            logger.info("Creating employee in Keycloak: {}", createRequest.getUsername());

            // Check if user already exists by username or email
            String existingUserId = findUserIdByUsernameOrEmail(createRequest.getUsername());
            if (existingUserId == null) {
                existingUserId = findUserIdByUsernameOrEmail(createRequest.getEmail());
            }

            if (existingUserId != null) {
                logger.warn("User already exists in Keycloak with username '{}' or email '{}'. User ID: {}",
                        createRequest.getUsername(), createRequest.getEmail(), existingUserId);
                throw new RuntimeException("User already exists with username '" + createRequest.getUsername() +
                        "' or email '" + createRequest.getEmail() + "'. Please use a different username or email.");
            }

            UserRepresentation user = buildEmployeeRepresentation(createRequest);

            // Create user in the appropriate realm
            RealmResource realmResource = adminKeycloak.realm(employeeRealm);
            UsersResource usersResource = realmResource.users();
            Response response = usersResource.create(user);

            switch (response.getStatus()) {
                case 201 -> {
                    String userId = extractUserIdFromLocation(response.getLocation());
                    assignClientRoles(userId, TypeClient.EMPLOYEE);
                    logger.info("Employee created successfully in Keycloak with ID: {}", userId);
                    CredentialRepresentation passwordCred = new CredentialRepresentation();
                    passwordCred.setTemporary(false);
                    passwordCred.setType(CredentialRepresentation.PASSWORD);
                    passwordCred.setValue(createRequest.getPassword());

                    UserResource userResource = usersResource.get(userId);
                    userResource.resetPassword(passwordCred);

                    // Assign role to user
                    RoleRepresentation roleRep = realmResource.roles().get(createRequest.getPosition().name())
                            .toRepresentation();
                    userResource.roles().realmLevel().add(Arrays.asList(roleRep));

                    ClientRepresentation employeeClient = realmResource.clients() //
                            .findByClientId(employeeClientId).get(0);
                    RoleRepresentation userClientRole = realmResource.clients().get(employeeClient.getId()) //
                            .roles().get(createRequest.getPosition().name()).toRepresentation();
                    userResource.roles().clientLevel(employeeClient.getId()).add(Arrays.asList(userClientRole));

                    return userId;
                }
                case 409 -> {
                    // Handle conflict - user already exists
                    String conflictMessage = "User already exists with username '" + createRequest.getUsername() +
                            "' or email '" + createRequest.getEmail() + "'. Please use a different username or email.";
                    logger.error("Conflict creating employee in Keycloak: {}", conflictMessage);
                    throw new RuntimeException(conflictMessage);
                }
                case 400 -> {
                    // Capture detailed validation error from Keycloak
                    String detailedError = extractErrorDetails(response);
                    String errorMessage = "Validation failed when creating employee in Keycloak: " + detailedError;
                    logger.error("Validation error creating employee '{}' in Keycloak. Status: 400. Details: {}",
                            createRequest.getUsername(), detailedError);

                    // Log the user data for debugging (without password)
                    logger.error(
                            "User data sent to Keycloak: username='{}', email='{}', firstName='{}', lastName='{}', dateOfBirth='{}'",
                            createRequest.getUsername(), createRequest.getEmail(),
                            createRequest.getFirstName(), createRequest.getLastName(),
                            createRequest.getDateOfBirth());

                    throw new RuntimeException(errorMessage);
                }
                default -> {
                    String detailedError = extractErrorDetails(response);
                    String errorMessage = "Failed to create employee in Keycloak. Status: " + response.getStatus() +
                            (detailedError.isEmpty() ? "" : ". Details: " + detailedError);
                    logger.error("Error creating employee '{}' in Keycloak. Status: {}. Details: {}",
                            createRequest.getUsername(), response.getStatus(), detailedError);
                    throw new RuntimeException(errorMessage);
                }
            }

        } catch (Exception e) {
            logger.error("Error creating employee in Keycloak: {}", e.getMessage(), e);
            throw new Exception("Failed to create employee in Keycloak: " + e.getMessage(), e);
        }
    }

    public String createCustomer(CustomerCreateRequest request) throws Exception {
        try {
            logger.info("Creating customer in Keycloak: {}", request.getUsername());

            // Check if user already exists by username or email
            String existingUserId = findUserIdByUsernameOrEmail(request.getUsername());
            if (existingUserId == null) {
                existingUserId = findUserIdByUsernameOrEmail(request.getEmail());
            }

            if (existingUserId != null) {
                logger.warn("User already exists in Keycloak with username '{}' or email '{}'. User ID: {}",
                        request.getUsername(), request.getEmail(), existingUserId);
                throw new RuntimeException("User already exists with username '" + request.getUsername() +
                        "' or email '" + request.getEmail() + "'. Please use a different username or email.");
            }

            UserRepresentation user = buildCustomerRepresentation(request);

            // Create user in the customer realm
            RealmResource realmResource = adminKeycloak.realm(customerRealm);
            UsersResource usersResource = realmResource.users();
            Response response = usersResource.create(user);

            switch (response.getStatus()) {
                case 201 -> {
                    String userId = extractUserIdFromLocation(response.getLocation());
                    assignClientRoles(userId, TypeClient.CUSTOMER);
                    logger.info("Customer created successfully in Keycloak with ID: {}", userId);

                    // Set password
                    CredentialRepresentation passwordCred = new CredentialRepresentation();
                    passwordCred.setTemporary(false);
                    passwordCred.setType(CredentialRepresentation.PASSWORD);
                    passwordCred.setValue(request.getPassword());

                    UserResource userResource = usersResource.get(userId);
                    userResource.resetPassword(passwordCred);

                    // Assign customer role
                    RoleRepresentation roleRep = realmResource.roles().get("CUSTOMER").toRepresentation();
                    userResource.roles().realmLevel().add(Arrays.asList(roleRep));

                    return userId;
                }
                case 409 -> {
                    String conflictMessage = "User already exists with username '" + request.getUsername() +
                            "' or email '" + request.getEmail() + "'. Please use a different username or email.";
                    logger.error("Conflict creating customer in Keycloak: {}", conflictMessage);
                    throw new RuntimeException(conflictMessage);
                }
                case 400 -> {
                    String detailedError = extractErrorDetails(response);
                    String errorMessage = "Validation failed when creating customer in Keycloak: " + detailedError;
                    logger.error("Validation error creating customer '{}' in Keycloak. Status: 400. Details: {}",
                            request.getUsername(), detailedError);

                    logger.error(
                            "Customer data sent to Keycloak: username='{}', email='{}', firstName='{}', lastName='{}', dateOfBirth='{}'",
                            request.getUsername(), request.getEmail(),
                            request.getFirstName(), request.getLastName(),
                            request.getDateOfBirth());

                    throw new RuntimeException(errorMessage);
                }
                default -> {
                    String detailedError = extractErrorDetails(response);
                    String errorMessage = "Failed to create customer in Keycloak. Status: " + response.getStatus() +
                            (detailedError.isEmpty() ? "" : ". Details: " + detailedError);
                    logger.error("Error creating customer '{}' in Keycloak. Status: {}. Details: {}",
                            request.getUsername(), response.getStatus(), detailedError);
                    throw new RuntimeException(errorMessage);
                }
            }

        } catch (Exception e) {
            logger.error("Error creating customer in Keycloak: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create customer in Keycloak: " + e.getMessage(), e);
        }
    }

    public void updateUser(String keycloakId, AccountUpdateRequest updateRequest) throws Exception {
        try {
            logger.info("Updating user in Keycloak: {}", keycloakId);

            UserRepresentation user = null;
            UserResource userResource = null;
            for (String r : new String[] { employeeRealm, customerRealm }) {
                try {
                    UsersResource usersResource = adminKeycloak.realm(r).users();
                    userResource = usersResource.get(keycloakId);
                    user = userResource.toRepresentation();
                    if (user != null) {
                        break;
                    }
                } catch (Exception ignore) {
                }
            }
            if (user == null || userResource == null) {
                throw new RuntimeException("User not found in any configured realm");
            }

            // Update basic fields
            if (updateRequest.getFirstName() != null) {
                user.setFirstName(updateRequest.getFirstName());
            }
            if (updateRequest.getLastName() != null) {
                user.setLastName(updateRequest.getLastName());
            }

            // Update custom attributes
            Map<String, List<String>> attributes = user.getAttributes();
            if (attributes == null) {
                attributes = new HashMap<>();
            }

            if (updateRequest.getPhoneNumber() != null) {
                attributes.put("phoneNumber", Arrays.asList(updateRequest.getPhoneNumber()));
            }
            if (updateRequest.getDateOfBirth() != null) {
                attributes.put("dateOfBirth", Arrays.asList(updateRequest.getDateOfBirth().toString()));
            }
            if (updateRequest.getAddress() != null) {
                attributes.put("address", Arrays.asList(updateRequest.getAddress()));
            }
            if (updateRequest.getCity() != null) {
                attributes.put("city", Arrays.asList(updateRequest.getCity()));
            }
            if (updateRequest.getCountry() != null) {
                attributes.put("country", Arrays.asList(updateRequest.getCountry()));
            }
            if (updateRequest.getPostalCode() != null) {
                attributes.put("postalCode", Arrays.asList(updateRequest.getPostalCode().toString()));
            }

            user.setAttributes(attributes);
            userResource.update(user);

            logger.info("User updated successfully in Keycloak: {}", keycloakId);

        } catch (Exception e) {
            logger.error("Error updating user in Keycloak {}: {}", keycloakId, e.getMessage(), e);
            throw new Exception("Failed to update user in Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Deletes a user from Keycloak
     */
    public void deleteUser(String keycloakId) throws Exception {
        try {
            logger.info("Deleting user from Keycloak: {}", keycloakId);

            boolean removed = false;
            for (String r : new String[] { employeeRealm, customerRealm }) {
                try {
                    UsersResource usersResource = adminKeycloak.realm(r).users();
                    UserResource userResource = usersResource.get(keycloakId);
                    userResource.remove();
                    removed = true;
                    break;
                } catch (Exception ignore) {
                }
            }
            if (!removed) {
                throw new RuntimeException("User not found in any configured realm");
            }

            logger.info("User deleted successfully from Keycloak: {}", keycloakId);

        } catch (Exception e) {
            logger.error("Error deleting user from Keycloak {}: {}", keycloakId, e.getMessage(), e);
            throw new Exception("Failed to delete user from Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Enables or disables a user in Keycloak
     */
    public void setUserEnabled(String keycloakId, boolean enabled) throws Exception {
        try {
            logger.info("Setting user enabled status in Keycloak: {} -> {}", keycloakId, enabled);

            boolean updated = false;
            for (String r : new String[] { employeeRealm, customerRealm }) {
                try {
                    UsersResource usersResource = adminKeycloak.realm(r).users();
                    UserResource userResource = usersResource.get(keycloakId);
                    UserRepresentation user = userResource.toRepresentation();
                    if (user != null) {
                        user.setEnabled(enabled);
                        userResource.update(user);
                        updated = true;
                        break;
                    }
                } catch (Exception ignore) {
                }
            }
            if (!updated) {
                throw new RuntimeException("User not found in any configured realm");
            }

            logger.info("User enabled status updated successfully in Keycloak: {} -> {}", keycloakId, enabled);

        } catch (Exception e) {
            logger.error("Error setting user enabled status in Keycloak {}: {}", keycloakId, e.getMessage(), e);
            throw new Exception("Failed to set user enabled status in Keycloak: " + e.getMessage(), e);
        }
    }

    private UserRepresentation buildUserRepresentation(AccountCreateRequest createRequest) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(createRequest.getUsername());
        user.setEmail(createRequest.getEmail());

        // Sanitize names to ensure Keycloak compatibility
        user.setFirstName(sanitizeName(createRequest.getFirstName()));
        user.setLastName(sanitizeName(createRequest.getLastName()));
        user.setEmailVerified(true);

        // Set custom attributes
        Map<String, List<String>> attributes = new HashMap<>();
        if (createRequest.getPhoneNumber() != null) {
            attributes.put("phoneNumber", Arrays.asList(createRequest.getPhoneNumber()));
        }
        if (createRequest.getDateOfBirth() != null) {
            attributes.put("dateOfBirth", Arrays.asList(createRequest.getDateOfBirth().toString()));
        }
        if (createRequest.getPrimaryRole() != null) {
            attributes.put("role", Arrays.asList(createRequest.getPrimaryRole().name()));
        }

        // Address attributes required by Keycloak
        if (createRequest.getAddress() != null) {
            attributes.put("address", Arrays.asList(createRequest.getAddress()));
        }
        if (createRequest.getCity() != null) {
            attributes.put("city", Arrays.asList(createRequest.getCity()));
        }
        if (createRequest.getCountry() != null) {
            attributes.put("country", Arrays.asList(createRequest.getCountry()));
        }
        if (createRequest.getPostalCode() != null) {
            attributes.put("postalCode", Arrays.asList(createRequest.getPostalCode().toString()));
        }

        user.setAttributes(attributes);

        // Set password
        CredentialRepresentation passwordCred = new CredentialRepresentation();
        passwordCred.setTemporary(false);
        passwordCred.setType(CredentialRepresentation.PASSWORD);
        passwordCred.setValue(createRequest.getPassword());
        user.setCredentials(Arrays.asList(passwordCred));

        return user;
    }

    private UserRepresentation buildEmployeeRepresentation(EmployeeCreateRequest createRequest) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(createRequest.getUsername());
        user.setEmail(createRequest.getEmail());

        // Sanitize names to ensure Keycloak compatibility
        user.setFirstName(sanitizeName(createRequest.getFirstName()));
        user.setLastName(sanitizeName(createRequest.getLastName()));
        user.setEmailVerified(true);

        // Set custom attributes
        Map<String, List<String>> attributes = new HashMap<>();
        if (createRequest.getPhoneNumber() != null) {
            attributes.put("phoneNumber", Arrays.asList(createRequest.getPhoneNumber()));
        }
        if (createRequest.getDateOfBirth() != null) {
            attributes.put("dateOfBirth", Arrays.asList(createRequest.getDateOfBirth().toString()));
        }
        attributes.put("role", Arrays.asList(TypeClient.EMPLOYEE.name()));

        // Address attributes
        if (createRequest.getAddress() != null) {
            attributes.put("address", Arrays.asList(createRequest.getAddress()));
        }
        if (createRequest.getCity() != null) {
            attributes.put("city", Arrays.asList(createRequest.getCity()));
        }
        if (createRequest.getCountry() != null) {
            attributes.put("country", Arrays.asList(createRequest.getCountry()));
        }
        if (createRequest.getPostalCode() != null) {
            attributes.put("postalCode", Arrays.asList(createRequest.getPostalCode().toString()));
        }

        // Employee specific attributes
        if (createRequest.getPosition() != null) {
            attributes.put("position", Arrays.asList(createRequest.getPosition().name()));
        }
        if (createRequest.getHireDate() != null) {
            attributes.put("hireDate", Arrays.asList(createRequest.getHireDate().toString()));
        }
        if (createRequest.getSalary() != null) {
            attributes.put("salary", Arrays.asList(createRequest.getSalary().toString()));
        }
        if (createRequest.getEmployeeCode() != null) {
            attributes.put("employeeCode", Arrays.asList(createRequest.getEmployeeCode()));
        }

        user.setAttributes(attributes);

        // Set password
        CredentialRepresentation passwordCred = new CredentialRepresentation();
        passwordCred.setTemporary(false);
        passwordCred.setType(CredentialRepresentation.PASSWORD);
        passwordCred.setValue(createRequest.getPassword());
        user.setCredentials(Arrays.asList(passwordCred));

        return user;
    }

    private UserRepresentation buildCustomerRepresentation(CustomerCreateRequest createRequest) {
        UserRepresentation user = new UserRepresentation();
        user.setEnabled(true);
        user.setUsername(createRequest.getUsername());
        user.setEmail(createRequest.getEmail());

        // Sanitize names to ensure Keycloak compatibility
        user.setFirstName(sanitizeName(createRequest.getFirstName()));
        user.setLastName(sanitizeName(createRequest.getLastName()));
        user.setEmailVerified(true);

        // Set custom attributes
        Map<String, List<String>> attributes = new HashMap<>();
        if (createRequest.getPhoneNumber() != null) {
            attributes.put("phoneNumber", Arrays.asList(createRequest.getPhoneNumber()));
        }
        if (createRequest.getDateOfBirth() != null) {
            attributes.put("dateOfBirth", Arrays.asList(createRequest.getDateOfBirth().toString()));
        }
        attributes.put("role", Arrays.asList(TypeClient.CUSTOMER.name()));

        // Address attributes
        if (createRequest.getAddress() != null) {
            attributes.put("address", Arrays.asList(createRequest.getAddress()));
        }
        if (createRequest.getCity() != null) {
            attributes.put("city", Arrays.asList(createRequest.getCity()));
        }
        if (createRequest.getCountry() != null) {
            attributes.put("country", Arrays.asList(createRequest.getCountry()));
        }
        if (createRequest.getPostalCode() != null) {
            attributes.put("postalCode", Arrays.asList(createRequest.getPostalCode().toString()));
        }

        // Customer specific attributes
        if (createRequest.getCustomerCode() != null) {
            attributes.put("customerCode", Arrays.asList(createRequest.getCustomerCode()));
        }
        if (createRequest.getCompanyName() != null) {
            attributes.put("companyName", Arrays.asList(createRequest.getCompanyName()));
        }

        user.setAttributes(attributes);

        // Set password
        CredentialRepresentation passwordCred = new CredentialRepresentation();
        passwordCred.setTemporary(false);
        passwordCred.setType(CredentialRepresentation.PASSWORD);
        passwordCred.setValue(createRequest.getPassword());
        user.setCredentials(Arrays.asList(passwordCred));

        return user;
    }

    private void assignClientRoles(String userId, TypeClient clientType) {
        try {
            // Determine base role by client type
            String baseRoleName;
            List<String> targetClientIds;

            switch (clientType) {
                case CUSTOMER -> {
                    baseRoleName = "CUSTOMER";
                    // Assign CUSTOMER role on both customer UI client and API client (if present)
                    targetClientIds = java.util.List.of("customer-portal", "roro-api");
                }
                case EMPLOYEE -> {
                    baseRoleName = "EMPLOYEE";
                    // Keep assignment to employee portal; extend as needed
                    targetClientIds = java.util.List.of("employee-portal");
                }
                default -> {
                    logger.warn("Unsupported client type for role assignment: {}", clientType);
                    return;
                }
            }

            for (String clientId : targetClientIds) {
                try {
                    String realm = resolveRealm(clientType);
                    List<ClientRepresentation> clients = adminKeycloak.realm(realm).clients().findByClientId(clientId);
                    if (clients == null || clients.isEmpty()) {
                        logger.warn("Client not found in Keycloak for clientId={}", clientId);
                        continue;
                    }

                    String clientUuid = clients.get(0).getId();

                    RoleRepresentation roleRep;
                    try {
                        roleRep = adminKeycloak.realm(realm).clients().get(clientUuid).roles().get(baseRoleName)
                                .toRepresentation();
                    } catch (Exception e) {
                        logger.warn("Role '{}' not found for client '{}'. Skipping assignment.", baseRoleName,
                                clientId);
                        continue;
                    }

                    adminKeycloak.realm(realm)
                            .users()
                            .get(userId)
                            .roles()
                            .clientLevel(clientUuid)
                            .add(java.util.Collections.singletonList(roleRep));

                    logger.info("Assigned client role '{}' on '{}' to user {}", baseRoleName, clientId, userId);
                } catch (Exception inner) {
                    logger.error("Failed assigning '{}' on '{}' for user {}: {}", baseRoleName, clientId, userId,
                            inner.getMessage());
                }
            }
        } catch (Exception ex) {
            logger.error("Failed to assign client roles for user {}: {}", userId, ex.getMessage(), ex);
        }
    }

    private String extractUserIdFromLocation(URI location) {
        String path = location.getPath();
        return path.substring(path.lastIndexOf('/') + 1);
    }

    public UserRepresentation getUserById(String keycloakId) throws Exception {
        try {
            // Try both realms
            for (String r : new String[] { employeeRealm, customerRealm }) {
                try {
                    UsersResource usersResource = adminKeycloak.realm(r).users();
                    UserResource userResource = usersResource.get(keycloakId);
                    UserRepresentation rep = userResource.toRepresentation();
                    if (rep != null)
                        return rep;
                } catch (Exception ignore) {
                }
            }
            throw new RuntimeException("User not found in any configured realm");
        } catch (Exception e) {
            logger.error("Error getting user from Keycloak {}: {}", keycloakId, e.getMessage(), e);
            throw new Exception("Failed to get user from Keycloak: " + e.getMessage(), e);
        }
    }

    /**
     * Check if a user exists by username or email.
     */
    public boolean checkUserExists(String usernameOrEmail) {
        try {
            return findUserIdByUsernameOrEmail(usernameOrEmail) != null;
        } catch (Exception ex) {
            logger.error("Failed to check user existence for '{}': {}", usernameOrEmail, ex.getMessage());
            return false;
        }
    }

    /**
     * Logout all sessions for a specific user identified by username or email.
     */
    public void logoutUserSessions(String usernameOrEmail) throws Exception {
        try {
            String userId = findUserIdByUsernameOrEmail(usernameOrEmail);
            if (userId == null) {
                logger.warn("logoutUserSessions: user not found for '{}'", usernameOrEmail);
                return;
            }
            // Try both realms
            try {
                adminKeycloak.realm(employeeRealm).users().get(userId).logout();
            } catch (Exception e1) {
                adminKeycloak.realm(customerRealm).users().get(userId).logout();
            }
            logger.info("All sessions terminated for user '{}' (ID={})", usernameOrEmail, userId);
        } catch (Exception e) {
            logger.error("Failed to logout sessions for user '{}': {}", usernameOrEmail, e.getMessage(), e);
            throw new Exception("Failed to logout user sessions: " + e.getMessage(), e);
        }
    }

    /**
     * Logout all sessions for all users in the realm.
     */
    public void logoutAllUserSessions() throws Exception {
        try {
            // Logout all users in both realms
            adminKeycloak.realm(employeeRealm).logoutAll();
            adminKeycloak.realm(customerRealm).logoutAll();
            logger.info("All user sessions terminated for realms {}, {}", employeeRealm, customerRealm);
        } catch (Exception e) {
            logger.error("Failed to logout all user sessions: {}", e.getMessage(), e);
            throw new Exception("Failed to logout all sessions: " + e.getMessage(), e);
        }
    }

    /**
     * Get active sessions for a user identified by username or email.
     */
    public List<UserSessionRepresentation> getUserActiveSessions(String usernameOrEmail) throws Exception {
        try {
            String userId = findUserIdByUsernameOrEmail(usernameOrEmail);
            if (userId == null) {
                logger.warn("getUserActiveSessions: user not found for '{}'", usernameOrEmail);
                return java.util.Collections.emptyList();
            }
            try {
                return adminKeycloak.realm(employeeRealm).users().get(userId).getUserSessions();
            } catch (Exception e) {
                return adminKeycloak.realm(customerRealm).users().get(userId).getUserSessions();
            }
        } catch (Exception e) {
            logger.error("Failed to fetch active sessions for '{}': {}", usernameOrEmail, e.getMessage(), e);
            throw new Exception("Failed to retrieve user sessions: " + e.getMessage(), e);
        }
    }

    /**
     * Simple connection test against Keycloak admin API.
     */
    public boolean testKeycloakConnection() {
        try {
            // If we can fetch the realm representation without exception, consider it OK
            return adminKeycloak.realm(employeeRealm).toRepresentation() != null
                    && adminKeycloak.realm(customerRealm).toRepresentation() != null;
        } catch (Exception e) {
            logger.error("Keycloak connection test failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Provide direct access to UserResource by Keycloak user ID.
     */
    public UserResource getUserResource(String keycloakId) {
        // Unknown realm for raw ID; prefer employee realm and fallback to customer
        // realm
        try {
            return adminKeycloak.realm(employeeRealm).users().get(keycloakId);
        } catch (Exception e) {
            return adminKeycloak.realm(customerRealm).users().get(keycloakId);
        }
    }

    private String findUserIdByUsernameOrEmail(String usernameOrEmail) {
        // Search in both realms for comprehensive user existence check
        List<UserRepresentation> allResults = new java.util.ArrayList<>();

        try {
            List<UserRepresentation> employeeResults = adminKeycloak.realm(employeeRealm).users()
                    .search(usernameOrEmail, 0, 20);
            if (employeeResults != null) {
                allResults.addAll(employeeResults);
            }
        } catch (Exception e) {
            logger.debug("Failed to search in employee realm: {}", e.getMessage());
        }

        try {
            List<UserRepresentation> customerResults = adminKeycloak.realm(customerRealm).users()
                    .search(usernameOrEmail, 0, 20);
            if (customerResults != null) {
                allResults.addAll(customerResults);
            }
        } catch (Exception e) {
            logger.debug("Failed to search in customer realm: {}", e.getMessage());
        }

        if (allResults.isEmpty()) {
            return null;
        }

        // Prefer exact match by email first (case-insensitive)
        for (UserRepresentation ur : allResults) {
            if (ur.getEmail() != null && ur.getEmail().equalsIgnoreCase(usernameOrEmail)) {
                logger.debug("Found exact email match for '{}': ID={}", usernameOrEmail, ur.getId());
                return ur.getId();
            }
        }

        // Then exact match by username (case-insensitive)
        for (UserRepresentation ur : allResults) {
            if (ur.getUsername() != null && ur.getUsername().equalsIgnoreCase(usernameOrEmail)) {
                logger.debug("Found exact username match for '{}': ID={}", usernameOrEmail, ur.getId());
                return ur.getId();
            }
        }

        // Log partial matches for debugging but don't return them
        logger.debug("Found {} partial matches for '{}' but no exact matches", allResults.size(), usernameOrEmail);
        return null;
    }

    private String resolveRealm(TypeClient clientType) {
        return switch (clientType) {
            case EMPLOYEE -> employeeRealm;
            case CUSTOMER -> customerRealm;
            default -> employeeRealm;
        };
    }

    /**
     * Extracts detailed error information from Keycloak response
     */
    private String extractErrorDetails(Response response) {
        try {
            if (response.hasEntity()) {
                String responseBody = response.readEntity(String.class);
                if (responseBody != null && !responseBody.trim().isEmpty()) {
                    logger.debug("Keycloak error response body: {}", responseBody);

                    // Try to extract user-friendly error message from common Keycloak error
                    // patterns
                    if (responseBody.contains("User exists with same username")) {
                        return "Username already exists. Please choose a different username.";
                    } else if (responseBody.contains("User exists with same email")) {
                        return "Email already exists. Please use a different email address.";
                    } else if (responseBody.contains("invalid password")) {
                        return "Password does not meet the required policy. Please ensure it meets minimum length and complexity requirements.";
                    } else if (responseBody.contains("invalidValue")) {
                        // Parse more specific validation errors
                        if (responseBody.contains("email")) {
                            return "Invalid email format. Please provide a valid email address.";
                        } else if (responseBody.contains("username")) {
                            return "Invalid username format. Username should contain only letters, numbers, and allowed special characters.";
                        }
                        return "Invalid input format. Please check your data and try again.";
                    } else if (responseBody.contains("Missing required field")) {
                        return "Required fields are missing. Please fill in all mandatory fields.";
                    }

                    // Return truncated response for other cases
                    return responseBody.length() > 200 ? responseBody.substring(0, 200) + "..." : responseBody;
                }
            }
        } catch (Exception e) {
            logger.warn("Failed to extract error details from response: {}", e.getMessage());
        }
        return "Unknown validation error";
    }

    /**
     * Sanitizes a name to ensure it's compatible with Keycloak's validation rules
     * - Removes leading/trailing whitespace
     * - Replaces multiple consecutive spaces with a single space
     * - Removes any characters that are not letters, spaces, hyphens, apostrophes,
     * or periods
     */
    private String sanitizeName(String name) {
        if (name == null) {
            return null;
        }

        // Trim whitespace and replace multiple spaces with single space
        String sanitized = name.trim().replaceAll("\\s+", " ");

        // Remove any character that's not a letter, space, hyphen, apostrophe, or
        // period
        // This regex allows Unicode letters (including accented characters)
        sanitized = sanitized.replaceAll("[^\\p{L}\\s\\-'\\.]", "");

        // Return null if the name becomes empty after sanitization
        return sanitized.isEmpty() ? null : sanitized;
    }
}