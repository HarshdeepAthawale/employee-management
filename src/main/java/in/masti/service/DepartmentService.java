package in.masti.service;

import in.masti.entity.Department;

import java.util.List;

public interface DepartmentService {

    Department create(Department department);

    List<Department> getAll();

    Department getById(Integer id);

    Department update(Integer id, Department department);

    void delete(Integer id);

    long countEmployees(Integer departmentId);
}
