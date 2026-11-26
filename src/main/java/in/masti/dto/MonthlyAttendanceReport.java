package in.masti.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Aggregated monthly attendance summary for one employee.
 */
@Schema(description = "Monthly attendance summary for an employee")
public record MonthlyAttendanceReport(
        @Schema(description = "Employee ID", example = "101")
        Integer employeeId,

        @Schema(description = "Employee name", example = "Asha Rao")
        String employeeName,

        @Schema(description = "Year", example = "2026")
        int year,

        @Schema(description = "Month (1-12)", example = "11")
        int month,

        @Schema(description = "Number of PRESENT days", example = "20")
        long presentDays,

        @Schema(description = "Number of HALF_DAY days", example = "1")
        long halfDays,

        @Schema(description = "Number of ABSENT days", example = "2")
        long absentDays,

        @Schema(description = "Number of ON_LEAVE days", example = "3")
        long leaveDays,

        @Schema(description = "Total worked hours in the month", example = "152.5")
        double totalHours
) {
}
