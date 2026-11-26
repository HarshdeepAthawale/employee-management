package in.masti.entity;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Salary structure for an employee, effective from a given date.
 * Net salary is derived: base + allowances - deductions.
 */
@Entity
@Table(name = "salary")
@Schema(description = "Salary structure of an employee, effective from a date")
public class Salary {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "salary_id_generator")
    @SequenceGenerator(name = "salary_id_generator", sequenceName = "salary_id_seq", initialValue = 1, allocationSize = 1)
    @Schema(description = "Unique salary record identifier", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Integer id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    @NotNull(message = "Employee is required")
    @Schema(description = "Employee this salary record belongs to")
    private Employee employee;

    @Column(name = "base_salary", nullable = false, precision = 12, scale = 2)
    @NotNull(message = "Base salary is required")
    @PositiveOrZero(message = "Base salary cannot be negative")
    @Schema(description = "Base salary", example = "75000.00")
    private BigDecimal baseSalary;

    @Column(precision = 12, scale = 2)
    @PositiveOrZero(message = "Allowances cannot be negative")
    @Schema(description = "Allowances", example = "5000.00")
    private BigDecimal allowances = BigDecimal.ZERO;

    @Column(precision = 12, scale = 2)
    @PositiveOrZero(message = "Deductions cannot be negative")
    @Schema(description = "Deductions", example = "3000.00")
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(name = "effective_date", nullable = false)
    @NotNull(message = "Effective date is required")
    @Schema(description = "Date from which this salary applies", example = "2026-01-01", type = "string", format = "date")
    private LocalDate effectiveDate;

    public Salary() {
    }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }

    public BigDecimal getAllowances() { return allowances; }
    public void setAllowances(BigDecimal allowances) { this.allowances = allowances; }

    public BigDecimal getDeductions() { return deductions; }
    public void setDeductions(BigDecimal deductions) { this.deductions = deductions; }

    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }

    /**
     * Net salary = base + allowances - deductions.
     * Derived value — not persisted.
     */
    @Schema(description = "Net salary (base + allowances - deductions)", example = "77000.00", accessMode = Schema.AccessMode.READ_ONLY)
    public BigDecimal getNetSalary() {
        BigDecimal base = baseSalary == null ? BigDecimal.ZERO : baseSalary;
        BigDecimal allow = allowances == null ? BigDecimal.ZERO : allowances;
        BigDecimal ded = deductions == null ? BigDecimal.ZERO : deductions;
        return base.add(allow).subtract(ded);
    }

    @Override
    public String toString() {
        return "Salary{id=" + id + ", base=" + baseSalary + ", net=" + getNetSalary() + ", effective=" + effectiveDate + '}';
    }
}
