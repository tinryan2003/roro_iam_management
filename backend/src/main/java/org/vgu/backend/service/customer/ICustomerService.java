package org.vgu.backend.service.customer;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.vgu.backend.dto.request.CustomerCreateRequest;
import org.vgu.backend.dto.request.CustomerUpdateRequest;
import org.vgu.backend.dto.response.CustomerResponse;
import org.vgu.backend.exception.DataNotFoundException;
import org.vgu.backend.model.Customer;

import jakarta.validation.Valid;

public interface ICustomerService {
    CustomerResponse createCustomer(@Valid CustomerCreateRequest request) throws Exception;

    CustomerResponse createCustomerFromRegistration(@Valid CustomerCreateRequest request, String keycloakId)
            throws Exception;

    CustomerResponse updateCustomer(Long customerId, @Valid CustomerUpdateRequest request) throws DataNotFoundException;

    CustomerResponse getCustomerById(Long customerId) throws DataNotFoundException;

    Page<CustomerResponse> listAllCustomers(String keyword, Pageable pageable);

    void deleteCustomer(Long customerId) throws DataNotFoundException;

    Customer createCustomerFromKeycloak(String keycloakId, CustomerCreateRequest createRequest);

    Customer getCustomerByAccountId(Long accountId);
}