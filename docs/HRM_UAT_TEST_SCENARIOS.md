# HRM Package - Functional UAT Test Scenarios

**Test Environment:** dbedc-erp.test  
**Test Date:** January 21, 2026  
**Tester:** AI Agent (Browser Automation)  
**Package:** aero-hrm

---

## Test Categories Overview

| Category | Modules Covered | Total Tests |
|----------|-----------------|-------------|
| 1. Navigation | All HRM pages | 15 |
| 2. Employee Management | Directory, Profile | 12 |
| 3. Departments | CRUD, Filters | 8 |
| 4. Designations | CRUD, Filters | 8 |
| 5. Holidays | CRUD, Filters | 8 |
| 6. Training | Programs, Categories | 10 |
| 7. Disciplinary | Cases, Warnings, Action Types | 12 |
| 8. Assets | Inventory, Categories, Allocations | 10 |
| 9. Expenses | Claims, Categories | 8 |
| 10. Recruitment | Jobs, Applications | 8 |

**Total Tests: 99**

---

## 1. NAVIGATION TESTS

### NAV-001: Main HRM Menu Expansion
- **Action:** Click on "Human Resources" menu button
- **Expected:** Menu expands showing all HRM submenus
- **Status:** ⬜ NOT TESTED

### NAV-002: Employee Directory Navigation
- **Action:** Click "Employee Directory" link
- **Expected:** Page loads at `/hrm/employees` with employee table
- **Status:** ⬜ NOT TESTED

### NAV-003: Departments Navigation
- **Action:** Click "Departments" link
- **Expected:** Page loads at `/hrm/departments` with department table
- **Status:** ⬜ NOT TESTED

### NAV-004: Designations Navigation
- **Action:** Click "Designations" link
- **Expected:** Page loads at `/hrm/designations` with designations table
- **Status:** ⬜ NOT TESTED

### NAV-005: Organization Chart Navigation
- **Action:** Click "Organization Chart" link
- **Expected:** Page loads at `/hrm/org-chart` with department hierarchy
- **Status:** ⬜ NOT TESTED

### NAV-006: Holiday Calendar Navigation
- **Action:** Click "Holiday Calendar" link
- **Expected:** Page loads at `/hrm/holidays` with holidays table
- **Status:** ⬜ NOT TESTED

### NAV-007: Training Navigation
- **Action:** Click "Training" menu, then "Training Programs"
- **Expected:** Page loads at `/hrm/training/programs`
- **Status:** ⬜ NOT TESTED

### NAV-008: Disciplinary Cases Navigation
- **Action:** Click "Disciplinary" > "Disciplinary Cases"
- **Expected:** Page loads at `/hrm/disciplinary/cases`
- **Status:** ⬜ NOT TESTED

### NAV-009: Warnings Navigation
- **Action:** Click "Disciplinary" > "Warnings"
- **Expected:** Page loads at `/hrm/disciplinary/warnings`
- **Status:** ⬜ NOT TESTED

### NAV-010: Action Types Navigation
- **Action:** Click "Disciplinary" > "Action Types"
- **Expected:** Page loads at `/hrm/disciplinary/action-types`
- **Status:** ⬜ NOT TESTED

### NAV-011: Assets Navigation
- **Action:** Click "Assets Management" > "Asset Inventory"
- **Expected:** Page loads at `/hrm/assets`
- **Status:** ⬜ NOT TESTED

### NAV-012: Expense Claims Navigation
- **Action:** Click "Expenses & Claims" > "Expense Claims"
- **Expected:** Page loads at `/hrm/expenses`
- **Status:** ⬜ NOT TESTED

### NAV-013: Recruitment Navigation
- **Action:** Click "Recruitment" > "Job Postings"
- **Expected:** Page loads at `/hrm/recruitment/jobs`
- **Status:** ⬜ NOT TESTED

### NAV-014: Breadcrumb Navigation
- **Action:** On any HRM page, click "Home" breadcrumb
- **Expected:** Navigates to dashboard
- **Status:** ⬜ NOT TESTED

### NAV-015: Back Navigation
- **Action:** Use browser back from sub-page
- **Expected:** Returns to previous page correctly
- **Status:** ⬜ NOT TESTED

---

## 2. EMPLOYEE MANAGEMENT TESTS

### EMP-001: Employee List Display
- **Action:** Navigate to `/hrm/employees`
- **Expected:** Table displays all employees with columns: #, Employee, Contact, Department, Designation, Attendance Type, Report To, Actions
- **Status:** ⬜ NOT TESTED

### EMP-002: Employee Search Filter
- **Action:** Type "John" in search box
- **Expected:** Table filters to show only employees matching "John"
- **Status:** ⬜ NOT TESTED

### EMP-003: Employee Grid View Toggle
- **Action:** Click "Grid" button
- **Expected:** View switches to card/grid layout
- **Status:** ⬜ NOT TESTED

