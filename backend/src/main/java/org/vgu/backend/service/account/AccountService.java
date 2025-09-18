package org.vgu.backend.service.account;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.keycloak.representations.idm.UserRepresentation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.AccountUpdateRequest;
import org.vgu.backend.enums.TypeClient;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.repository.AccountRepository;
import org.vgu.backend.utils.KeycloakUtils;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service
public class AccountService implements IAccountService {

    private final AccountRepository accountRepository;
    private final KeycloakUtils keycloakUtils;
    private final Logger logger = LoggerFactory.getLogger(AccountService.class);

    // Create account from Keycloak
    @Transactional
    @Override
    public Account createAccountFromKeycloak(String keycloakId, AccountCreateRequest createRequest) {
        logger.info("Creating local account for existing Keycloak user: {}", createRequest.getUsername());

        Account account = Account.builder()
                .keycloakId(keycloakId)
                .username(createRequest.getUsername())
                .email(createRequest.getEmail())
                .firstName(createRequest.getFirstName())
                .lastName(createRequest.getLastName())
                .phoneNumber(createRequest.getPhoneNumber())
                .dateOfBirth(createRequest.getDateOfBirth())
                .primaryRole(createRequest.getPrimaryRole())
                .address(createRequest.getAddress())
                .city(createRequest.getCity())
                .country(createRequest.getCountry())
                .postalCode(createRequest.getPostalCode())
                .isActive(true)
                .build();

        return accountRepository.save(account);
    }

    // Update user on Keycloak
    @Override
    @Transactional
    public Account updateUser(Long accountId, AccountUpdateRequest updateRequest) throws DataNotFoundException {
        Account account = getAccountById(accountId);

        try {
            keycloakUtils.updateUser(account.getKeycloakId(), updateRequest);
        } catch (Exception e) {
            logger.error("Failed to update user in Keycloak for account {}: {}", accountId, e.getMessage());
            throw new RuntimeException("Failed to update user in Keycloak: " + e.getMessage(), e);
        }

        // Update all fields
        if (updateRequest.getFirstName() != null) {
            account.setFirstName(updateRequest.getFirstName());
        }
        if (updateRequest.getLastName() != null) {
            account.setLastName(updateRequest.getLastName());
        }
        if (updateRequest.getPhoneNumber() != null) {
            account.setPhoneNumber(updateRequest.getPhoneNumber());
        }
        if (updateRequest.getDateOfBirth() != null) {
            account.setDateOfBirth(updateRequest.getDateOfBirth());
        }
        if (updateRequest.getAddress() != null) {
            account.setAddress(updateRequest.getAddress());
        }
        if (updateRequest.getCity() != null) {
            account.setCity(updateRequest.getCity());
        }
        if (updateRequest.getCountry() != null) {
            account.setCountry(updateRequest.getCountry());
        }
        if (updateRequest.getPostalCode() != null) {
            account.setPostalCode(updateRequest.getPostalCode());
        }

        return accountRepository.save(account);
    }

    // Delete user
    @Override
    @Transactional
    public void deleteUser(Long accountId) throws DataNotFoundException {
        Account account = getAccountById(accountId);

        try {
            keycloakUtils.deleteUser(account.getKeycloakId());
        } catch (Exception e) {
            logger.error("Failed to delete user in Keycloak for account {}: {}", accountId, e.getMessage());
            throw new RuntimeException("Failed to delete user in Keycloak: " + e.getMessage(), e);
        }

        accountRepository.delete(account);
    }

    // Block/enable user
    @Override
    @Transactional
    public void blockOrEnableUser(Long accountId, boolean block) throws DataNotFoundException {
        Account account = getAccountById(accountId);
        boolean isEnabled = !block;

        // Debug logging to check the keycloakId
        logger.info("Blocking/enabling user - Account ID: {}, Keycloak ID: '{}', Block: {}, Enabled: {}",
                accountId, account.getKeycloakId(), block, isEnabled);

        // Validate keycloakId before calling Keycloak
        if (account.getKeycloakId() == null || account.getKeycloakId().trim().isEmpty()) {
            logger.error("Account {} has no Keycloak ID, cannot block/enable user", accountId);
            throw new RuntimeException("Account has no Keycloak ID: " + accountId);
        }

        // Step 1: Block/enable user in Keycloak
        try {
            keycloakUtils.setUserEnabled(account.getKeycloakId(), isEnabled);
        } catch (Exception e) {
            logger.error("Failed to update user enabled status in Keycloak for account {}: {}", accountId,
                    e.getMessage());
            throw new RuntimeException("Failed to update user in Keycloak: " + e.getMessage(), e);
        }

        account.setIsActive(isEnabled);
        accountRepository.save(account);

        logger.info("Successfully updated user enabled status - Account ID: {}, Enabled: {}", accountId, isEnabled);
    }

