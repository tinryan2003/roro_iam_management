package org.vgu.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefundDecisionDto {

    @NotNull(message = "Decision is required")
    private Boolean approved;

    @NotBlank(message = "Decision notes are required")
    @Size(min = 5, max = 1000, message = "Decision notes must be between 5 and 1000 characters")
    private String notes;
}
