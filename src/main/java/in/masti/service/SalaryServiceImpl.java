package in.masti.service;

import in.masti.entity.Employee;
import in.masti.entity.Salary;
import in.masti.repository.EmployeeRepository;
import in.masti.repository.SalaryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class SalaryServiceImpl implements SalaryService {

    private static final Logger logger = LoggerFactory.getLogger(SalaryServiceImpl.class);

    private final SalaryRepository salaryRepo;
    private final EmployeeRepository employeeRepo;

    @Autowired
    public SalaryServiceImpl(SalaryRepository salaryRepo, EmployeeRepository employeeRepo) {
        this.salaryRepo = salaryRepo;
        this.employeeRepo = employeeRepo;
    }

    @Override
    public Salary create(Salary salary) {
        logger.info("Creating salary record for employee {}",
                salary != null && salary.getEmployee() != null ? salary.getEmployee().getEmpId() : null);
        Employee employee = resolveEmployee(salary);
        validate(salary);
        salary.setEmployee(employee);
        if (salary.getAllowances() == null) salary.setAllowances(BigDecimal.ZERO);
        if (salary.getDeductions() == null) salary.setDeductions(BigDecimal.ZERO);
        if (salary.getEffectiveDate() == null) salary.setEffectiveDate(LocalDate.now());
        return salaryRepo.saveAndFlush(salary);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Salary> getAll() {
        return salaryRepo.findAllByOrderByEffectiveDateDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Salary> getByEmployee(Integer employeeId) {
        employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        return salaryRepo.findByEmployeeEmpIdOrderByEffectiveDateDesc(employeeId);
    }

    @Override
    @Transactional(readOnly = true)
    public Salary getCurrent(Integer employeeId) {
        employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        return salaryRepo
                .findTopByEmployeeEmpIdAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(employeeId, LocalDate.now())
                .orElseThrow(() -> new NoSuchElementException("No salary record effective for employee " + employeeId + " as of today"));
    }

    @Override
    @Transactional(readOnly = true)
    public Salary getById(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Salary ID cannot be null");
        }
        return salaryRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No salary record found for ID: " + id));
    }

    @Override
    public Salary update(Integer id, Salary salary) {
        logger.info("Updating salary record {}", id);
        Salary existing = getById(id);
        validate(salary);
        existing.setBaseSalary(salary.getBaseSalary());
        existing.setAllowances(salary.getAllowances() != null ? salary.getAllowances() : BigDecimal.ZERO);
        existing.setDeductions(salary.getDeductions() != null ? salary.getDeductions() : BigDecimal.ZERO);
        existing.setEffectiveDate(salary.getEffectiveDate() != null ? salary.getEffectiveDate() : existing.getEffectiveDate());
        return salaryRepo.saveAndFlush(existing);
    }

    @Override
    public void delete(Integer id) {
        logger.info("Deleting salary record {}", id);
        salaryRepo.delete(getById(id));
    }

    private Employee resolveEmployee(Salary salary) {
        if (salary == null || salary.getEmployee() == null || salary.getEmployee().getEmpId() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
        return employeeRepo.findById(salary.getEmployee().getEmpId())
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + salary.getEmployee().getEmpId()));
    }

    private void validate(Salary salary) {
        if (salary == null) {
            throw new IllegalArgumentException("Salary data cannot be null");
        }
        if (salary.getBaseSalary() == null) {
            throw new IllegalArgumentException("Base salary is required");
        }
        if (salary.getBaseSalary().signum() < 0) {
            throw new IllegalArgumentException("Base salary cannot be negative");
        }
    }
}
