package org.vgu.backend.controllers;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.AccountUpdateRequest;
import org.vgu.backend.dto.response.AccountResponse;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.service.account.IAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final Logger logger = LoggerFactory.getLogger(AccountController.class);
    private final IAccountService accountService;

    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<Page<AccountResponse>> getAllAccounts(
            @RequestParam(defaultValue = "", required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {

        logger.info("Getting all accounts");
        Pageable pageable = PageRequest.of(page, limit, Sort.by("id").ascending());
        Page<AccountResponse> accountPage = accountService.findAll(keyword, pageable).map(AccountResponse::fromAccount);
        logger.info("Accounts listed successfully");
        return ResponseEntity.ok(accountPage);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_OPERATION_MANAGER')")
    public ResponseEntity<?> getAccountById(@PathVariable Long id) {
        try {
            logger.info("Getting account by id: {}", id);
            Account account = accountService.getAccountById(id);
            return ResponseEntity.ok(AccountResponse.fromAccount(account));
        } catch (DataNotFoundException e) {
            logger.error("Account not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateAccount(@PathVariable Long id,
            @Valid @RequestBody AccountUpdateRequest updateRequest) {
        try {
            logger.info("Updating account: {}", id);
            Account updatedAccount = accountService.updateUser(id, updateRequest);
            return ResponseEntity.ok(AccountResponse.fromAccount(updatedAccount));
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating account {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> blockOrEnableUser(@PathVariable Long id, @RequestParam boolean block) {
        try {
            logger.info("Blocking or enabling account: {}", id);
            accountService.blockOrEnableUser(id, block);
            String action = block ? "blocked" : "unblocked";
            logger.info("Account successfully {}", action);
            return ResponseEntity.ok(Map.of("message", "Account successfully " + action));
        } catch (DataNotFoundException e) {
            logger.error("Account not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteAccount(@PathVariable Long id) {
        try {
            logger.info("Deleting account: {}", id);
            accountService.deleteUser(id);
            logger.info("Account deleted successfully: {}", id);
            return ResponseEntity.noContent().build();
        } catch (DataNotFoundException e) {
            logger.error("Account not found: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check-username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(@PathVariable String username) {
        logger.info("Checking if username exists: {}", username);
        boolean exists = accountService.getAccountByUsername(username).isPresent();
        logger.info("Username exists: {}", exists);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
