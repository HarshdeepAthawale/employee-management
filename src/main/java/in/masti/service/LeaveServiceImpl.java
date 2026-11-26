package in.masti.service;

import in.masti.dto.LeaveBalanceView;
import in.masti.entity.Employee;
import in.masti.entity.LeaveBalance;
import in.masti.entity.LeaveRequest;
import in.masti.entity.LeaveStatus;
import in.masti.entity.LeaveType;
import in.masti.repository.EmployeeRepository;
import in.masti.repository.LeaveBalanceRepository;
import in.masti.repository.LeaveRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@Transactional
public class LeaveServiceImpl implements LeaveService {

    private static final Logger logger = LoggerFactory.getLogger(LeaveServiceImpl.class);

    private final LeaveRequestRepository leaveRepo;
    private final LeaveBalanceRepository balanceRepo;
    private final EmployeeRepository employeeRepo;

    @Autowired
    public LeaveServiceImpl(LeaveRequestRepository leaveRepo,
                            LeaveBalanceRepository balanceRepo,
                            EmployeeRepository employeeRepo) {
        this.leaveRepo = leaveRepo;
        this.balanceRepo = balanceRepo;
        this.employeeRepo = employeeRepo;
    }

    @Override
    public LeaveRequest apply(LeaveRequest request) {
        logger.info("Applying leave request: {}", request);
        if (request == null || request.getEmployee() == null || request.getEmployee().getEmpId() == null) {
            throw new IllegalArgumentException("Employee is required");
        }
        Employee employee = employeeRepo.findById(request.getEmployee().getEmpId())
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + request.getEmployee().getEmpId()));
        if (request.getLeaveType() == null) {
            throw new IllegalArgumentException("Leave type is required");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Start date and end date are required");
        }
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        List<LeaveRequest> overlapping = leaveRepo.findOverlapping(
                employee.getEmpId(), request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            LeaveRequest other = overlapping.get(0);
            throw new IllegalStateException("Overlaps with existing " + other.getStatus() + " leave request #"
                    + other.getId() + " (" + other.getStartDate() + " to " + other.getEndDate() + ")");
        }
        request.setEmployee(employee);
        request.setStatus(LeaveStatus.PENDING);
        request.setAppliedAt(LocalDateTime.now());
        request.setDecidedAt(null);
        return leaveRepo.saveAndFlush(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequest> getAll(LeaveStatus status) {
        if (status != null) {
            return leaveRepo.findByStatusOrderByAppliedAtDesc(status);
        }
        return leaveRepo.findAllByOrderByAppliedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveRequest> getByEmployee(Integer employeeId) {
        employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        return leaveRepo.findByEmployeeEmpIdOrderByAppliedAtDesc(employeeId);
    }

    @Override
    @Transactional(readOnly = true)
    public LeaveRequest getById(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException("Leave request ID cannot be null");
        }
        return leaveRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("No leave request found for ID: " + id));
    }

    @Override
    public LeaveRequest decide(Integer id, LeaveStatus newStatus) {
        logger.info("Deciding leave request {} -> {}", id, newStatus);
        if (newStatus == null || newStatus == LeaveStatus.PENDING) {
            throw new IllegalArgumentException("Decision must be APPROVED or REJECTED");
        }
        LeaveRequest request = getById(id);
        if (request.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Leave request " + id + " is already " + request.getStatus());
        }
        request.setStatus(newStatus);
        request.setDecidedAt(LocalDateTime.now());
        if (newStatus == LeaveStatus.APPROVED) {
            deductBalance(request);
        }
        return leaveRepo.saveAndFlush(request);
    }

    @Override
    public void cancel(Integer id) {
        logger.info("Cancelling leave request {}", id);
        LeaveRequest request = getById(id);
        if (request.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException("Only PENDING leave requests can be cancelled (current: " + request.getStatus() + ")");
        }
        leaveRepo.delete(request);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LeaveBalanceView> getBalance(Integer employeeId, Integer year) {
        Employee employee = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException("No employee found for ID: " + employeeId));
        int y = year != null ? year : LocalDate.now().getYear();
        List<LeaveBalance> rows = balanceRepo.findByEmployeeEmpIdAndYear(employeeId, y);
        return Arrays.stream(LeaveType.values()).map(type -> {
            LeaveBalance row = rows.stream()
                    .filter(r -> r.getLeaveType() == type)
                    .findFirst()
                    .orElse(null);
            double total = row != null ? row.getTotalDays() : type.getDefaultDays();
            double used = row != null ? row.getUsedDays() : 0;
            return new LeaveBalanceView(type, y, total, used, total - used, type.isUnlimited());
        }).toList();
    }

    /**
     * Deduct the approved leave days from the employee's yearly balance.
     * Unlimited types (UNPAID) are tracked but never blocked.
     */
    private void deductBalance(LeaveRequest request) {
        LeaveType type = request.getLeaveType();
        long days = request.getDays();
        int year = request.getStartDate().getYear();
        Integer empId = request.getEmployee().getEmpId();

        LeaveBalance balance = balanceRepo
                .findByEmployeeEmpIdAndYearAndLeaveType(empId, year, type)
                .orElseGet(() -> new LeaveBalance(request.getEmployee(), year, type, type.getDefaultDays()));

        if (!type.isUnlimited()) {
            double remaining = balance.getTotalDays() - balance.getUsedDays();
            if (days > remaining) {
                throw new IllegalArgumentException("Insufficient " + type + " leave balance for " + year
                        + ": requested " + days + " day(s), remaining " + remaining);
            }
        }
        balance.setUsedDays(balance.getUsedDays() + days);
        balanceRepo.saveAndFlush(balance);
        logger.info("Deducted {} day(s) of {} from employee {} balance for {}", days, type, empId, year);
    }
}
