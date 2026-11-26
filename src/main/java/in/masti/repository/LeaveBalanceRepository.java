package in.masti.repository;

import in.masti.entity.LeaveBalance;
import in.masti.entity.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Integer> {

    Optional<LeaveBalance> findByEmployeeEmpIdAndYearAndLeaveType(Integer employeeId, int year, LeaveType leaveType);

    List<LeaveBalance> findByEmployeeEmpIdAndYear(Integer employeeId, int year);

    long deleteByEmployeeEmpId(Integer employeeId);
}
