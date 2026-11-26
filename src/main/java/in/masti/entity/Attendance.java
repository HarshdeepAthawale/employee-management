package in.masti.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Daily attendance record for an employee (check-in / check-out).
 */
@Entity
@Table(name = "attendance")
@Schema(description = "Daily attendance record for an employee")
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "att_id_generator")
    @SequenceGenerator(name = "att_id_generator", sequenceName = "att_id_seq", initialValue = 1, allocationSize = 1)
    @Schema(description = "Unique attendance record identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    @Schema(description = "Employee this attendance record belongs to")
    private Employee employee;

    @Column(name = "att_date", nullable = false)
    @NotNull(message = "Date is required")
    @Schema(description = "Attendance date", example = "2026-11-27", type = "string", format = "date")
    private LocalDate date;

    @Column(name = "check_in")
    @Schema(description = "Check-in time", example = "09:05:00", type = "string", format = "time")
    private LocalTime checkIn;

    @Column(name = "check_out")
    @Schema(description = "Check-out time", example = "18:10:00", type = "string", format = "time")
    private LocalTime checkOut;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Schema(description = "Attendance status", example = "PRESENT")
    private AttendanceStatus status = AttendanceStatus.PRESENT;

    public Attendance() {
    }

    public Attendance(Employee employee, LocalDate date, LocalTime checkIn) {
        this.employee = employee;
        this.date = date;
        this.checkIn = checkIn;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public LocalTime getCheckIn() { return checkIn; }
    public void setCheckIn(LocalTime checkIn) { this.checkIn = checkIn; }

    public LocalTime getCheckOut() { return checkOut; }
    public void setCheckOut(LocalTime checkOut) { this.checkOut = checkOut; }

    public AttendanceStatus getStatus() { return status; }
    public void setStatus(AttendanceStatus status) { this.status = status; }

    /**
     * Worked minutes between check-in and check-out.
     * Derived value — not persisted. Null when not checked out yet.
     */
    @Schema(description = "Worked minutes between check-in and check-out (null until checked out)", example = "485", accessMode = Schema.AccessMode.READ_ONLY)
    public Long getWorkedMinutes() {
        if (checkIn == null || checkOut == null) return null;
        return Duration.between(checkIn, checkOut).toMinutes();
    }

    @Override
    public String toString() {
        return "Attendance{id=" + id + ", date=" + date + ", status=" + status + '}';
    }
}
