package in.masti.service;

import in.masti.entity.Salary;

import java.util.List;

public interface SalaryService {

    Salary create(Salary salary);

    List<Salary> getAll();

    List<Salary> getByEmployee(Integer employeeId);

    Salary getCurrent(Integer employeeId);

    Salary getById(Integer id);

    Salary update(Integer id, Salary salary);

    void delete(Integer id);
}