### EMP-004: Employee Table View Toggle
- **Action:** Click "Table" button (after Grid)
- **Expected:** View switches back to table layout
- **Status:** ⬜ NOT TESTED

### EMP-005: Employee Stats Cards Display
- **Action:** Check stats cards on page load
- **Expected:** Shows: Total Employees, Active Employees, Departments, Designations, Retention Rate, Recent Hires, Growth Rate, Attendance Types
- **Status:** ⬜ NOT TESTED

### EMP-006: Add from User List Button
- **Action:** Click "Add from User List" button
- **Expected:** Modal or page opens to select users to add as employees
- **Status:** ⬜ NOT TESTED

### EMP-007: Department Dropdown Change
- **Action:** Click department dropdown on an employee row
- **Expected:** Dropdown shows available departments for reassignment
- **Status:** ⬜ NOT TESTED

### EMP-008: Designation Dropdown Change
- **Action:** Click designation dropdown on an employee row
- **Expected:** Dropdown shows available designations for reassignment
- **Status:** ⬜ NOT TESTED

### EMP-009: Manager Assignment Dropdown
- **Action:** Click "Select manager" dropdown
- **Expected:** Shows list of potential managers
- **Status:** ⬜ NOT TESTED

### EMP-010: Employee Actions Menu
- **Action:** Click actions button (three dots) on employee row
- **Expected:** Shows View, Edit, Delete options
- **Status:** ⬜ NOT TESTED

### EMP-011: Employee Profile Navigation
- **Action:** Click employee name/avatar in table
- **Expected:** Opens employee profile page
- **Status:** ⬜ NOT TESTED

### EMP-012: Pagination Test
- **Action:** If more than 10 employees, click page 2
- **Expected:** Table shows next set of employees
- **Status:** ⬜ NOT TESTED

---

## 3. DEPARTMENT MANAGEMENT TESTS

### DEPT-001: Department List Display
- **Action:** Navigate to `/hrm/departments`
- **Expected:** Table shows all departments with columns: Department, Code, Manager, Employees, Location, Status, Established, Actions
- **Status:** ⬜ NOT TESTED

### DEPT-002: Create Department - Open Modal
- **Action:** Click "Add Department" button
- **Expected:** Modal opens with form fields: Name*, Code, Description, Parent, Manager, Location, Established Date, Active Status
- **Status:** ⬜ NOT TESTED

### DEPT-003: Create Department - Submit Form
- **Action:** Fill form: Name="Test Dept", Code="TST", submit
- **Expected:** Success toast "Department created successfully", table updates
- **Status:** ⬜ NOT TESTED

### DEPT-004: Create Department - Validation
- **Action:** Click create without filling name
- **Expected:** Validation error shown for required field
- **Status:** ⬜ NOT TESTED

### DEPT-005: Edit Department - Open Modal
- **Action:** Click edit button on a department row
- **Expected:** Modal opens with pre-filled data
- **Status:** ⬜ NOT TESTED

### DEPT-006: Edit Department - Submit Update
- **Action:** Change name, click "Update Department"
- **Expected:** Success toast, table reflects changes
- **Status:** ⬜ NOT TESTED

### DEPT-007: Delete Department
- **Action:** Click delete button on department with 0 employees
- **Expected:** Confirmation prompt, then deletion success
- **Status:** ⬜ NOT TESTED

### DEPT-008: Department Search Filter
- **Action:** Type department code in search box
- **Expected:** Table filters to matching departments
- **Status:** ⬜ NOT TESTED

---

## 4. DESIGNATION MANAGEMENT TESTS

### DESG-001: Designation List Display
- **Action:** Navigate to `/hrm/designations`
- **Expected:** Table shows all designations with proper columns
- **Status:** ⬜ NOT TESTED

### DESG-002: Create Designation - Open Modal
- **Action:** Click "Add Designation" button
- **Expected:** Modal opens with form fields
- **Status:** ⬜ NOT TESTED

### DESG-003: Create Designation - Submit Form
- **Action:** Fill form with valid data, submit
- **Expected:** Success toast, table updates with new designation
- **Status:** ⬜ NOT TESTED

### DESG-004: Create Designation - Validation
- **Action:** Submit empty form
- **Expected:** Validation errors shown
- **Status:** ⬜ NOT TESTED

### DESG-005: Edit Designation - Open Modal
- **Action:** Click edit button on a designation
- **Expected:** Modal opens with pre-filled data
- **Status:** ⬜ NOT TESTED

### DESG-006: Edit Designation - Submit Update
- **Action:** Modify fields, click update
- **Expected:** Success toast, changes reflected
- **Status:** ⬜ NOT TESTED

### DESG-007: Delete Designation
- **Action:** Click delete on designation with 0 employees
- **Expected:** Confirmation, then deletion success
- **Status:** ⬜ NOT TESTED

