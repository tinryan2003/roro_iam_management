package org.vgu.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import org.vgu.backend.model.Account;
import org.vgu.backend.model.Customer;

import java.time.LocalDate;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CustomerResponse {
    // Align with frontend "customer" shape
    private Long id; // was customerId
    private String companyName;

    // Optional linkage to account
    private Long accountId;

    // Flattened account fields to match FE
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String phone; // was phoneNumber
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String country;
    private Integer postalCode;
    private boolean isActive;

    // Prefer "fromCustomer" for symmetry
    public static CustomerResponse fromCustomer(Customer customer) {
        if (customer == null)
            return null;

        Account acc = customer.getAccount(); // can be null → guard below
        return CustomerResponse.builder()
                .id(customer.getId())
                .companyName(customer.getCompanyName())
                .accountId(acc != null ? acc.getId() : null)
                .username(acc != null ? acc.getUsername() : null)
                .email(acc != null ? acc.getEmail() : null)
                .firstName(acc != null ? acc.getFirstName() : null)
                .lastName(acc != null ? acc.getLastName() : null)
                .phone(acc != null ? acc.getPhoneNumber() : null)
                .dateOfBirth(acc != null ? acc.getDateOfBirth() : null)
                .address(acc != null ? acc.getAddress() : null)
                .city(acc != null ? acc.getCity() : null)
                .country(acc != null ? acc.getCountry() : null)
                .postalCode(acc != null ? acc.getPostalCode() : null)
                .isActive(acc != null && (acc.getIsActive() != null ? acc.getIsActive() : false))
                .build();
    }

    // Alias method for fromCustomer - used by service layer
    public static CustomerResponse fromEntity(Customer customer) {
        return fromCustomer(customer);
    }
}
