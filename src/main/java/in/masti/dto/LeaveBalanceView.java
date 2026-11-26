package in.masti.dto;

import in.masti.entity.LeaveType;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * View of an employee's leave balance for one leave type in a given year.
 */
@Schema(description = "Leave balance for one leave type")
public record LeaveBalanceView(
        @Schema(description = "Leave type", example = "CASUAL")
        LeaveType leaveType,

        @Schema(description = "Year", example = "2026")
        int year,

        @Schema(description = "Total days granted", example = "12")
        double totalDays,

        @Schema(description = "Days used so far", example = "4")
        double usedDays,

        @Schema(description = "Days remaining", example = "8")
        double remainingDays,

        @Schema(description = "True when the leave type has no yearly cap (UNPAID)", example = "false")
        boolean unlimited
) {
}
