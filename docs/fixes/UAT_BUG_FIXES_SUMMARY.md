# UAT Bug Fixes Summary

## Session Date: June 2025

This document summarizes all bugs discovered and fixed during the HRM UAT testing session.

---

## 1. Leave Type Display Bug

**Status:** ✅ FIXED  
**Test Case:** Observed during LEAVE-003/004/005 testing

### Problem
Leave Type column in the Leaves Management table displayed raw ID (`1`) or `Unknown` instead of the human-readable leave type name (`Casual Leave`).

### Root Cause
1. **Frontend Issue:** `LeaveEmployeeTable.jsx` was directly displaying `leave.leave_type` (the foreign key ID) instead of the related leave setting name.
2. **Backend Issue:** `LeaveResource.php` was mapping wrong field names - used `$this->leaveSetting->type` but the `LeaveSetting` model uses `name` field, not `type`.

### Files Modified

#### 1. `packages/aero-ui/resources/js/Tables/HRM/LeaveEmployeeTable.jsx`
```diff
- Line 439: {leave.leave_type}
+ Line 439: {leave.leave_setting?.type || 'Unknown'}

- Lines 566-568:
- {getLeaveTypeIcon(leave.leave_type)}
- {leave.leave_type}
+ {getLeaveTypeIcon(leave.leave_setting?.type)}
+ {leave.leave_setting?.type || 'Unknown'}
```

#### 2. `packages/aero-hrm/src/Http/Resources/LeaveResource.php`
```diff
'leave_setting' => $this->when($this->relationLoaded('leaveSetting') && $this->leaveSetting, function () {
    return [
        'id' => $this->leaveSetting->id,
-       'type' => $this->leaveSetting->type,
+       'type' => $this->leaveSetting->name,
+       'name' => $this->leaveSetting->name,
+       'code' => $this->leaveSetting->code,
-       'days' => $this->leaveSetting->days,
+       'days' => $this->leaveSetting->annual_quota,
    ];
}),
```

### Verification
- Screenshot captured: `docs/screenshots/leave_type_fix_verified.png`
- Both leave records now display "Casual Leave" correctly

---

## 2. Absent Days Decimal Display Bug

**Status:** ✅ FIXED (Previous Session)  
**Test Case:** ATT-001 - Mark Attendance

### Problem
Absent days displayed with unnecessary decimal places (e.g., `5.000000000001` instead of `5`).

### Root Cause
JavaScript floating-point arithmetic precision issues when calculating absent days.

### Fix Applied
Used `Math.round()` to ensure whole number display in attendance statistics.

---

## 3. LeaveBalanceService Column Bug

**Status:** ✅ FIXED (Previous Session)  
**Test Case:** Dashboard Widget Loading

### Problem
Leave balances widget failed to load with SQL column error.

### Root Cause
`LeaveBalanceService.php` used `employee_id` column which doesn't exist - should use `user_id`.

### Fix Applied
Changed column reference from `employee_id` to `user_id` in the query.

---

## 4. Leave Status Route Bug

**Status:** ✅ FIXED (Previous Session)  
**Test Case:** LEAVE-003 - Change Leave Status

### Problem
Leave status change dropdown returned 404 error when attempting to approve/decline.

### Root Cause
Route name mismatch - frontend expected `hrm.leaves.update-status` but route was defined without `hrm.` prefix.

### Fix Applied
Updated route configuration to include proper prefix for tenant routes.

---

## 5. Employee Dashboard - LeaveBalanceService Method Error

**Status:** ✅ FIXED  
**Test Case:** ATT-002 - Employee Dashboard Loading

### Problem
Employee Dashboard failed with error: `Call to undefined method LeaveBalanceService::getEmployeeBalances()`

### Root Cause
The controller called `LeaveBalanceService::getEmployeeBalances($employee->id)` but the method is actually named `getAllBalances()` and expects an Employee model, not an ID.

### Files Modified
#### `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php`
```diff
- $leaveBalances = $leaveBalanceService->getEmployeeBalances($employee->id);
+ $leaveBalances = $leaveBalanceService->getAllBalances($employee);
```

---

## 6. Employee Dashboard - Column Name Errors

**Status:** ✅ FIXED  
**Test Case:** ATT-002 - Employee Dashboard Loading

### Problem
After fixing the method error, another error appeared: `Column not found: 'employee_id'`

### Root Cause
Both Leave and Attendance models use `user_id`, not `employee_id`. Also, the Leave relationship is named `leaveSetting` not `leaveType`, and field names differ (`from_date`/`to_date` instead of `start_date`/`end_date`).

### Files Modified
#### `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php`
```diff
Multiple changes:
- Leave::where('employee_id', $employee->id) 
+ Leave::where('user_id', $employee->user_id)

- with('leaveType')
+ with('leaveSetting')

- Attendance::where('employee_id', $employee->id)
+ Attendance::where('user_id', $employee->user_id)

Field mappings:
- start_date → from_date
- end_date → to_date
- days → no_of_days
```

---

## 7. Employee Dashboard - Date Format Error

**Status:** ✅ FIXED  
**Test Case:** ATT-002 - Employee Dashboard Loading

### Problem
After column fixes, error appeared: `Call to a member function format() on string`

### Root Cause
The `from_date` field is stored as a string in some records, not a Carbon date object. Calling `->format()` directly failed.

