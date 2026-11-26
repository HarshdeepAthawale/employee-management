package in.masti.repository;

import in.masti.entity.Salary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryRepository extends JpaRepository<Salary, Integer> {

    List<Salary> findAllByOrderByEffectiveDateDesc();

    List<Salary> findByEmployeeEmpIdOrderByEffectiveDateDesc(Integer employeeId);

    Optional<Salary> findTopByEmployeeEmpIdAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(Integer employeeId, LocalDate date);

    long deleteByEmployeeEmpId(Integer employeeId);
}
