package org.vgu.backend.controllers;

import java.util.List;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.vgu.backend.dto.request.EmployeeCreateRequest;
import org.vgu.backend.dto.request.EmployeeUpdateRequest;
import org.vgu.backend.dto.response.EmployeeResponse;
import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.service.employee.IEmployeeService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("${api.prefix}/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final IEmployeeService employeeService;
    private final Logger logger = LoggerFactory.getLogger(EmployeeController.class);

    // Create a new employee (saved in database and Keycloak)
    @PostMapping
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        try {
            logger.info("Creating employee: {}", request);
            EmployeeResponse employee = employeeService.createEmployee(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(employee);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String errorMessage = "Data validation error occurred.";

            if (e.getMessage() != null) {
                if (e.getMessage().contains("uk_username")) {
                    errorMessage = "Username '" + request.getUsername()
                            + "' already exists. Please choose a different username.";
                } else if (e.getMessage().contains("uk_email_role")) {
                    errorMessage = "Email '" + request.getEmail()
                            + "' already exists for an employee. Please use a different email.";
                }
            }

            logger.error("Database constraint violation creating employee: {}", errorMessage, e);
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", errorMessage));
        } catch (RuntimeException e) {
            logger.error("Error creating employee: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error creating employee: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "An unexpected error occurred while creating the employee."));
        }
    }

    // Get all employees with pagination
    @GetMapping
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_ACCOUNTANT') or hasRole('ROLE_PLANNER')")
    public ResponseEntity<Page<EmployeeResponse>> getAllEmployees(
            @RequestParam(defaultValue = "", required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit) {
        logger.info("Getting all employees");
        Pageable pageable = PageRequest.of(page, limit, Sort.by("id").ascending());
        Page<EmployeeResponse> employeePage = employeeService.listAllEmployees(keyword, pageable);
        logger.info("Employees listed successfully");
        return ResponseEntity.ok(employeePage);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_ACCOUNTANT') or hasRole('ROLE_PLANNER')")
    public ResponseEntity<?> getEmployeeById(@PathVariable Long id) {
        try {
            logger.info("Getting employee by id: {}", id);
            EmployeeResponse employee = employeeService.getEmployeeById(id);
            return ResponseEntity.ok(employee);
        } catch (DataNotFoundException e) {
            logger.error("Employee not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeUpdateRequest request) {
        try {
            logger.info("Updating employee: {}", id);
            EmployeeResponse employee = employeeService.updateEmployee(id, request);
            return ResponseEntity.ok(employee);
        } catch (DataNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            logger.error("Error updating employee {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        try {
            logger.info("Deleting employee: {}", id);
            employeeService.deleteEmployee(id);
            return ResponseEntity.noContent().build();
        } catch (DataNotFoundException e) {
            logger.error("Employee not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/reactivate")
    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public ResponseEntity<?> reactivateEmployee(@PathVariable Long id) {
        try {
            logger.info("Reactivating employee: {}", id);
            employeeService.reactivateEmployee(id);
            return ResponseEntity.ok(Map.of("message", "Employee successfully reactivated"));
        } catch (DataNotFoundException e) {
            logger.error("Employee not found with id: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-position/{position}")
    @PreAuthorize("hasRole('ROLE_ADMIN') or hasRole('ROLE_ACCOUNTANT') or hasRole('ROLE_PLANNER')")
    public ResponseEntity<List<EmployeeResponse>> getEmployeesByPosition(@PathVariable TypePosition position) {
        logger.info("Getting employees by position: {}", position);
        List<EmployeeResponse> employees = employeeService.getEmployeesByPosition(position);
        logger.info("Employees listed successfully");
        return ResponseEntity.ok(employees);
    }
}