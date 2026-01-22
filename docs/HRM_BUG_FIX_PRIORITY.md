# HRM Module - Bug Fix Priority List

## Priority Scoring System
- **Impact:** How many users/features are affected (1-5)
- **Severity:** How broken is the feature (1-5)
- **Effort:** Estimated fix complexity (1=easy, 5=hard)
- **Priority Score:** (Impact × Severity) / Effort

---

## 🔴 PRIORITY 1 - CRITICAL (Fix Immediately)

### P1-01: HRM Dashboard 500 Error (BUG-024)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5 | Main HRM landing page - all users affected |
| Severity | 5 | Complete page failure (500 error) |
| Effort | 1 | Simple fix - add missing relationship |
| **Priority** | **25** | |

**Bug:** `Call to undefined method Aero\HRM\Models\Attendance::employee()`
**Fix:** Add `employee()` relationship to Attendance model
**File:** `packages/aero-hrm/src/Models/Attendance.php`

---

### P1-02: Leave Types Configuration 404 (BUG-038)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 5 | Entire Leaves module non-functional |
| Severity | 5 | Cannot create leave types = no leaves possible |
| Effort | 3 | Need route + controller + view |
| **Priority** | **8.3** | |

**Bug:** No route exists for `/hrm/leave-types`
**Fix:** Create LeaveTypeController with CRUD + route registration
**Files:** 
- `packages/aero-hrm/routes/web.php`
- `packages/aero-hrm/src/Http/Controllers/LeaveTypeController.php`

---

### P1-03: Onboarding Missing Table (BUG-009)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 4 | Onboarding workflow blocked |
| Severity | 5 | 500 error - table doesn't exist |
| Effort | 1 | Run migration |
| **Priority** | **20** | |

**Bug:** `SQLSTATE[42S02]: Table 'dbedc_erp.onboardings' doesn't exist`
**Fix:** Run pending migrations or create migration
**Command:** `php artisan migrate`

---

### P1-04: Goals Service Method Missing (BUG-020)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 3 | My Goals page broken |
| Severity | 5 | 500 error - method doesn't exist |
| Effort | 2 | Implement missing method |
| **Priority** | **7.5** | |

**Bug:** `Call to undefined method GoalSettingService::getGoalsForUser()`
**Fix:** Implement `getGoalsForUser()` method in GoalSettingService
**File:** `packages/aero-hrm/src/Services/Performance/GoalSettingService.php`

---

### P1-05: HR Analytics Missing Column (BUG-019)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 3 | HR Analytics page broken |
| Severity | 5 | 500 error - column doesn't exist |
| Effort | 2 | Fix query or add migration |
| **Priority** | **7.5** | |

**Bug:** `Unknown column 'department_id' in 'field list'` in users table
**Fix:** Either add migration for column OR fix analytics query to use employee relationship
**File:** `packages/aero-hrm/src/Http/Controllers/AnalyticsController.php`

---

## 🟠 PRIORITY 2 - HIGH (Fix This Sprint)

### P2-01: Employee Profile Returns JSON (BUG-004)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 4 | Employee profile view broken |
| Severity | 4 | Returns raw JSON instead of page |
| Effort | 1 | Change response type |
| **Priority** | **16** | |

**Bug:** Controller returns `response()->json()` instead of `Inertia::render()`
**Fix:** Update controller to return Inertia response
**File:** `packages/aero-hrm/src/Http/Controllers/EmployeeController.php`

---

### P2-02: Employee Edit Profile Not Functional (BUG-034)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 4 | Cannot edit employees |
| Severity | 4 | Button does nothing |
| Effort | 2 | Add onClick handler |
| **Priority** | **8** | |

**Bug:** Edit Profile action in dropdown does nothing
**Fix:** Implement edit handler in EmployeeTable component
**File:** `packages/aero-hrm/resources/js/Components/EmployeeTable.jsx` or similar

---

### P2-03: Disciplinary - No Employees in Dropdown (BUG-013)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 3 | Cannot create disciplinary cases |
| Severity | 4 | Dropdown empty |
| Effort | 1 | Pass employees to view |
| **Priority** | **12** | |

**Bug:** Employee dropdown shows "No items"
**Fix:** Controller should pass employees array to Inertia view
**File:** `packages/aero-hrm/src/Http/Controllers/DisciplinaryCaseController.php`

---

### P2-04: Attendance Module Data Fetch Failure (BUG-033, BUG-037)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 4 | All attendance pages affected |
| Severity | 3 | Pages load but show errors |
| Effort | 2 | Fix API endpoints |
| **Priority** | **6** | |

**Bug:** "Failed to fetch data" error on all attendance sub-pages
**Fix:** Debug and fix attendance statistics/employees API endpoints
**Files:** 
- `packages/aero-hrm/src/Http/Controllers/AttendanceController.php`
- `packages/aero-hrm/resources/js/Pages/HRM/Attendance.jsx`

---

