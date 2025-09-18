package org.vgu.backend.service.customer;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.vgu.backend.dto.request.AccountCreateRequest;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.dto.request.CustomerUpdateRequest;
import org.vgu.backend.dto.response.CustomerResponse;
import org.vgu.backend.enums.TypeClient;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Customer;
import org.vgu.backend.repository.AccountRepository;
import org.vgu.backend.repository.CustomerRepository;
import org.vgu.backend.service.account.IAccountService;
import org.vgu.backend.utils.KeycloakUtils;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomerService implements ICustomerService {

    private final CustomerRepository customerRepository;
    private final IAccountService accountService;
    private final AccountRepository accountRepository;
    private final KeycloakUtils keycloakUtils;
    private final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    @Override
    @Transactional
    public CustomerResponse createCustomer(CustomerCreateRequest request) throws Exception {

        String keycloakId = keycloakUtils.createCustomer(request);
        logger.info("Customer created successfully in Keycloak with ID: {}", keycloakId);

        AccountCreateRequest accountRequest = AccountCreateRequest.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(request.getPassword())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .primaryRole(TypeClient.CUSTOMER)
                .address(request.getAddress())
                .city(request.getCity())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .isActive(true)
                .build();

        Account newAccount = accountService.createAccountFromKeycloak(keycloakId, accountRequest);

        // Generate customer code if not provided
        String customerCode = request.getCustomerCode();
        if (customerCode == null || customerCode.trim().isEmpty()) {
            customerCode = generateCustomerCode();
        }

        Customer customer = Customer.builder()
                .account(newAccount)
                .customerCode(customerCode)
                .companyName(request.getCompanyName())
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        return CustomerResponse.fromEntity(savedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse createCustomerFromRegistration(CustomerCreateRequest request, String keycloakId)
            throws Exception {
        // Find or create the account for the Keycloak user
        Optional<Account> accountOpt = accountService.getAccountByKeycloakId(keycloakId);
        Account account;

        if (accountOpt.isEmpty()) {
            // Create local account from the registration request
            account = Account.builder()
                    .keycloakId(keycloakId)
                    .username(request.getUsername())
                    .email(request.getEmail())
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .phoneNumber(request.getPhoneNumber())
                    .dateOfBirth(request.getDateOfBirth())
                    .isActive(true)
                    .build();

            // Add the customer role using a mutable set
            account.addRole(TypeClient.CUSTOMER);
            account = accountRepository.save(account);
        } else {
            account = accountOpt.get();
        }

        // Generate customer code for public registration
        String customerCode = generateCustomerCode();

        // Create customer profile
        // Update account with address-related fields from request (if provided)
        if (request.getAddress() != null) {
            account.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            account.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            account.setCountry(request.getCountry());
        }
        if (request.getPostalCode() != null) {
            account.setPostalCode(request.getPostalCode());
        }
        // Ensure account is active for registration
        account.setIsActive(true);
        account = accountRepository.save(account);

        // Create customer profile (address fields are managed on Account)
        Customer customer = Customer.builder()
                .account(account)
                .customerCode(customerCode)
                .companyName(request.getCompanyName())
                .build();

        Customer savedCustomer = customerRepository.save(customer);

        return CustomerResponse.fromEntity(savedCustomer);
    }

    @Override
    @Transactional
    public CustomerResponse updateCustomer(Long customerId, CustomerUpdateRequest request)
            throws DataNotFoundException {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new DataNotFoundException("Customer not found with id: " + customerId));

        // Update customer fields (only companyName is stored on Customer)
        if (request.getCompanyName() != null) {
            customer.setCompanyName(request.getCompanyName());
        }

        // Update account fields if provided
        Account account = customer.getAccount();
        if (request.getAddress() != null) {
            account.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            account.setCity(request.getCity());
        }
        if (request.getCountry() != null) {
            account.setCountry(request.getCountry());
        }
        if (request.getPostalCode() != null) {
            account.setPostalCode(request.getPostalCode());
        }
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

        // Save the updated account first
        accountRepository.save(account);

        Customer updatedCustomer = customerRepository.save(customer);
        return CustomerResponse.fromEntity(updatedCustomer);
    }

    @Override
    public CustomerResponse getCustomerById(Long customerId) throws DataNotFoundException {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new DataNotFoundException("Customer not found with id: " + customerId));
        return CustomerResponse.fromEntity(customer);
    }

    @Override
    public Page<CustomerResponse> listAllCustomers(String keyword, Pageable pageable) {
        Page<Customer> customers;

        if (keyword != null && !keyword.trim().isEmpty()) {
            logger.info("Searching customers with keyword: {}", keyword);
            customers = customerRepository.findByKeyword(keyword.trim(), pageable);
        } else {
            customers = customerRepository.findAll(pageable);
        }

        return customers.map(CustomerResponse::fromEntity);
    }

    @Override
    @Transactional
    public void deleteCustomer(Long customerId) throws DataNotFoundException {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new DataNotFoundException("Customer not found with id: " + customerId));
        // Instead of deleting, block the associated account (deactivation handled at
        // account level)
        accountService.blockOrEnableUser(customer.getAccount().getId(), true);
    }

    /**
     * Generates a unique customer code
     * Format: CUST-YYYYMMDD-HHMMSS-XXX where XXX is a random 3-digit number
     */
    private String generateCustomerCode() {
        LocalDateTime now = LocalDateTime.now();
        String timestamp = now.format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        int randomSuffix = (int) (Math.random() * 1000);
        String customerCode = String.format("CUST-%s-%03d", timestamp, randomSuffix);

        // Check if code already exists and regenerate if necessary
        while (customerRepository.findByCustomerCode(customerCode).isPresent()) {
            randomSuffix = (int) (Math.random() * 1000);
            customerCode = String.format("CUST-%s-%03d", timestamp, randomSuffix);
        }

        return customerCode;
    }

    @Transactional
    @Override
    public Customer createCustomerFromKeycloak(String keycloakId, CustomerCreateRequest createRequest) {
        logger.info("Creating local account for existing Keycloak user: {}", createRequest.getUsername());

        // Create the Account first
        Account account = Account.builder()
                .keycloakId(keycloakId)
                .username(createRequest.getUsername())
                .email(createRequest.getEmail())
                .firstName(createRequest.getFirstName())
                .lastName(createRequest.getLastName())
                .phoneNumber(createRequest.getPhoneNumber())
                .dateOfBirth(createRequest.getDateOfBirth())
                .isActive(true)
                .build();

        // Add the customer role using a mutable set
        account.addRole(TypeClient.CUSTOMER);
        account = accountRepository.save(account);

        // Update account with address fields from Keycloak payload (if any)
        if (createRequest.getAddress() != null)
            account.setAddress(createRequest.getAddress());
        if (createRequest.getCity() != null)
            account.setCity(createRequest.getCity());
        if (createRequest.getCountry() != null)
            account.setCountry(createRequest.getCountry());
        if (createRequest.getPostalCode() != null)
            account.setPostalCode(createRequest.getPostalCode());
        account = accountRepository.save(account);

        // Create the Customer with the Account (Customer holds companyName and code)
        Customer customer = Customer.builder()
                .account(account)
                .customerCode(generateCustomerCode())
                .companyName(createRequest.getCompanyName())
                .build();

        return customerRepository.save(customer);
    }

    @Override
    public Customer getCustomerByAccountId(Long accountId) {
        return customerRepository.findByAccountId(accountId)
                .orElseThrow(() -> new DataNotFoundException("Customer not found with account id: " + accountId));
    }

}