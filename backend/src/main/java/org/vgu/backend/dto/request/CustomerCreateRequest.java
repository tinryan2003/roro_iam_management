package org.vgu.backend.dto.request;

import java.time.LocalDate;
import java.util.Set;

import org.vgu.backend.annotations.Over_18.Over18;
import org.vgu.backend.enums.TypeClient;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreateRequest {

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

    // Role should be optional for public registration - will default to CUSTOMER
    private Set<TypeClient> roles;

    @Pattern(regexp = "^[+]?[0-9\\s\\-\\(\\)]+$", message = "Invalid phone number format")
    private String phoneNumber;

    @Over18
    private LocalDate dateOfBirth;

    private String address;
    private String city;
    private String country;

    @Min(value = 10000, message = "Postal code must be at least 5 digits")
    @Max(value = 999999999, message = "Postal code must be at most 9 digits")
    private Integer postalCode;

    private String customerCode;

    private String companyName;
}