package in.masti.repository;

import in.masti.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {

    List<Attendance> findByEmployeeEmpIdOrderByDateDescCheckInDesc(Integer employeeId);

    Optional<Attendance> findByEmployeeEmpIdAndDate(Integer employeeId, LocalDate date);

    boolean existsByEmployeeEmpIdAndDate(Integer employeeId, LocalDate date);

    List<Attendance> findByDateOrderByCheckInAsc(LocalDate date);

    List<Attendance> findByEmployeeEmpIdAndDateBetweenOrderByDateDescCheckInDesc(Integer employeeId, LocalDate from, LocalDate to);

    List<Attendance> findByDateBetweenOrderByDateDescCheckInDesc(LocalDate from, LocalDate to);

    List<Attendance> findAllByOrderByDateDescCheckInDesc();

    long deleteByEmployeeEmpId(Integer employeeId);
}
