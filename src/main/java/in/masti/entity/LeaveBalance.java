package in.masti.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

/**
 * Yearly leave balance for an employee per leave type
 * (how many days were granted vs. used).
 */
@Entity
@Table(name = "leave_balance",
        uniqueConstraints = @UniqueConstraint(columnNames = {"employee_id", "balance_year", "leave_type"}))
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "balance_id_generator")
    @SequenceGenerator(name = "balance_id_generator", sequenceName = "balance_id_seq", initialValue = 1, allocationSize = 1)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    private Employee employee;

    @Column(name = "balance_year", nullable = false)
    private int year;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", length = 20, nullable = false)
    private LeaveType leaveType;

    @Column(name = "total_days", nullable = false)
    private double totalDays;

    @Column(name = "used_days", nullable = false)
    private double usedDays = 0;

    public LeaveBalance() {
    }

    public LeaveBalance(Employee employee, int year, LeaveType leaveType, double totalDays) {
        this.employee = employee;
        this.year = year;
        this.leaveType = leaveType;
        this.totalDays = totalDays;
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public double getTotalDays() { return totalDays; }
    public void setTotalDays(double totalDays) { this.totalDays = totalDays; }

    public double getUsedDays() { return usedDays; }
    public void setUsedDays(double usedDays) { this.usedDays = usedDays; }

    /** Derived value — not persisted. */
    public double getRemainingDays() {
        return totalDays - usedDays;
    }

    @Override
    public String toString() {
        return "LeaveBalance{employee=" + (employee != null ? employee.getEmpId() : null)
                + ", year=" + year + ", type=" + leaveType + ", used=" + usedDays + "/" + totalDays + '}';
    }
}
