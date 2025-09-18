package org.vgu.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.vgu.backend.model.Customer;
import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RegisterResponse {
    @JsonProperty("message")
    private String message;

    @JsonProperty("user")
    private Customer customer;
}