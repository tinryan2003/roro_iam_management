package org.vgu.backend.dto.response;

import java.util.List;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Builder
public class BookingResponse {
    private Long id;
    private Long customerId;
    private Long routeId;
    private Long ferryId;
    private List<Long> vehicleId;
    private String bookingCode;
    private Integer passengerCount;
    private Double totalAmount;
    private String departureTime;
    private String status;
    private String createdAt;
    private String updatedAt;
    private String note;

    // Approval-related fields (accessed through booking.getApproval())
    private ApprovalResponse approval;

    // Workflow fields
    private String paymentDeadline;
    private String paidAt;
    private String completedAt;
    private String cancelledAt;
    private String cancellationReason;
    private String cancelledBy;

    // Refund fields
    private Boolean refundRequested;
    private String refundReason;
    private String refundRequestedAt;
    private String refundRequestedBy;
    private String refundProcessedAt;
    private String refundProcessedBy;
    private String refundDecisionNotes;
    private Double refundAmount;
    private String refundNotes;

    // Arrival confirmation
    private String confirmedArrivalBy;
    private String confirmedArrivalAt;

    // Vehicle information
    private List<VehicleResponse> vehicles;
}
