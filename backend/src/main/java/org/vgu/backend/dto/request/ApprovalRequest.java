package org.vgu.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ApprovalRequest {

    @Size(max = 1000, message = "Review notes cannot exceed 1000 characters")
    @JsonProperty("notes") // Accept "notes" from frontend
    private String reviewNotes;
}
