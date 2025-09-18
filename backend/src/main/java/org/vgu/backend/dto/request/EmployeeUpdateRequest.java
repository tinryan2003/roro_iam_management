package org.vgu.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import org.vgu.backend.annotations.Over_18.Over18;
import org.vgu.backend.enums.TypePosition;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeUpdateRequest {

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

    private TypePosition position;

    @Positive(message = "Salary must be positive")
    private BigDecimal salary;

}