### Files Modified
#### `packages/aero-hrm/src/Http/Controllers/Employee/EmployeeDashboardController.php`
```diff
+ use Carbon\Carbon;

- 'date' => $leave->from_date?->format('Y-m-d'),
+ 'date' => $leave->from_date ? Carbon::parse($leave->from_date)->format('Y-m-d') : null,
```

---

## 8. Attendance Route Name Mismatch

**Status:** ✅ FIXED  
**Test Case:** ATT-002 - Employee Dashboard PunchStatusCard

### Problem
PunchStatusCard showed toast error "Failed to fetch attendance status" when loading Employee Dashboard.

### Root Cause
The frontend called `route('attendance.current-user-punch')` but the actual route name is `hrm.attendance.current-user-punch` with the `hrm.` prefix.

### Files Modified
#### `packages/aero-ui/resources/js/Components/PunchStatusCard.jsx`
```diff
- const response = await axios.get(route('attendance.current-user-punch'), {...});
+ const response = await axios.get(route('hrm.attendance.current-user-punch'), {...});

- const response = await axios.post(route('attendance.punch'), punchDataWithPhoto);
+ const response = await axios.post(route('hrm.attendance.punch'), punchDataWithPhoto);

- const response = await axios.post(route('attendance.punch'), punchData);
+ const response = await axios.post(route('hrm.attendance.punch'), punchData);
```

### Verification
- Screenshot captured: `docs/screenshots/employee_dashboard_fully_fixed.png`
- Employee Dashboard now loads without errors

---

## Summary Table

| Bug ID | Description | Severity | Status | Files Modified |
|--------|-------------|----------|--------|----------------|
| BUG-001 | Leave Type shows ID instead of name | Medium | ✅ Fixed | LeaveEmployeeTable.jsx, LeaveResource.php |
| BUG-002 | Absent days shows decimal | Low | ✅ Fixed | AttendanceController.php |
| BUG-003 | LeaveBalanceService column error | High | ✅ Fixed | LeaveBalanceService.php |
| BUG-004 | Leave status 404 route error | Critical | ✅ Fixed | Routes configuration |
| BUG-005 | LeaveBalanceService method error | Critical | ✅ Fixed | EmployeeDashboardController.php |
| BUG-006 | Dashboard employee_id column errors | Critical | ✅ Fixed | EmployeeDashboardController.php |
| BUG-007 | Dashboard date format error | Medium | ✅ Fixed | EmployeeDashboardController.php |
| BUG-008 | Attendance route name mismatch | Medium | ✅ Fixed | PunchStatusCard.jsx |
| BUG-009 | Recruitment form field mismatch | High | ✅ Fixed | Recruitment/Index.jsx |
| BUG-010 | job_hiring_stages missing deleted_at | Critical | ✅ Fixed | Migration added |

---

## 9. Recruitment Form Field Mismatch

**Status:** ✅ FIXED  
**Test Case:** REC-002 - Create Job Opening

### Problem
Creating a new job opening returned 422 validation error with messages:
- "The type field is required"
- "The requirements field must be an array"
- "The salary currency field is required"
- "The status field is required"

### Root Cause
Frontend form fields didn't match backend validation expectations:
1. Frontend used `employment_type`, backend expected `type`
2. Frontend sent requirements as string, backend expected array
3. Missing `salary_currency` and `status` fields in form

### Files Modified
#### `packages/aero-ui/resources/js/Pages/HRM/Recruitment/Index.jsx`
- Changed `employment_type` to `type` in formData, handlers, and table columns
- Added `salary_currency` (default: 'PHP') and `status` (default: 'draft') to formData
- Added payload transformation to convert requirements string to array
- Added Currency and Status dropdowns to the job creation modal
- Updated employment type options to include `temporary` and `remote`

### Verification
- Successfully created "Senior Software Engineer" job opening
- Screenshot captured: `docs/screenshots/recruitment_job_created.png`

---

## 10. job_hiring_stages Missing SoftDeletes Column

**Status:** ✅ FIXED  
**Test Case:** REC-002 - Recruitment Page Loading

### Problem
After creating a job, navigating to recruitment page caused 500 error:
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'job_hiring_stages.deleted_at' in 'where clause'
```

### Root Cause
The `JobHiringStage` model uses the `SoftDeletes` trait but the original migration didn't include the `deleted_at` column.

### Files Modified
#### New Migration: `2026_01_26_051223_add_deleted_at_to_job_hiring_stages_table.php`
```php
public function up(): void
{
    Schema::table('job_hiring_stages', function (Blueprint $table) {
        if (! Schema::hasColumn('job_hiring_stages', 'deleted_at')) {
            $table->softDeletes();
        }
    });
}
```

### Verification
- Ran migration successfully
- Recruitment page now loads without errors
- Job listings display correctly
- Screenshot captured: `docs/screenshots/recruitment_page_fixed.png`

---

## UAT Test Results After Fixes

| Test Case | Description | Result |
|-----------|-------------|--------|
| LEAVE-003 | Create Leave Request | ✅ PASS |
| LEAVE-004 | Approve Leave Request | ✅ PASS |
| LEAVE-005 | Decline Leave Request | ✅ PASS |
| ATT-002 | Employee Dashboard Loading | ✅ PASS |
| ATT-003 | My Attendance Page | ✅ PASS |
| REC-002 | Create Job Opening | ✅ PASS |

All tested modules now working correctly with proper UI display.
