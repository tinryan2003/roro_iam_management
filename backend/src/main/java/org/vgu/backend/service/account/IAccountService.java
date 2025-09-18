package org.vgu.backend.service.account;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.AccountUpdateRequest;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.enums.TypeClient;

import jakarta.validation.Valid;

public interface IAccountService {
        Account createAccountFromKeycloak(String keycloakId, AccountCreateRequest createRequest);

        Account updateUser(Long accountId, @Valid AccountUpdateRequest updateRequest) throws DataNotFoundException;

        void deleteUser(Long accountId) throws DataNotFoundException;

        void blockOrEnableUser(Long accountId, boolean block) throws DataNotFoundException;

        Account getAccountById(Long accountId) throws DataNotFoundException;

        Optional<Account> getAccountByKeycloakId(String keycloakId);

        Optional<Account> getAccountByUsername(String username);

        Page<Account> findAll(String keyword, Pageable pageable);

        boolean checkUserExists(String email);

        boolean checkUserExistsByUsername(String username);

        Account createAccountFromKeycloakUser(String keycloakId,
                        org.keycloak.representations.idm.UserRepresentation userDetails);

        boolean existsByUsername(String username);

        boolean existsByEmail(String email);

        Optional<Account> authenticateUser(String username, String password);

        Account saveAccount(Account account);

}