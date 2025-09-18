package org.vgu.backend.controllers;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.FerryCreateRequest;
import org.vgu.backend.dto.request.FerryUpdateRequest;
import org.vgu.backend.dto.response.FerryResponse;
import org.vgu.backend.service.ferry.IFerryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/ferries")
@RequiredArgsConstructor
@Slf4j
public class FerryController {

    private final IFerryService ferryService;

    /**
     * Get all ferries with pagination
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_OPERATOR', 'ROLE_CUSTOMER')")
    public ResponseEntity<Page<FerryResponse>> getAllFerries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        log.info("Getting all ferries with pagination: page={}, limit={}", page, limit);
        Pageable pageable = PageRequest.of(page, limit, Sort.by("createdAt").descending());
        Page<FerryResponse> ferries = ferryService.getAllFerries(pageable);
        log.info("Ferries listed successfully");
        return ResponseEntity.ok(ferries);
    }

    /**
     * Get ferry by ID
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_OPERATOR')")
    public ResponseEntity<FerryResponse> getFerryById(@PathVariable Long id) {
        log.info("Getting ferry by ID: {}", id);
        FerryResponse ferry = ferryService.getFerryById(id);
        log.info("Ferry retrieved successfully");
        return ResponseEntity.ok(ferry);
    }

    /**
     * Get ferry by code
     */
    @GetMapping("/code/{ferryCode}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT', 'ROLE_OPERATOR')")
    public ResponseEntity<FerryResponse> getFerryByCode(@PathVariable String ferryCode) {
        log.info("Getting ferry by code: {}", ferryCode);
        FerryResponse ferry = ferryService.getFerryByCode(ferryCode);
        log.info("Ferry retrieved successfully");
        return ResponseEntity.ok(ferry);
    }

    /**
     * Create new ferry
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> createFerry(@Valid @RequestBody FerryCreateRequest request) {
        try {
            log.info("Creating new ferry: {}", request);
            FerryResponse ferry = ferryService.createFerry(request);
            log.info("Ferry created successfully with ID: {}", ferry.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(ferry);
        } catch (Exception e) {
            log.error("Error creating ferry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to create ferry: " + e.getMessage()));
        }
    }

    /**
     * Update ferry
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> updateFerry(@PathVariable Long id, @Valid @RequestBody FerryUpdateRequest request) {
        try {
            log.info("Updating ferry with ID: {}", id);
            FerryResponse ferry = ferryService.updateFerry(id, request);
            log.info("Ferry updated successfully with ID: {}", ferry.getId());
            return ResponseEntity.ok(ferry);
        } catch (Exception e) {
            log.error("Error updating ferry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to update ferry: " + e.getMessage()));
        }
    }

    /**
     * Delete ferry
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_ACCOUNTANT')")
    public ResponseEntity<?> deleteFerry(@PathVariable Long id) {
        try {
            log.info("Deleting ferry with ID: {}", id);
            ferryService.deleteFerry(id);
            log.info("Ferry deleted successfully with ID: {}", id);
            return ResponseEntity.ok(Map.of("message", "Ferry deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting ferry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Failed to delete ferry: " + e.getMessage()));
        }
    }
}