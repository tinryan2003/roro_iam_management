package org.vgu.backend.dto.request;

import java.time.LocalDate;

import org.vgu.backend.annotations.Over_18.Over18;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountUpdateRequest {
    private String firstName;

    private String lastName;

    private String phoneNumber;

    @Over18
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    private String address;

    private String city;

    private String country;

    @Min(value = 10000, message = "Postal code must be at least 5 digits")
    @Max(value = 999999999, message = "Postal code must be at most 9 digits")
    private Integer postalCode;
}
