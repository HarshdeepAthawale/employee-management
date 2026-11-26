package in.masti.service;

import in.masti.dto.LeaveBalanceView;
import in.masti.entity.LeaveRequest;
import in.masti.entity.LeaveStatus;

import java.util.List;

public interface LeaveService {

    LeaveRequest apply(LeaveRequest request);

    List<LeaveRequest> getAll(LeaveStatus status);

    List<LeaveRequest> getByEmployee(Integer employeeId);

    LeaveRequest getById(Integer id);

    LeaveRequest decide(Integer id, LeaveStatus newStatus);

    void cancel(Integer id);

    List<LeaveBalanceView> getBalance(Integer employeeId, Integer year);
}
