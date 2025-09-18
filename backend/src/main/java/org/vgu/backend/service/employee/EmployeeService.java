package org.vgu.backend.service.employee;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.EmployeeCreateRequest;
import org.vgu.backend.dto.request.EmployeeUpdateRequest;
import org.vgu.backend.dto.response.EmployeeResponse;
import org.vgu.backend.enums.TypeClient;
import org.vgu.backend.enums.TypePosition;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Employee;
import org.vgu.backend.repository.AccountRepository;
import org.vgu.backend.repository.EmployeeRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.utils.KeycloakUtils;

import java.util.Optional;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService implements IEmployeeService {

    private final EmployeeRepository employeeRepository;
    private final AccountRepository accountRepository;
    private final IAccountService accountService;
    private final KeycloakUtils keycloakUtils;

    private final Logger logger = LoggerFactory.getLogger(EmployeeService.class);

    @Override
    @Transactional
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) throws Exception {
        logger.info("Creating employee: {}", request.getUsername());

        // Validate employee code
        if (request.getEmployeeCode() == null || request.getEmployeeCode().trim().isEmpty()) {
            throw new RuntimeException("Employee code is required");
        }

        // Check if employee code already exists
        if (employeeRepository.findByEmployeeCode(request.getEmployeeCode()).isPresent()) {
            throw new RuntimeException("Employee code '" + request.getEmployeeCode()
                    + "' already exists. Please choose a different employee code.");
        }

        // Check if email already exists for the EMPLOYEE role
        Optional<Account> existingAccount = accountRepository.findByEmailAndPrimaryRole(
                request.getEmail(),
                TypeClient.EMPLOYEE);

        if (existingAccount.isPresent()) {
            throw new RuntimeException("Email '" + request.getEmail() +
                    "' already exists for role EMPLOYEE. Please use a different email or check if you already have an employee account.");
        }

        String keycloakId = keycloakUtils.createEmployee(request);
        logger.info("User created successfully in Keycloak with ID: {}", keycloakId);

        AccountCreateRequest accountRequest = AccountCreateRequest.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .primaryRole(TypeClient.EMPLOYEE)
                .build();

        Account newAccount = accountService.createAccountFromKeycloak(keycloakId, accountRequest);

        Employee employee = Employee.builder()
                .employeeCode(request.getEmployeeCode())
                .account(newAccount)
                .position(request.getPosition())
                .hireDate(request.getHireDate())
                .salary(request.getSalary())
                .isActive(true)
                .build();

        Employee savedEmployee = employeeRepository.save(employee);

        logger.info("Employee created successfully: {}", savedEmployee.getEmployeeCode());
        return EmployeeResponse.fromEntity(savedEmployee);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long employeeId, EmployeeUpdateRequest request)
            throws DataNotFoundException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new DataNotFoundException("Employee not found with id: " + employeeId));

        logger.info("Updating employee: {}", employee.getEmployeeCode());

        Account account = employee.getAccount();

        if (request.getFirstName() != null) {
            account.setFirstName(request.getFirstName());

        }

        if (request.getLastName() != null) {
            account.setLastName(request.getLastName());

        }

        if (request.getPhoneNumber() != null) {
            account.setPhoneNumber(request.getPhoneNumber());

        }

        if (request.getDateOfBirth() != null) {
            account.setDateOfBirth(request.getDateOfBirth());

        }

        // Update employee-specific fields if provided
        // EmployeeUpdateRequest doesn't carry employeeCode; skip updating it

        if (request.getPosition() != null) {

            TypePosition newPosition = request.getPosition();
            employee.setPosition(newPosition);

            // If position changed, update role in Keycloak (TODO: implement role mapping)
            // if (!oldPosition.equals(newPosition)) {
            // keycloakUtils.updateUserRole(employee.getAccount().getKeycloakId(),
            // newPosition);
            // }
        }

        // EmployeeUpdateRequest doesn't include hireDate; no-op

        if (request.getSalary() != null) {
            employee.setSalary(request.getSalary());
        }

        Employee updatedEmployee = employeeRepository.save(employee);
        logger.info("Employee updated successfully: {}", updatedEmployee.getEmployeeCode());
        return EmployeeResponse.fromEntity(updatedEmployee);
    }

    @Override
    public EmployeeResponse getEmployeeById(Long employeeId) throws DataNotFoundException {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new DataNotFoundException("Employee not found with id: " + employeeId));
        return EmployeeResponse.fromEntity(employee);
    }

    @Override
    public Page<EmployeeResponse> listAllEmployees(String keyword, Pageable pageable) {
        logger.info("Listing all employees");
        Page<Employee> employees;

        if (keyword != null && !keyword.trim().isEmpty()) {
            employees = employeeRepository.findAll(pageable); // Fallback for now
        } else {
            employees = employeeRepository.findAll(pageable);
        }
        logger.info("Employees listed successfully");
        return employees.map(EmployeeResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteEmployee(Long employeeId) throws DataNotFoundException {
        logger.info("Deleting employee: {}", employeeId);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new DataNotFoundException("Employee not found with id: " + employeeId));

        logger.info("Deactivating employee: {}", employee.getEmployeeCode());
        employee.setIsActive(false);
        employeeRepository.save(employee);
        logger.info("Employee deactivated successfully: {}", employee.getEmployeeCode());
        accountService.blockOrEnableUser(employee.getAccount().getId(), true); // true = block
    }

    @Override
    @Transactional
    public void reactivateEmployee(Long employeeId) throws DataNotFoundException {
        logger.info("Reactivating employee: {}", employeeId);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new DataNotFoundException("Employee not found with id: " + employeeId));

        // First, reactivate the employee
        employee.setIsActive(true);
        employeeRepository.save(employee);

        logger.info("Employee reactivated successfully: {}", employee.getEmployeeCode());
        accountService.blockOrEnableUser(employee.getAccount().getId(), false); // false = unblock
    }

    @Override
    @Transactional
    public void blockOrEnableEmployee(Long employeeId, boolean block) throws DataNotFoundException {
        logger.info("Updating employee active status: id={}, block={}", employeeId, block);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new DataNotFoundException("Employee not found with id: " + employeeId));

        // Sync local employee status
        employee.setIsActive(!block);
        employeeRepository.save(employee);

        // Propagate to account/Keycloak
        accountService.blockOrEnableUser(employee.getAccount().getId(), block);
        logger.info("Employee status updated and propagated. code={}, isActive={}",
                employee.getEmployeeCode(), employee.getIsActive());
    }

    @Override
    public List<EmployeeResponse> getEmployeesByPosition(TypePosition position) {
        logger.info("Getting employees by position: {}", position);
        List<Employee> employees = employeeRepository.findByPosition(position.name());
        logger.info("Employees found: {}", employees.size());
        return employees.stream()
                .map(EmployeeResponse::fromEntity)
                .collect(Collectors.toList());
    }

}