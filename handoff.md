# EmployeeHub — Handoff for OpenCode (Mistral)

## What This Is

**EmployeeHub** is a full-stack employee management web app built with Spring Boot 3.5.3 + Java 21 on the backend and vanilla ES6 modules on the frontend. It runs on an embedded Tomcat server with an H2 file-based database — no external DB setup needed.

**Repo:** `https://github.com/HarshdeepAthawale/employee-management-java.git`
**Local path:** `C:\Users\Harshdeep Athawale\Downloads\spring-boot-basic`
**Branch:** `master` locally, pushed to `main` on GitHub

---

## How to Run

```powershell
cd "C:\Users\Harshdeep Athawale\Downloads\spring-boot-basic"
& "C:\Users\Harshdeep Athawale\.m2\wrapper\dists\apache-maven-3.9.10\a38810a491b03367137adfdfbe7d14c4\bin\mvn.cmd" spring-boot:run
```

- App runs at **http://localhost:8080**
- Swagger UI: http://localhost:8080/swagger-ui.html
- H2 Console: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:file:~/h2database/employeedb`, user: `test`, password: `test`)
- Actuator health: http://localhost:8080/actuator/health

**Important:** `mvn spring-boot:run` serves static files from `target/classes/static/`, NOT from `src/main/resources/static/`. If you edit frontend files in `src/`, you must either:
1. Restart the server (recompiles and copies), OR
2. Manually copy the file: `Copy-Item src\main\resources\static\js\<file> target\classes\static\js\<file>`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Spring Boot 3.5.3, Java 21, Spring Data JPA, Hibernate |
| Database | H2 file-based (`~/h2database/employeedb`), `ddl-auto=update` |
| Frontend | Vanilla JS (ES6 modules), no bundler, no framework |
| API Docs | SpringDoc OpenAPI 3 (springdoc 2.7.0) |
| Build | Maven (wrapper at `~\.m2\wrapper\dists\apache-maven-3.9.10\...`) |

---

## Project Structure

```
src/main/java/in/masti/
├── SpringBootBasicApplication.java          # Entry point
├── advice/
│   ├── ExceptionAdvice.java                 # Global exception handler
│   └── exception/ErrorResponse.java         # Error response DTO
├── config/
│   ├── OpenApiConfig.java                   # Swagger/OpenAPI config
│   └── WebConfig.java                       # CORS config
├── constants/
│   └── RouteConstants.java                  # All API route constants
├── controller/
│   ├── EmployeeController.java              # /api/employees endpoints
│   ├── DepartmentController.java            # /api/departments endpoints
│   ├── AttendanceController.java            # /api/attendance endpoints
│   ├── LeaveController.java                 # /api/leaves endpoints
│   └── SalaryController.java                # /api/salaries endpoints
├── dto/
│   ├── CheckInRequest.java                  # check-in payload (employeeId, date?)
│   ├── AttendanceStatusUpdate.java          # PATCH attendance status payload
│   ├── LeaveDecision.java                   # approve/reject payload
│   ├── MonthlyAttendanceReport.java         # monthly aggregate DTO
│   └── LeaveBalanceView.java                # per-type balance DTO
├── entity/
│   ├── Employee.java                        # Employee JPA entity (+ joiningDate, status)
│   ├── Department.java                      # Department JPA entity
│   ├── EmployeeStatus.java                  # ACTIVE / INACTIVE / ON_LEAVE
│   ├── Attendance.java                      # Attendance JPA entity (+ derived workedMinutes)
│   ├── AttendanceStatus.java                # PRESENT / HALF_DAY / ABSENT / ON_LEAVE
│   ├── LeaveRequest.java                    # Leave request (+ derived days)
│   ├── LeaveType.java                       # SICK(10) / CASUAL(12) / EARNED(15) / UNPAID(unlimited)
│   ├── LeaveStatus.java                     # PENDING / APPROVED / REJECTED
│   ├── LeaveBalance.java                    # per employee+year+type balance
│   └── Salary.java                          # Salary (+ derived netSalary)
├── repository/                              # one JPA repository per entity (+ deleteByEmployeeEmpId)
└── service/                                 # interface + impl per domain

src/main/resources/
├── application.properties                   # All config (DB, JPA, logging, Swagger)
└── static/
    ├── index.html                           # Single-page app shell
    ├── css/styles.css                       # All styles (light theme only)
    └── js/
        ├── api.js                           # HTTP client (fetch wrapper)
        ├── app.js                           # Router (hash-based: #employees, #departments, #attendance, #leaves, #salaries, #insights)
        ├── components/
        │   ├── sidebar.js                   # Sidebar nav
        │   ├── table.js                     # Employee table with sorting, status badge, tenure
        │   ├── modal.js                     # Employee create/edit modal (+ joining date, status)
        │   └── toast.js                     # Toast notifications
        └── pages/
            ├── employees.js                 # Employees list page (CRUD)
            ├── departments.js               # Departments list page (CRUD)
            ├── attendance.js                # Check-in/out, filters, monthly report
            ├── leaves.js                    # Leave apply/approve, balances
            ├── salaries.js                  # Salary CRUD + current salary
            └── insights.js                  # Analytics/stats page
