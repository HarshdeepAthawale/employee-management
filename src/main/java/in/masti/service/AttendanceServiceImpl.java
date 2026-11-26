package in.masti.service;

import in.masti.dto.MonthlyAttendanceReport;
import in.masti.entity.Attendance;
import in.masti.entity.AttendanceStatus;
import in.masti.entity.Employee;
import in.masti.repository.AttendanceRepository;
import in.masti.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceServiceImpl.class);

    private final AttendanceRepository attendanceRepo;
    private final EmployeeRepository employeeRepo;

    @Autowired
    public AttendanceServiceImpl(AttendanceRepository attendanceRepo, EmployeeRepository employeeRepo) {
        this.attendanceRepo = attendanceRepo;
        this.employeeRepo = employeeRepo;
    }

    @Override
    public Attendance checkIn(Integer employeeId, LocalDate date) {
        logger.info("Check-in for employee {} on {}", employeeId, date);
        if (employeeId == null) {
            throw new IllegalArgumentException("Employee ID is required");
        }
        LocalDate attDate = date != null ? date : LocalDate.now();
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        if (attendanceRepo.existsByEmployeeEmpIdAndDate(employeeId, attDate)) {
            throw new IllegalStateException("Employee " + employeeId + " already has an attendance record for " + attDate);
        }
        Attendance attendance = new Attendance(employee, attDate, LocalTime.now().withNano(0));
        return attendanceRepo.saveAndFlush(attendance);
    }

    @Override
    public Attendance checkOut(Integer id) {
        logger.info("Check-out for attendance record {}", id);
        Attendance attendance = getById(id);
        if (attendance.getCheckOut() != null) {
            throw new IllegalStateException("Attendance record " + id + " already has a check-out time");
        }
        attendance.setCheckOut(LocalTime.now().withNano(0));
        return attendanceRepo.saveAndFlush(attendance);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getAll(Integer employeeId, LocalDate from, LocalDate to) {
        if (employeeId != null && from != null && to != null) {
            return attendanceRepo.findByEmployeeEmpIdAndDateBetweenOrderByDateDescCheckInDesc(employeeId, from, to);
        }
        if (employeeId != null) {
            return attendanceRepo.findByEmployeeEmpIdOrderByDateDescCheckInDesc(employeeId);
        }
        if (from != null && to != null) {
            return attendanceRepo.findByDateBetweenOrderByDateDescCheckInDesc(from, to);
        }
        return attendanceRepo.findAllByOrderByDateDescCheckInDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getToday() {
        return attendanceRepo.findByDateOrderByCheckInAsc(LocalDate.now());
    }

    @Override
    @Transactional(readOnly = true)
    public List<Attendance> getByEmployee(Integer employeeId) {
        employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        return attendanceRepo.findByEmployeeEmpIdOrderByDateDescCheckInDesc(employeeId);
    }

    @Override
    @Transactional(readOnly = true)
    public MonthlyAttendanceReport monthlyReport(Integer employeeId, int year, int month) {
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        if (month < 1 || month > 12) {
            throw new IllegalArgumentException("Month must be between 1 and 12, got: " + month);
        }
        YearMonth ym = YearMonth.of(year, month);
        List<Attendance> records = attendanceRepo.findByEmployeeEmpIdAndDateBetweenOrderByDateDescCheckInDesc(
                employeeId, ym.atDay(1), ym.atEndOfMonth());

        long present = records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT).count();
        long half = records.stream().filter(r -> r.getStatus() == AttendanceStatus.HALF_DAY).count();
        long absent = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ABSENT).count();
        long leave = records.stream().filter(r -> r.getStatus() == AttendanceStatus.ON_LEAVE).count();
        double totalHours = records.stream()
                .map(Attendance::getWorkedMinutes)
                .filter(java.util.Objects::nonNull)
                .mapToLong(Long::longValue)
                .sum() / 60.0;

        return new MonthlyAttendanceReport(employeeId, employee.getName(), year, month,
                present, half, absent, leave, Math.round(totalHours * 100.0) / 100.0);
    }

    @Override
    public Attendance updateStatus(Integer id, AttendanceStatus status) {
        logger.info("Updating attendance record {} status to {}", id, status);
        if (status == null) {
            throw new IllegalArgumentException("Status is required");
        }
        Attendance attendance = getById(id);
        attendance.setStatus(status);
        return attendanceRepo.saveAndFlush(attendance);
    }

    @Override
    public void delete(Integer id) {
        logger.info("Deleting attendance record {}", id);
        attendanceRepo.delete(getById(id));
    }

    private Attendance getById(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Attendance ID cannot be null");
        }
        return attendanceRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No attendance record found for ID: " + id));
    }
}
