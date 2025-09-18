package org.vgu.backend.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

import org.vgu.backend.annotations.Over_18.Over18;
import org.vgu.backend.enums.TypeClient;
import org.vgu.backend.enums.TypePosition;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeCreateRequest {

    // --- Account fields ---
    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    private String password;

    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-ZÀ-ÿĀ-žА-я\\s\\-'\\.]+$", message = "First name can only contain letters, spaces, hyphens, apostrophes, and periods")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-ZÀ-ÿĀ-žА-я\\s\\-'\\.]+$", message = "Last name can only contain letters, spaces, hyphens, apostrophes, and periods")
    private String lastName;

    @Pattern(regexp = "^[+]?[0-9\\s\\-\\(\\)]+$", message = "Invalid phone number format")
    private String phoneNumber;

    @Over18
    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    private String city;

    @NotBlank(message = "Country is required")
    private String country;

    @NotNull(message = "Postal code is required")
    @Min(value = 10000, message = "Postal code must be at least 5 digits")
    @Max(value = 999999999, message = "Postal code must be at most 9 digits")
    private Integer postalCode;

    @NotNull(message = "Primary role is required")
    private TypeClient primaryRole;

    private Set<TypeClient> roles;

    // --- Employee specific fields ---
    private String employeeCode;

    @NotNull(message = "Position is required")
    private TypePosition position;

    @NotNull(message = "Hire date is required")
    private LocalDate hireDate;

    @Positive(message = "Salary must be positive")
    private BigDecimal salary;

    // Helper method to ensure role defaults to EMPLOYEE
    public TypeClient getRole() {
        return TypeClient.EMPLOYEE;
    }
}