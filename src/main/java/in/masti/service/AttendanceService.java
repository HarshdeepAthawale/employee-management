package in.masti.service;

import in.masti.dto.MonthlyAttendanceReport;
import in.masti.entity.Attendance;
import in.masti.entity.AttendanceStatus;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceService {

    Attendance checkIn(Integer employeeId, LocalDate date);

    Attendance checkOut(Integer id);

    List<Attendance> getAll(Integer employeeId, LocalDate from, LocalDate to);

    List<Attendance> getToday();

    List<Attendance> getByEmployee(Integer employeeId);

    MonthlyAttendanceReport monthlyReport(Integer employeeId, int year, int month);

    Attendance updateStatus(Integer id, AttendanceStatus status);

    void delete(Integer id);
}