### P2-05: Expense Claims Not Saving (BUG-005)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 3 | Cannot create expenses |
| Severity | 4 | Form submits but no record saved |
| Effort | 2 | Debug store method |
| **Priority** | **6** | |

**Bug:** Form shows loading, returns to modal, but record not persisted
**Fix:** Debug ExpenseController store() method - likely validation or DB issue
**File:** `packages/aero-hrm/src/Http/Controllers/ExpenseController.php`

---

### P2-06: Assets Not Saving (BUG-006)
| Metric | Score | Notes |
|--------|-------|-------|
| Impact | 3 | Cannot create assets |
| Severity | 4 | Form submits but no record saved |
| Effort | 2 | Debug store method |
| **Priority** | **6** | |

**Bug:** Form shows loading, returns to modal, but record not persisted
**Fix:** Debug AssetController store() method
**File:** `packages/aero-hrm/src/Http/Controllers/AssetController.php`

---

## 🟡 PRIORITY 3 - MEDIUM (Fix Next Sprint)

### P3-01: Custom Fields Returns JSON (BUG-014)
- **Fix:** Return Inertia response instead of JSON
- **File:** `packages/aero-hrm/src/Http/Controllers/CustomFieldController.php`

### P3-02: Asset Allocations 405 (BUG-015)
- **Fix:** Add GET route for listing allocations
- **File:** `packages/aero-hrm/routes/web.php`

### P3-03: My Expenses Ziggy Route Missing (BUG-016)
- **Fix:** Register `hrm.expenses.my-claims` route
- **File:** `packages/aero-hrm/routes/web.php`

### P3-04: Leaves Data Error (BUG-002, BUG-023, BUG-036)
- **Fix:** Debug leaves API endpoint
- **File:** `packages/aero-hrm/src/Http/Controllers/LeaveController.php`

### P3-05: Dashboard Check In Not Working (BUG-022)
- **Fix:** Debug attendance recording API
- **File:** `packages/aero-hrm/src/Http/Controllers/AttendanceController.php`

### P3-06: Create Payroll Not Functional (BUG-010)
- **Fix:** Implement modal handler
- **File:** `packages/aero-hrm/resources/js/Pages/HRM/Payroll.jsx`

---

## 🔵 PRIORITY 4 - LOW (Route Registration Batch)

These are all 404 errors requiring route + controller + view creation. Group together for batch implementation:

### Training Module (6 routes)
- `/hrm/training/programs` (BUG-001)
- `/hrm/training/sessions` (BUG-017)
- `/hrm/training/trainers` (BUG-018)
- `/hrm/training/enrollment`
- `/hrm/training/attendance`
- `/hrm/training/certifications`

### Recruitment Module (3 routes)
- `/hrm/recruitment/jobs` (BUG-011)
- `/hrm/recruitment/candidates` (BUG-027)
- `/hrm/recruitment/interviews` (BUG-028)

### Performance Module (3 routes)
- `/hrm/performance/reviews` (BUG-012)
- `/hrm/performance/goals` (BUG-029)
- `/hrm/performance/appraisals` (BUG-030)

### Payroll Module (4 routes)
- `/hrm/payroll/runs` (BUG-025)
- `/hrm/payroll/salaries` (BUG-026)
- `/hrm/payroll/deductions` (BUG-031)
- `/hrm/payroll/bonuses` (BUG-032)

### Other Routes
- `/hrm/attendance` (BUG-007)
- `/hrm/time-sheets` (BUG-008)

---

## Quick Wins (< 30 min each)

1. ✅ **P1-01:** Add `employee()` relationship to Attendance model
2. ✅ **P1-03:** Run migrations for onboardings table
3. ✅ **P2-01:** Change Employee Profile to return Inertia
4. ✅ **P2-03:** Pass employees to Disciplinary Cases view
5. ✅ **P3-01:** Change Custom Fields to return Inertia
6. ✅ **P3-02:** Add GET route for Asset Allocations

---

## Recommended Fix Order

### Sprint 1 (Critical - Day 1-2)
1. P1-01: HRM Dashboard (Attendance relationship)
2. P1-03: Run migrations
3. P2-01: Employee Profile response type
4. P2-03: Disciplinary employees dropdown

### Sprint 2 (High - Day 3-5)
5. P1-02: Leave Types CRUD
6. P1-04: Goals Service method
7. P1-05: HR Analytics query fix
8. P2-02: Employee Edit handler

### Sprint 3 (Medium - Week 2)
9. P2-04: Attendance data fetch
10. P2-05: Expense Claims persistence
11. P2-06: Assets persistence
12. P3-01 to P3-06: Various fixes

### Sprint 4 (Low - Week 3+)
13. Route registration batch for Training, Recruitment, Performance, Payroll modules

---

## Document Info
- **Generated:** January 21, 2026
- **Total Bugs:** 38
- **Critical:** 5
- **High:** 10
- **Medium:** 7
- **Low (404s):** 16
