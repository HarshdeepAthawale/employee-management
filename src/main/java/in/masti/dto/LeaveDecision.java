package in.masti.dto;

import in.masti.entity.LeaveStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for approving or rejecting a leave request.
 */
@Schema(description = "Leave decision payload (APPROVED or REJECTED)")
public record LeaveDecision(
        @NotNull(message = "Status is required")
        @Schema(description = "Decision to apply — must be APPROVED or REJECTED", example = "APPROVED", required = true)
        LeaveStatus status
) {
}