    @Override
    public Account getAccountById(Long accountId) throws DataNotFoundException {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new DataNotFoundException("Account not found with id: " + accountId));
    }

    @Override
    public Optional<Account> getAccountByKeycloakId(String keycloakId) {
        return accountRepository.findByKeycloakId(keycloakId);
    }

    @Override
    public Optional<Account> getAccountByUsername(String username) {
        return accountRepository.findByUsername(username);
    }

    @Override
    public Page<Account> findAll(String keyword, Pageable pageable) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return accountRepository.findAll(pageable);
        }
        return accountRepository.findByKeyword(keyword, pageable);
    }

    @Override
    public boolean checkUserExists(String email) {
        return accountRepository.existsByEmail(email);
    }

    @Override
    public boolean checkUserExistsByUsername(String username) {
        return accountRepository.existsByUsername(username);
    }

    @Override
    @Transactional
    public Account createAccountFromKeycloakUser(String keycloakId, UserRepresentation userDetails) {
        logger.info("Creating local account from Keycloak user representation: {}", keycloakId);

        Optional<Account> existing = accountRepository.findByKeycloakId(keycloakId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String username = userDetails.getUsername();
        String email = userDetails.getEmail();
        String firstName = userDetails.getFirstName();
        String lastName = userDetails.getLastName();

        String phoneNumber = null;
        LocalDate dateOfBirth = null;
        String address = null;
        String city = null;
        String country = null;
        Integer postalCode = null;
        TypeClient primaryRole = null;

        Map<String, List<String>> attributes = userDetails.getAttributes();
        if (attributes != null) {
            List<String> phoneAttr = attributes.get("phoneNumber");
            if (phoneAttr != null && !phoneAttr.isEmpty()) {
                phoneNumber = phoneAttr.get(0);
            }

            List<String> dobAttr = attributes.get("dateOfBirth");
            if (dobAttr != null && !dobAttr.isEmpty()) {
                dateOfBirth = LocalDate.parse(dobAttr.get(0));
            }
            List<String> addressAttr = attributes.get("address");
            if (addressAttr != null && !addressAttr.isEmpty()) {
                address = addressAttr.get(0);
            }

            List<String> cityAttr = attributes.get("city");
            if (cityAttr != null && !cityAttr.isEmpty()) {
                city = cityAttr.get(0);
            }

            List<String> countryAttr = attributes.get("country");
            if (countryAttr != null && !countryAttr.isEmpty()) {
                country = countryAttr.get(0);
            }

            List<String> postalCodeAttr = attributes.get("postalCode");
            if (postalCodeAttr != null && !postalCodeAttr.isEmpty()) {
                try {
                    postalCode = Integer.parseInt(postalCodeAttr.get(0));
                    // Validate postal code range
                    if (postalCode < 10000 || postalCode > 999999999) {
                        postalCode = null;
                    }
                } catch (NumberFormatException e) {
                    postalCode = null;
                }
            }

            List<String> roleAttr = attributes.get("role");
            if (roleAttr != null && !roleAttr.isEmpty()) {
                primaryRole = TypeClient.valueOf(roleAttr.get(0));
            }
        }

        Account account = Account.builder()
                .keycloakId(keycloakId)
                .username(username != null ? username : email)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .phoneNumber(phoneNumber)
                .dateOfBirth(dateOfBirth)
                .address(address)
                .city(city)
                .country(country)
                .postalCode(postalCode)
                .isActive(true)
                .build();

        if (primaryRole != null) {
            account.addRole(primaryRole);
        }

        return accountRepository.save(account);
    }

    @Override
    public boolean existsByUsername(String username) {
        return accountRepository.findByUsername(username).isPresent();
    }

    @Override
    public boolean existsByEmail(String email) {
        return accountRepository.findByEmail(email).isPresent();
    }

    @Override
    public Optional<Account> authenticateUser(String username, String password) {
        // For now, we'll implement basic authentication
        // In a production system, you'd want proper password hashing
        Optional<Account> accountOpt = accountRepository.findByUsername(username);

        if (accountOpt.isPresent()) {
            Account account = accountOpt.get();
            // For demo purposes, we'll accept any password for active accounts
            // In production, you'd check against hashed passwords
            if (account.getIsActive()) {
                return accountOpt;
            }
        }

        return Optional.empty();
    }

    @Override
    public Account saveAccount(Account account) {
        return accountRepository.save(account);
    }

}