```

---

## Database Schema

### Employee table
| Column | Type | Constraints |
|--------|------|------------|
| emp_id | INTEGER | PK, sequence `emp_id_seq` starting at 101 |
| name | VARCHAR(20) | NOT NULL, letters/spaces/hyphens only |
| designation | VARCHAR(50) | nullable |
| dob | DATE | nullable, must be in the past |
| company | VARCHAR(100) | nullable |
| joining_date | DATE | nullable, must be past-or-present |
| status | VARCHAR(20) | enum string, default ACTIVE (null reads back as ACTIVE) |
| department_id | INTEGER | nullable FK → department(id), ManyToOne EAGER |

### Department table
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PK, sequence `dept_id_seq` starting at 1 |
| name | VARCHAR(50) | NOT NULL, UNIQUE (case-insensitive check in service) |
| description | VARCHAR(200) | nullable |

### Attendance table
| Column | Type | Constraints |
|--------|------|------------|
| id | INTEGER | PK, sequence `att_id_seq` |
| employee_id | INTEGER | NOT NULL FK → employee, ManyToOne EAGER |
| att_date | DATE | NOT NULL (column named `att_date` — `date` is reserved in H2) |
| check_in / check_out | TIME | nullable |
| status | VARCHAR(20) | PRESENT / HALF_DAY / ABSENT / ON_LEAVE, default PRESENT |

### Leave request / balance / salary tables
- `leave_request`: id (`leave_id_seq`), employee_id FK, leave_type, start_date, end_date, reason(500), status (PENDING default), applied_at, decided_at; derived `days` = inclusive day count
- `leave_balance`: id (`balance_id_seq`), employee_id FK, balance_year (column `balance_year` — `year` is reserved in H2), leave_type, total_days, used_days; UNIQUE(employee_id, balance_year, leave_type)
- `salary`: id (`salary_id_seq`), employee_id FK, base_salary, allowances, deductions, effective_date; derived `netSalary` = base + allowances − deductions

---

## REST API

### Employee endpoints (`/api/employees`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/employees` | Create employee |
| GET | `/api/employees` | List all employees (includes nested `department` object) |
| GET | `/api/employees/{id}` | Get employee by ID |
| PUT | `/api/employees/{id}` | Full update |
| PATCH | `/api/employees/{id}` | Partial update |
| DELETE | `/api/employees/{id}` | Delete employee |
| GET | `/api/employees/designation/{d}` | Filter by designation |
| GET | `/api/employees/company/{c}` | Filter by company |
| GET | `/api/employees/search?name=X` | Search by name (partial, case-insensitive) |
| GET | `/api/employees/born-after?date=YYYY-MM-DD` | Filter by DOB |
| GET | `/api/employees/filter?designation=X&company=Y` | Combined filter |
| GET | `/api/employees/count/designation/{d}` | Count by designation |
| GET | `/api/employees/exists?name=X` | Check existence |
| GET | `/api/employees/health` | Health check |

### Department endpoints (`/api/departments`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/departments` | Create department (400 if duplicate name) |
| GET | `/api/departments` | List all departments |
| GET | `/api/departments/{id}` | Get by ID |
| PUT | `/api/departments/{id}` | Update (400 if duplicate name) |
| DELETE | `/api/departments/{id}` | Delete (409 CONFLICT if employees assigned) |
| GET | `/api/departments/{id}/employee-count` | Count assigned employees |

### Attendance endpoints (`/api/attendance`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/check-in` | Body `{employeeId, date?}` → 201 (409 if record exists for that date) |
| POST | `/{id}/check-out` | Set check-out = now (409 if already checked out) |
| GET | `` | List all; optional `?employeeId=&from=&to=` |
| GET | `/today` | Today's records |
| GET | `/employee/{empId}` | History for an employee |
| GET | `/employee/{empId}/monthly?year=&month=` | Aggregated report (present/half/absent/leave/hours) |
| PATCH | `/{id}` | Body `{status}` — PRESENT/HALF_DAY/ABSENT/ON_LEAVE |
| DELETE | `/{id}` | Delete record |

### Leave endpoints (`/api/leaves`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `` | Body `{employee:{empId}, leaveType, startDate, endDate, reason?}` → 201 PENDING (409 on overlap) |
| GET | `` | List all; optional `?status=PENDING` |
| GET | `/employee/{empId}` | Requests for an employee |
| GET | `/employee/{empId}/balance?year=` | Per-type balance (defaults: SICK 10, CASUAL 12, EARNED 15, UNPAID unlimited) |
| GET | `/{id}` | Get by ID |
| PUT | `/{id}/status` | Body `{status: APPROVED\|REJECTED}` — only from PENDING; approval deducts balance (400 if insufficient) |
| DELETE | `/{id}` | Cancel (only PENDING, else 409) |

