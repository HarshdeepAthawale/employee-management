package in.masti.constants;

/**
 * Route Constants for Centralized Route Management
 * <p>
 * This class contains all the route constants used throughout the application.
 * Centralizing routes here makes it easier to maintain and update API endpoints.
 * <p>
 * Benefits:
 * - Single source of truth for all routes
 * - Easy to refactor and update routes
 * - Prevents typos and inconsistencies
 * - Better maintainability
 */
public final class RouteConstants {

    /**
     * Private constructor to prevent instantiation
     * This is a utility class that should not be instantiated
     */
    private RouteConstants() {
        throw new UnsupportedOperationException("Utility class cannot be instantiated");
    }

    // =============================================================================
    // EMPLOYEE ROUTES
    // =============================================================================

    /**
     * Base path for all employee-related endpoints
     */
    public static final String EMPLOYEE_BASE = "/api/employees";


    public static final String EMPLOYEE_CREATE = "";

    public static final String EMPLOYEE_GET_ALL = "";


    public static final String EMPLOYEE_GET_BY_ID = "/{id}";


    public static final String EMPLOYEE_UPDATE = "/{id}";


    public static final String EMPLOYEE_PATCH = "/{id}";


    public static final String EMPLOYEE_DELETE = "/{id}";


    public static final String EMPLOYEE_BY_DESIGNATION = "/designation/{designation}";


    public static final String EMPLOYEE_BY_COMPANY = "/company/{company}";


    public static final String EMPLOYEE_SEARCH = "/search";

    public static final String EMPLOYEE_BORN_AFTER = "/born-after";

    public static final String EMPLOYEE_FILTER = "/filter";

    public static final String EMPLOYEE_COUNT_BY_DESIGNATION = "/count/designation/{designation}";

    public static final String EMPLOYEE_EXISTS = "/exists";

    public static final String EMPLOYEE_HEALTH = "/health";

    // =============================================================================
    // DEPARTMENT ROUTES
    // =============================================================================

    public static final String DEPARTMENT_BASE = "/api/departments";
    public static final String DEPARTMENT_GET_BY_ID = "/{id}";
    public static final String DEPARTMENT_UPDATE = "/{id}";
    public static final String DEPARTMENT_DELETE = "/{id}";
    public static final String DEPARTMENT_EMPLOYEE_COUNT = "/{id}/employee-count";

    // =============================================================================
    // ATTENDANCE ROUTES
    // =============================================================================

    public static final String ATTENDANCE_BASE = "/api/attendance";
    public static final String ATTENDANCE_CHECK_IN = "/check-in";
    public static final String ATTENDANCE_CHECK_OUT = "/{id}/check-out";
    public static final String ATTENDANCE_GET_BY_ID = "/{id}";
    public static final String ATTENDANCE_TODAY = "/today";
    public static final String ATTENDANCE_BY_EMPLOYEE = "/employee/{empId}";
    public static final String ATTENDANCE_MONTHLY = "/employee/{empId}/monthly";

    // =============================================================================
    // LEAVE ROUTES
    // =============================================================================

    public static final String LEAVE_BASE = "/api/leaves";
    public static final String LEAVE_GET_BY_ID = "/{id}";
    public static final String LEAVE_STATUS = "/{id}/status";
    public static final String LEAVE_BY_EMPLOYEE = "/employee/{empId}";
    public static final String LEAVE_BALANCE = "/employee/{empId}/balance";

    // =============================================================================
    // SALARY ROUTES
    // =============================================================================

    public static final String SALARY_BASE = "/api/salaries";
    public static final String SALARY_GET_BY_ID = "/{id}";
    public static final String SALARY_BY_EMPLOYEE = "/employee/{empId}";
    public static final String SALARY_CURRENT = "/employee/{empId}/current";

    // =============================================================================
    // H2 CONSOLE ROUTES
    // =============================================================================

    public static final String H2_CONSOLE = "/h2-console";

    // =============================================================================
    // API DOCUMENTATION ROUTES (for future use)
    // =============================================================================
    public static final String API_DOCS = "/swagger-ui.html";

    public static final String API_DOCS_JSON = "/v3/api-docs";

    // =============================================================================
    // ACTUATOR ROUTES (for monitoring)
    // =============================================================================

    public static final String ACTUATOR_HEALTH = "/actuator/health";


    public static final String ACTUATOR_INFO = "/actuator/info";

    public static final String ACTUATOR_METRICS = "/actuator/metrics";
} 