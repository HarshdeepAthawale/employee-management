package in.masti.controller;

import in.masti.constants.RouteConstants;
import in.masti.entity.Salary;
import in.masti.service.SalaryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping(RouteConstants.SALARY_BASE)
@Tag(name = "Salary Management", description = "Salary structures per employee with effective dates and payslip-style net computation")
public class SalaryController {

    private static final Logger logger = LoggerFactory.getLogger(SalaryController.class);

    private final SalaryService salaryService;

    @Autowired
    public SalaryController(SalaryService salaryService) {
        this.salaryService = salaryService;
    }

    @Operation(summary = "Create a salary record", description = "Net salary is derived as base + allowances - deductions.")
    @PostMapping
    public ResponseEntity<Salary> create(@Valid @RequestBody Salary salary) {
        logger.info("Create salary request");
        try {
            Salary created = salaryService.create(salary);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "List all salary records")
    @GetMapping
    public ResponseEntity<List<Salary>> getAll() {
        return ResponseEntity.ok(salaryService.getAll());
    }

    @Operation(summary = "Salary history of an employee")
    @GetMapping(RouteConstants.SALARY_BY_EMPLOYEE)
    public ResponseEntity<List<Salary>> getByEmployee(@PathVariable Integer empId) {
        try {
            return ResponseEntity.ok(salaryService.getByEmployee(empId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Current salary of an employee", description = "The latest salary record whose effective date is today or in the past.")
    @GetMapping(RouteConstants.SALARY_CURRENT)
    public ResponseEntity<Salary> getCurrent(@PathVariable Integer empId) {
        try {
            return ResponseEntity.ok(salaryService.getCurrent(empId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get a salary record by ID")
    @GetMapping(RouteConstants.SALARY_GET_BY_ID)
    public ResponseEntity<Salary> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(salaryService.getById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Update a salary record")
    @PutMapping(RouteConstants.SALARY_GET_BY_ID)
    public ResponseEntity<Salary> update(@PathVariable Integer id, @Valid @RequestBody Salary salary) {
        try {
            return ResponseEntity.ok(salaryService.update(id, salary));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete a salary record")
    @DeleteMapping(RouteConstants.SALARY_GET_BY_ID)
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            salaryService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
