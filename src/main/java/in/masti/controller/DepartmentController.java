package in.masti.controller;

import in.masti.constants.RouteConstants;
import in.masti.entity.Department;
import in.masti.service.DepartmentService;
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
@RequestMapping(RouteConstants.DEPARTMENT_BASE)
public class DepartmentController {

    private static final Logger logger = LoggerFactory.getLogger(DepartmentController.class);

    private final DepartmentService departmentService;

    @Autowired
    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @PostMapping
    public ResponseEntity<Department> create(@Valid @RequestBody Department department) {
        logger.info("Creating department: {}", department.getName());
        try {
            Department created = departmentService.create(department);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    @GetMapping(RouteConstants.DEPARTMENT_GET_BY_ID)
    public ResponseEntity<Department> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(departmentService.getById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping(RouteConstants.DEPARTMENT_UPDATE)
    public ResponseEntity<Department> update(@PathVariable Integer id, @Valid @RequestBody Department department) {
        try {
            return ResponseEntity.ok(departmentService.update(id, department));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping(RouteConstants.DEPARTMENT_DELETE)
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            departmentService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
    }

    @GetMapping(RouteConstants.DEPARTMENT_EMPLOYEE_COUNT)
    public ResponseEntity<Long> countEmployees(@PathVariable Integer id) {
        try {
            departmentService.getById(id);
            return ResponseEntity.ok(departmentService.countEmployees(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
