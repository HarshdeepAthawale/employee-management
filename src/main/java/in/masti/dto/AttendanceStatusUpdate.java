package in.masti.dto;

import in.masti.entity.AttendanceStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

/**
 * Request body for changing the status of an attendance record
 * (e.g. marking it ABSENT or HALF_DAY).
 */
@Schema(description = "Attendance status update payload")
public record AttendanceStatusUpdate(
        @NotNull(message = "Status is required")
        @Schema(description = "New attendance status", example = "ABSENT", required = true)
        AttendanceStatus status
) {
}
