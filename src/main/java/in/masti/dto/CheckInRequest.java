package in.masti.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

/**
 * Request body for marking an employee's check-in.
 * If date is null, today's date is used.
 */
@Schema(description = "Check-in request payload")
public record CheckInRequest(
        @Schema(description = "Employee ID to check in", example = "101", required = true)
        Integer employeeId,

        @Schema(description = "Attendance date (defaults to today when omitted)", example = "2026-11-27", type = "string", format = "date")
        LocalDate date
) {
}
