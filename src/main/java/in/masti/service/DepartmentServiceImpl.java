package in.masti.service;

import in.masti.entity.Department;
import in.masti.repository.DepartmentRepository;
import in.masti.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private static final Logger logger = LoggerFactory.getLogger(DepartmentServiceImpl.class);

    private final DepartmentRepository departmentRepo;
    private final EmployeeRepository employeeRepo;

    @Autowired
    public DepartmentServiceImpl(DepartmentRepository departmentRepo, EmployeeRepository employeeRepo) {
        this.departmentRepo = departmentRepo;
        this.employeeRepo = employeeRepo;
    }

    @Override
    public Department create(Department department) {
        logger.info("Creating department: {}", department.getName());
        if (!StringUtils.hasText(department.getName())) {
            throw new IllegalArgumentException("Department name is required");
        }
        if (departmentRepo.existsByNameIgnoreCase(department.getName())) {
            throw new IllegalArgumentException("Department '" + department.getName() + "' already exists");
        }
        return departmentRepo.saveAndFlush(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Department> getAll() {
        return departmentRepo.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Department getById(Integer id) {
        return departmentRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No department found for ID: " + id));
    }

    @Override
    public Department update(Integer id, Department department) {
        logger.info("Updating department with ID: {}", id);
        Department existing = getById(id);
        if (StringUtils.hasText(department.getName())) {
            departmentRepo.findByNameIgnoreCase(department.getName())
                    .filter(d -> !d.getId().equals(id))
                    .ifPresent(d -> {
                        throw new IllegalArgumentException("Department '" + department.getName() + "' already exists");
                    });
            existing.setName(department.getName());
        }
        if (department.getDescription() != null) {
            existing.setDescription(department.getDescription());
        }
        return departmentRepo.saveAndFlush(existing);
    }

    @Override
    public void delete(Integer id) {
        logger.info("Deleting department with ID: {}", id);
        Department dept = getById(id);
        long empCount = employeeRepo.countByDepartmentId(id);
        if (empCount > 0) {
            throw new IllegalStateException("Cannot delete department '" + dept.getName() + "' — " + empCount + " employee(s) assigned");
        }
        departmentRepo.delete(dept);
    }

    @Override
    @Transactional(readOnly = true)
    public long countEmployees(Integer departmentId) {
        return employeeRepo.countByDepartmentId(departmentId);
    }
}