### DESG-008: Designation Search Filter
- **Action:** Type designation name in search
- **Expected:** Table filters correctly
- **Status:** ⬜ NOT TESTED

---

## 5. HOLIDAY MANAGEMENT TESTS

### HOL-001: Holiday List Display
- **Action:** Navigate to `/hrm/holidays`
- **Expected:** Table shows holidays with Name, Date, Type, Description columns
- **Status:** ⬜ NOT TESTED

### HOL-002: Create Holiday - Open Modal
- **Action:** Click "Add Holiday" button
- **Expected:** Modal with form: Name, Date, Type, Description, Recurring
- **Status:** ⬜ NOT TESTED

### HOL-003: Create Holiday - Submit Form
- **Action:** Fill: Name="Test Holiday", Date=2026-12-25, Type=Public, submit
- **Expected:** Success toast, holiday appears in table
- **Status:** ⬜ NOT TESTED

### HOL-004: Create Holiday - Validation
- **Action:** Submit without required fields
- **Expected:** Validation errors shown
- **Status:** ⬜ NOT TESTED

### HOL-005: Edit Holiday - Open Modal
- **Action:** Click edit on a holiday
- **Expected:** Modal with pre-filled data
- **Status:** ⬜ NOT TESTED

### HOL-006: Edit Holiday - Submit Update
- **Action:** Change name, submit
- **Expected:** Success toast, changes reflected
- **Status:** ⬜ NOT TESTED

### HOL-007: Delete Holiday
- **Action:** Click delete on a holiday
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### HOL-008: Holiday Stats Cards
- **Action:** Check stats cards on page
- **Expected:** Shows Total Holidays, Upcoming, etc.
- **Status:** ⬜ NOT TESTED

---

## 6. TRAINING MANAGEMENT TESTS

### TRN-001: Training Programs List
- **Action:** Navigate to `/hrm/training/programs`
- **Expected:** Table shows training programs
- **Status:** ⬜ NOT TESTED

### TRN-002: Training Categories List
- **Action:** Navigate to `/hrm/training/categories`
- **Expected:** Table shows training categories
- **Status:** ⬜ NOT TESTED

### TRN-003: Create Training Category - Open Modal
- **Action:** Click "Add Category" button
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### TRN-004: Create Training Category - Submit
- **Action:** Fill name, description, submit
- **Expected:** Success toast, category created
- **Status:** ⬜ NOT TESTED

### TRN-005: Edit Training Category
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### TRN-006: Delete Training Category
- **Action:** Click delete on empty category
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### TRN-007: Create Training Program - Open Modal
- **Action:** Click "Add Program" button
- **Expected:** Modal with program form fields
- **Status:** ⬜ NOT TESTED

### TRN-008: Create Training Program - Submit
- **Action:** Fill all required fields, submit
- **Expected:** Success toast, program created
- **Status:** ⬜ NOT TESTED

### TRN-009: Training Search Filter
- **Action:** Type in search box
- **Expected:** Table filters correctly
- **Status:** ⬜ NOT TESTED

### TRN-010: Training Stats Display
- **Action:** Check stats cards
- **Expected:** Shows totals for programs, categories, etc.
- **Status:** ⬜ NOT TESTED

---

## 7. DISCIPLINARY MANAGEMENT TESTS

### DISC-001: Disciplinary Cases List
- **Action:** Navigate to `/hrm/disciplinary/cases`
- **Expected:** Table shows disciplinary cases
- **Status:** ⬜ NOT TESTED

### DISC-002: Warnings List
- **Action:** Navigate to `/hrm/disciplinary/warnings`
- **Expected:** Table shows warnings with proper columns
- **Status:** ⬜ NOT TESTED

### DISC-003: Action Types List
- **Action:** Navigate to `/hrm/disciplinary/action-types`
- **Expected:** Table shows action types
- **Status:** ⬜ NOT TESTED

### DISC-004: Create Warning - Open Modal
- **Action:** Click "Add Warning" button
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### DISC-005: Create Warning - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, warning created
- **Status:** ⬜ NOT TESTED

### DISC-006: Edit Warning
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### DISC-007: Delete Warning
- **Action:** Click delete
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### DISC-008: Create Action Type - Open Modal
- **Action:** Click "Add Action Type"
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### DISC-009: Create Action Type - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, action type created
- **Status:** ⬜ NOT TESTED

### DISC-010: Edit Action Type
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### DISC-011: Delete Action Type
- **Action:** Click delete
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### DISC-012: Disciplinary Search Filters
- **Action:** Use search/filter controls
- **Expected:** Tables filter correctly
- **Status:** ⬜ NOT TESTED

---

## 8. ASSET MANAGEMENT TESTS

