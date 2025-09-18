package org.vgu.backend.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewApprovalRequest {

    @Size(max = 1000, message = "Review notes cannot exceed 1000 characters")
    private String notes;
}
