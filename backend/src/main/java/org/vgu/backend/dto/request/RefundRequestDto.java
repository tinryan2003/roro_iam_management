package org.vgu.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundRequestDto {

    @NotBlank(message = "Refund reason is required")
    @Size(min = 10, max = 1000, message = "Refund reason must be between 10 and 1000 characters")
    private String reason;
}