### AST-001: Asset Inventory List
- **Action:** Navigate to `/hrm/assets`
- **Expected:** Table shows assets with proper columns
- **Status:** ⬜ NOT TESTED

### AST-002: Asset Categories List
- **Action:** Navigate to `/hrm/assets/categories`
- **Expected:** Table shows asset categories
- **Status:** ⬜ NOT TESTED

### AST-003: Asset Allocations List
- **Action:** Navigate to `/hrm/assets/allocations`
- **Expected:** Table shows asset allocations
- **Status:** ⬜ NOT TESTED

### AST-004: Create Asset Category - Open Modal
- **Action:** Click "Add Category"
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### AST-005: Create Asset Category - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, category created
- **Status:** ⬜ NOT TESTED

### AST-006: Create Asset - Open Modal
- **Action:** Click "Add Asset"
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### AST-007: Create Asset - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, asset created
- **Status:** ⬜ NOT TESTED

### AST-008: Edit Asset
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### AST-009: Delete Asset
- **Action:** Click delete on unallocated asset
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### AST-010: Asset Search Filter
- **Action:** Type in search box
- **Expected:** Table filters correctly
- **Status:** ⬜ NOT TESTED

---

## 9. EXPENSE MANAGEMENT TESTS

### EXP-001: Expense Claims List
- **Action:** Navigate to `/hrm/expenses`
- **Expected:** Table shows expense claims
- **Status:** ⬜ NOT TESTED

### EXP-002: Expense Categories List
- **Action:** Navigate to `/hrm/expenses/categories`
- **Expected:** Table shows expense categories
- **Status:** ⬜ NOT TESTED

### EXP-003: Create Expense Category - Open Modal
- **Action:** Click "Add Category"
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### EXP-004: Create Expense Category - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, category created
- **Status:** ⬜ NOT TESTED

### EXP-005: Edit Expense Category
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### EXP-006: Delete Expense Category
- **Action:** Click delete on empty category
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### EXP-007: Expense Stats Display
- **Action:** Check stats cards
- **Expected:** Shows totals for claims, pending, approved, etc.
- **Status:** ⬜ NOT TESTED

### EXP-008: Expense Search Filter
- **Action:** Type in search box
- **Expected:** Table filters correctly
- **Status:** ⬜ NOT TESTED

---

## 10. RECRUITMENT MANAGEMENT TESTS

### REC-001: Job Postings List
- **Action:** Navigate to `/hrm/recruitment/jobs`
- **Expected:** Table shows job postings
- **Status:** ⬜ NOT TESTED

### REC-002: Applications List
- **Action:** Navigate to `/hrm/recruitment/applications`
- **Expected:** Table shows job applications
- **Status:** ⬜ NOT TESTED

### REC-003: Create Job Posting - Open Modal
- **Action:** Click "Add Job"
- **Expected:** Modal opens with form
- **Status:** ⬜ NOT TESTED

### REC-004: Create Job Posting - Submit
- **Action:** Fill form, submit
- **Expected:** Success toast, job created
- **Status:** ⬜ NOT TESTED

### REC-005: Edit Job Posting
- **Action:** Click edit, modify, submit
- **Expected:** Success toast, changes saved
- **Status:** ⬜ NOT TESTED

### REC-006: Delete Job Posting
- **Action:** Click delete on job with no applications
- **Expected:** Confirmation, deletion success
- **Status:** ⬜ NOT TESTED

### REC-007: Recruitment Stats Display
- **Action:** Check stats cards
- **Expected:** Shows totals for jobs, applications, etc.
- **Status:** ⬜ NOT TESTED

### REC-008: Recruitment Search Filter
- **Action:** Type in search box
- **Expected:** Table filters correctly
- **Status:** ⬜ NOT TESTED

---

## Test Execution Summary

| Category | Passed | Failed | Blocked | Not Tested |
|----------|--------|--------|---------|------------|
| Navigation | 0 | 0 | 0 | 15 |
| Employees | 0 | 0 | 0 | 12 |
| Departments | 0 | 0 | 0 | 8 |
| Designations | 0 | 0 | 0 | 8 |
| Holidays | 0 | 0 | 0 | 8 |
| Training | 0 | 0 | 0 | 10 |
| Disciplinary | 0 | 0 | 0 | 12 |
| Assets | 0 | 0 | 0 | 10 |
| Expenses | 0 | 0 | 0 | 8 |
| Recruitment | 0 | 0 | 0 | 8 |
| **TOTAL** | **0** | **0** | **0** | **99** |

---

## Defects Found

| ID | Test | Severity | Description | Status |
|----|------|----------|-------------|--------|
| - | - | - | - | - |

---

## Notes

- Tests marked ⬜ NOT TESTED are pending execution
- Tests marked ✅ PASSED have been verified
- Tests marked ❌ FAILED have defects logged
- Tests marked ⚠️ BLOCKED cannot be executed due to dependencies

