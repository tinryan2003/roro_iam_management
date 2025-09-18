package org.vgu.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.vgu.backend.model.Account;

import java.time.LocalDate;

@Setter
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AccountResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private LocalDate dateOfBirth;
    private String address;
    private String city;
    private String country;
    private Integer postalCode;
    private Boolean isActive;
    private String username;

    public static AccountResponse fromAccount(Account account) {
        if (account == null)
            return null;

        return AccountResponse.builder()
                .id(account.getId())
                .firstName(account.getFirstName())
                .lastName(account.getLastName())
                .email(account.getEmail())
                .phone(account.getPhoneNumber())
                .dateOfBirth(account.getDateOfBirth())
                .address(account.getAddress())
                .city(account.getCity())
                .country(account.getCountry())
                .postalCode(account.getPostalCode())
                .isActive(account.getIsActive())
                .username(account.getUsername())
                .build();
    }
}