### Salary endpoints (`/api/salaries`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `` | Body `{employee:{empId}, baseSalary, allowances?, deductions?, effectiveDate?}` → 201 |
| GET | `` | List all |
| GET | `/employee/{empId}` | History |
| GET | `/employee/{empId}/current` | Latest effective ≤ today |
| GET/PUT/DELETE | `/{id}` | Get / update / delete |

**Employee JSON with department:**
```json
{
  "empId": 101,
  "name": "Asha Rao",
  "designation": "Developer",
  "dob": "1996-04-12",
  "company": "TechCorp",
  "department": { "id": 1, "name": "Engineering", "description": "Software development and engineering" }
}
```

**Assigning a department to an employee (PUT/PATCH):**
```json
{ "department": { "id": 1 } }
```
Send `"department": null` to unassign.

---

## Frontend Architecture

- **SPA with hash routing** — `app.js` maps `#employees` / `#departments` / `#insights` to page render functions
- **No build step** — ES6 modules loaded natively via `<script type="module">`
- **api.js** — thin `fetch` wrapper; all API methods are on the exported `api` object
- **modal.js** — shared modal system; `showEmployeeModal()` is async (fetches department list on open)
- **table.js** — `renderTable()` builds the employee table with clickable column headers for sorting
- **Light theme only** — CSS uses custom properties but no dark mode
- **No mock data** — the app starts empty; create employees/departments through the UI

---

## What's Done

1. **Employee CRUD** — full create/read/update/delete with validation, search, filtering
2. **Department CRUD** — create/edit/delete departments with duplicate-name protection and delete-protection (can't delete if employees are assigned)
3. **Employee-Department relationship** — ManyToOne; department dropdown in employee modal; department badge column in employee table; employee count per department on departments page
4. **Insights page** — stats cards (total employees, manager count, analyst count), designation/company filter dropdowns
5. **Swagger UI** — full API documentation at `/swagger-ui.html`
6. **Attendance tracking** — `Attendance` entity + `/api/attendance` (check-in, check-out, filters, today, monthly report); `#attendance` page with stats, filters, monthly report card, check-out/absent/delete actions
7. **Leave management** — `LeaveRequest`/`LeaveBalance` + `LeaveType`/`LeaveStatus` enums + `/api/leaves` (apply, approve/reject, cancel, balance); overlap protection (409), balance deduction on approval; `#leaves` page with balance cards, apply modal, approve/reject/cancel
8. **Joining date + tenure** — `joiningDate` on Employee (validated `@PastOrPresent`), shown in modal + table with tenure badge (`tenureMonths` derived getter)
9. **Salary management** — `Salary` entity + `/api/salaries` (CRUD + `/employee/{id}/current`); derived `netSalary` = base + allowances − deductions; `#salaries` page with current-salary card, add/edit modal, history table
10. **Employee status** — `EmployeeStatus` enum (`ACTIVE`/`INACTIVE`/`ON_LEAVE`, default ACTIVE, null reads back as ACTIVE), badge column in employee table, status filter, status select in employee modal

Deleting an employee cascades to their attendance, leave, and salary records (derived `deleteByEmployeeEmpId` queries in `EmployeeServiceImpl`).

---

## What's Left to Build

Nothing from the original plan. Possible next ideas:

| Feature | Priority | Notes |
|---------|----------|-------|
| **Auth / roles** | High | Spring Security login, ADMIN vs HR vs EMPLOYEE roles (currently fully open) |
| **Attendance calendar view** | Medium | Calendar-style month grid on `#attendance` instead of a flat table |
| **Payslip PDF** | Medium | Generate a downloadable payslip from a Salary record |
| **Auto ON_LEAVE attendance** | Low | When a leave is APPROVED, mark attendance ON_LEAVE for those dates |
| **Dark mode** | Low | CSS custom properties already in place, only light values defined |

---

## Git Conventions

- **Co-authors on every commit:**
  ```
  Co-authored-by: ggpt1008 <ggpt1008@users.noreply.github.com>
  Co-authored-by: lavish197 <lavish197@users.noreply.github.com>
  ```
- **Commit style:** conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
- **Push:** `git push origin master:main` (local branch is `master`, remote is `main`)
- **Small commits** pushed straight to main — no PR workflow

---

## Gotchas

1. **Static file serving:** Editing files in `src/main/resources/static/` does NOT auto-reflect. Restart the server or manually copy to `target/classes/static/`.
2. **H2 file lock:** Only one process can access the H2 database at a time. Stop the server before using H2 Console externally.
3. **Employee ID starts at 101**, Department ID starts at 1 (separate sequences).
4. **Port 8080** must be free. Kill existing Java processes if the port is in use: `Get-Process java -ErrorAction SilentlyContinue | Stop-Process -Force`
5. **No dark mode** — the CSS uses custom properties but only defines light-theme values.
6. **Heredoc apostrophes** — PowerShell heredocs (`@'...'@`) choke on internal apostrophes. Use `@"..."@` or escape them.
7. **creationTime is `@Transient`** — it's set in Java memory but not persisted to the database.
