package in.masti.controller;

import in.masti.constants.RouteConstants;
import in.masti.dto.LeaveBalanceView;
import in.masti.dto.LeaveDecision;
import in.masti.entity.LeaveRequest;
import in.masti.entity.LeaveStatus;
import in.masti.service.LeaveService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping(RouteConstants.LEAVE_BASE)
@Tag(name = "Leave Management", description = "Leave requests with apply/approve flow and yearly balances")
public class LeaveController {

    private static final Logger logger = LoggerFactory.getLogger(LeaveController.class);

    private final LeaveService leaveService;

    @Autowired
    public LeaveController(LeaveService leaveService) {
        this.leaveService = leaveService;
    }

    @Operation(summary = "Apply for leave", description = "Creates a PENDING leave request. Rejects overlapping pending/approved leaves with 409.")
    @PostMapping
    public ResponseEntity<LeaveRequest> apply(@RequestBody LeaveRequest request) {
        logger.info("Leave application received");
        try {
            LeaveRequest created = leaveService.apply(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "List leave requests", description = "Optionally filter by status (PENDING, APPROVED, REJECTED).")
    @GetMapping
    public ResponseEntity<List<LeaveRequest>> getAll(
            @Parameter(description = "Filter by status", example = "PENDING") @RequestParam(required = false) LeaveStatus status) {
        return ResponseEntity.ok(leaveService.getAll(status));
    }

    @Operation(summary = "Leave requests of an employee")
    @GetMapping(RouteConstants.LEAVE_BY_EMPLOYEE)
    public ResponseEntity<List<LeaveRequest>> getByEmployee(@PathVariable Integer empId) {
        try {
            return ResponseEntity.ok(leaveService.getByEmployee(empId));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Leave balance of an employee", description = "Yearly balance per leave type: granted, used, remaining. Defaults to the current year.")
    @GetMapping(RouteConstants.LEAVE_BALANCE)
    public ResponseEntity<List<LeaveBalanceView>> getBalance(
            @PathVariable Integer empId,
            @Parameter(description = "Year", example = "2026") @RequestParam(required = false) Integer year) {
        try {
            return ResponseEntity.ok(leaveService.getBalance(empId, year));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get a leave request by ID")
    @GetMapping(RouteConstants.LEAVE_GET_BY_ID)
    public ResponseEntity<LeaveRequest> getById(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(leaveService.getById(id));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Approve or reject a leave request", description = "Only PENDING requests can be decided. Approving deducts days from the yearly balance (409 on insufficient balance or already-decided).")
    @PutMapping(RouteConstants.LEAVE_STATUS)
    public ResponseEntity<LeaveRequest> decide(@PathVariable Integer id, @Valid @RequestBody LeaveDecision decision) {
        logger.info("Decision {} for leave request {}", decision.status(), id);
        try {
            return ResponseEntity.ok(leaveService.decide(id, decision.status()));
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Cancel a leave request", description = "Deletes the request. Only PENDING requests can be cancelled (409 otherwise).")
    @DeleteMapping(RouteConstants.LEAVE_GET_BY_ID)
    public ResponseEntity<Void> cancel(@PathVariable Integer id) {
        try {
            leaveService.cancel(id);
            return ResponseEntity.noContent().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
