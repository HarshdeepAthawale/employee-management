package in.masti.controller;

import in.masti.constants.RouteConstants;
import in.masti.dto.AttendanceStatusUpdate;
import in.masti.dto.CheckInRequest;
import in.masti.dto.MonthlyAttendanceReport;
import in.masti.entity.Attendance;
import in.masti.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping(RouteConstants.ATTENDANCE_BASE)
@Tag(name = "Attendance", description = "Daily check-in/check-out tracking and monthly reports")
public class AttendanceController {

    private static final Logger logger = LoggerFactory.getLogger(AttendanceController.class);

    private final AttendanceService attendanceService;

    @Autowired
    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @Operation(summary = "Check in an employee", description = "Creates an attendance record with the current time as check-in. Defaults to today; one record per employee per day.")
    @PostMapping(RouteConstants.ATTENDANCE_CHECK_IN)
    public ResponseEntity<Attendance> checkIn(@Valid @RequestBody CheckInRequest request) {
        logger.info("Check-in request for employee {}", request.employeeId());
        try {
            Attendance created = attendanceService.checkIn(request.employeeId(), request.date());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Check out an attendance record", description = "Sets the check-out time to now. Fails with 409 if already checked out.")
    @PostMapping(RouteConstants.ATTENDANCE_CHECK_OUT)
    public ResponseEntity<Attendance> checkOut(@PathVariable Integer id) {
        logger.info("Check-out request for attendance {}", id);
        try {
            return ResponseEntity.ok(attendanceService.checkOut(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "List attendance records", description = "Optionally filter by employeeId and/or a from-to date range.")
    @GetMapping
    public ResponseEntity<List<Attendance>> getAll(
            @Parameter(description = "Filter by employee ID", example = "101") @RequestParam(required = false) Integer employeeId,
            @Parameter(description = "Range start (yyyy-MM-dd)", example = "2026-11-01") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @Parameter(description = "Range end (yyyy-MM-dd)", example = "2026-11-30") @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(attendanceService.getAll(employeeId, from, to));
    }

    @Operation(summary = "Today's attendance", description = "All attendance records for today.")
    @GetMapping(RouteConstants.ATTENDANCE_TODAY)
    public ResponseEntity<List<Attendance>> getToday() {
        return ResponseEntity.ok(attendanceService.getToday());
    }

    @Operation(summary = "Attendance history of an employee")
    @GetMapping(RouteConstants.ATTENDANCE_BY_EMPLOYEE)
    public ResponseEntity<List<Attendance>> getByEmployee(@PathVariable Integer empId) {
        try {
            return ResponseEntity.ok(attendanceService.getByEmployee(empId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Monthly attendance report", description = "Aggregated present/half-day/absent/leave counts and total worked hours for one employee in a month.")
    @GetMapping(RouteConstants.ATTENDANCE_MONTHLY)
    public ResponseEntity<MonthlyAttendanceReport> monthlyReport(
            @PathVariable Integer empId,
            @RequestParam int year,
            @RequestParam int month) {
        try {
            return ResponseEntity.ok(attendanceService.monthlyReport(empId, year, month));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Update attendance status", description = "Change the status of a record (PRESENT, HALF_DAY, ABSENT, ON_LEAVE).")
    @PatchMapping(RouteConstants.ATTENDANCE_GET_BY_ID)
    public ResponseEntity<Attendance> updateStatus(@PathVariable Integer id, @Valid @RequestBody AttendanceStatusUpdate update) {
        try {
            return ResponseEntity.ok(attendanceService.updateStatus(id, update.status()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete an attendance record")
    @DeleteMapping(RouteConstants.ATTENDANCE_GET_BY_ID)
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        try {
            attendanceService.delete(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
