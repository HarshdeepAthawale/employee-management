package in.masti.repository;

import in.masti.entity.LeaveRequest;
import in.masti.entity.LeaveStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {

    List<LeaveRequest> findAllByOrderByAppliedAtDesc();

    List<LeaveRequest> findByStatusOrderByAppliedAtDesc(LeaveStatus status);

    List<LeaveRequest> findByEmployeeEmpIdOrderByAppliedAtDesc(Integer employeeId);

    /**
     * Find pending/approved leave requests of an employee that overlap the given date range.
     */
    @Query("SELECT l FROM LeaveRequest l WHERE l.employee.empId = :empId " +
           "AND l.status IN ('PENDING', 'APPROVED') " +
           "AND l.startDate <= :end AND l.endDate >= :start")
    List<LeaveRequest> findOverlapping(@Param("empId") Integer empId,
                                       @Param("start") LocalDate start,
                                       @Param("end") LocalDate end);

    long deleteByEmployeeEmpId(Integer employeeId);
}
