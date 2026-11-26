package in.masti.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * A leave request raised by an employee, with an approval flow
 * (PENDING -> APPROVED / REJECTED).
 */
@Entity
@Table(name = "leave_request")
@Schema(description = "Leave request raised by an employee")
public class LeaveRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "leave_id_generator")
    @SequenceGenerator(name = "leave_id_generator", sequenceName = "leave_id_seq", initialValue = 1, allocationSize = 1)
    @Schema(description = "Unique leave request identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    @Schema(description = "Employee requesting the leave")
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", length = 20, nullable = false)
    @NotNull(message = "Leave type is required")
    @Schema(description = "Type of leave", example = "CASUAL")
    private LeaveType leaveType;

    @Column(name = "start_date", nullable = false)
    @NotNull(message = "Start date is required")
    @Schema(description = "First day of leave (inclusive)", example = "2026-12-01", type = "string", format = "date")
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    @NotNull(message = "End date is required")
    @Schema(description = "Last day of leave (inclusive)", example = "2026-12-03", type = "string", format = "date")
    private LocalDate endDate;

    @Column(length = 500)
    @Size(max = 500, message = "Reason cannot exceed 500 characters")
    @Schema(description = "Reason for the leave", example = "Family function", maxLength = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Schema(description = "Approval status of the request", example = "PENDING")
    private LeaveStatus status = LeaveStatus.PENDING;

    @Column(name = "applied_at", nullable = false)
    @Schema(description = "When the request was raised", example = "2026-11-27T10:30:00", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime appliedAt = LocalDateTime.now();

    @Column(name = "decided_at")
    @Schema(description = "When the request was approved/rejected", example = "2026-11-27T11:00:00", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime decidedAt;

    public LeaveRequest() {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public LeaveStatus getStatus() { return status; }
    public void setStatus(LeaveStatus status) { this.status = status; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public LocalDateTime getDecidedAt() { return decidedAt; }
    public void setDecidedAt(LocalDateTime decidedAt) { this.decidedAt = decidedAt; }

    /**
     * Number of leave days covered by this request (inclusive of both dates).
     * Derived value — not persisted.
     */
    @Schema(description = "Number of leave days (inclusive of start and end date)", example = "3", accessMode = Schema.AccessMode.READ_ONLY)
    public long getDays() {
        if (startDate == null || endDate == null) return 0;
        return ChronoUnit.DAYS.between(startDate, endDate) + 1;
    }

    @Override
    public String toString() {
        return "LeaveRequest{id=" + id + ", leaveType=" + leaveType + ", status=" + status + '}';
    }
}
