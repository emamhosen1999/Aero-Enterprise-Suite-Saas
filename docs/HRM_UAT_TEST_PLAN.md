# HRM Module - User Acceptance Testing (UAT) Plan

## Document Information
- **Module:** Human Resource Management (HRM)
- **Version:** 1.0
- **Date:** January 10, 2026
- **Application:** DBEDC ERP (Aero Enterprise Suite)
- **Test Environment:** https://dbedc-erp.test

---

## 1. Test Objectives

### Primary Goals
1. Verify all HRM pages load correctly without errors
2. Validate navigation between HRM modules
3. Confirm CRUD operations work for each entity
4. Test permission-based access controls
5. Verify data displays correctly in tables
6. Test filter and search functionality
7. Validate form submissions and error handling
8. Confirm dashboard widgets display correct data

---

## 2. Test Scope

### In-Scope Modules
| Module | Submodules |
|--------|------------|
| **Core HRM** | Dashboard, Organization Chart |
| **Employee Management** | Employee Directory, Departments, Designations, Work Locations |
| **Attendance** | Admin View, Employee Self-Service, Time Sheets |
| **Leave Management** | Admin View, Employee Requests, Leave Types, Holidays |
| **Payroll** | Salary Processing, Expense Claims |
| **Performance** | Reviews, Goals, Disciplinary Cases |
| **Recruitment** | Job Postings, Applications, Interview Scheduling |
| **Onboarding** | New Hire Setup, Document Collection, Training Assignment |
| **Offboarding** | Exit Process, Clearance, Final Settlement |
| **Training** | Sessions, Courses, Certifications |
| **Reports & Analytics** | Attendance Reports, Leave Analytics, HR Metrics |

### Out-of-Scope
- API integrations with external systems
- Mobile responsiveness (separate testing)
- Performance/load testing

---

## 3. Test Scenarios

### 3.1 Authentication & Authorization

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| AUTH-01 | Admin Login | 1. Navigate to /login<br>2. Enter admin credentials<br>3. Click Sign In | Redirect to dashboard with full menu access | Critical |
| AUTH-02 | Permission Check | 1. Login as admin<br>2. Access HRM modules | All HRM menu items visible and accessible | Critical |
| AUTH-03 | Session Persistence | 1. Login<br>2. Navigate between pages | Session maintained, no re-login required | High |

### 3.2 HRM Dashboard

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| DASH-01 | Dashboard Load | 1. Navigate to /hrm/dashboard | Page loads with stats cards and widgets | Critical |
| DASH-02 | Widget Display | 1. View dashboard<br>2. Check all widgets | All widgets render with data or empty states | High |
| DASH-03 | Quick Actions | 1. View dashboard<br>2. Click quick action buttons | Actions navigate to correct pages | Medium |

### 3.3 Employee Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| EMP-01 | Employee List View | 1. Navigate to /hrm/employees | Table displays with pagination, filters | Critical |
| EMP-02 | Employee Search | 1. Enter search term<br>2. View results | Results filtered by name/email/ID | High |
| EMP-03 | Department Filter | 1. Select department filter<br>2. View results | Only employees from that department shown | High |
| EMP-04 | Add Employee | 1. Click "Add Employee"<br>2. Fill form<br>3. Submit | Employee created, success toast shown | Critical |
| EMP-05 | Edit Employee | 1. Click edit on employee row<br>2. Modify data<br>3. Save | Changes saved, table updated | Critical |
| EMP-06 | View Employee Profile | 1. Click employee name | Profile page loads with full details | High |
| EMP-07 | Deactivate Employee | 1. Click action menu<br>2. Select deactivate | Status changed, employee marked inactive | High |

### 3.4 Department Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| DEPT-01 | Department List | 1. Navigate to /hrm/departments | Table shows all departments | Critical |
| DEPT-02 | Add Department | 1. Click "Add Department"<br>2. Fill name, head<br>3. Submit | Department created | High |
| DEPT-03 | Edit Department | 1. Click edit<br>2. Change details<br>3. Save | Changes saved | High |
| DEPT-04 | Delete Department | 1. Click delete<br>2. Confirm | Department removed (if no employees) | Medium |
| DEPT-05 | View Employees | 1. Click department<br>2. View employee count | Shows employees in department | Medium |

### 3.5 Designation Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| DESG-01 | Designation List | 1. Navigate to /hrm/designations | Table shows all designations | Critical |
| DESG-02 | Add Designation | 1. Click "Add"<br>2. Fill form<br>3. Submit | Designation created | High |
| DESG-03 | Edit Designation | 1. Edit existing<br>2. Save | Changes persisted | High |

### 3.6 Attendance Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| ATT-01 | Attendance Admin View | 1. Navigate to /hrm/attendance | Admin attendance table loads | Critical |
| ATT-02 | Date Filter | 1. Select date range<br>2. Apply filter | Records filtered by date | High |
| ATT-03 | Employee Filter | 1. Select employee<br>2. Apply | Only that employee's records shown | High |
| ATT-04 | Mark Attendance | 1. Click "Mark Attendance"<br>2. Select employee, date, status<br>3. Submit | Attendance record created | Critical |
| ATT-05 | Edit Attendance | 1. Edit existing record | Changes saved | High |
| ATT-06 | Bulk Attendance | 1. Select multiple employees<br>2. Mark bulk attendance | All selected marked | Medium |

### 3.7 Timesheet Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| TS-01 | Timesheet List | 1. Navigate to /hrm/timesheets | Table with timesheet entries | Critical |
| TS-02 | Add Timesheet Entry | 1. Click Add<br>2. Fill hours, project<br>3. Submit | Entry created | High |
| TS-03 | Approve Timesheet | 1. Select pending timesheet<br>2. Approve | Status changed to approved | High |

### 3.8 Leave Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| LV-01 | Leave Admin View | 1. Navigate to /hrm/leaves/admin | All leave requests visible | Critical |
| LV-02 | Pending Filter | 1. Filter by "Pending" status | Only pending leaves shown | High |
| LV-03 | Approve Leave | 1. Select pending leave<br>2. Click Approve | Status updated, balance deducted | Critical |
| LV-04 | Reject Leave | 1. Select pending leave<br>2. Click Reject<br>3. Add reason | Status rejected, balance unchanged | Critical |
| LV-05 | Leave Types | 1. Navigate to /hrm/leave-types | All leave types listed | High |
| LV-06 | Holiday List | 1. Navigate to /hrm/holidays | Holidays displayed | High |
| LV-07 | Add Holiday | 1. Click Add<br>2. Enter date, name<br>3. Save | Holiday added | High |

### 3.9 Employee Self-Service

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| SS-01 | My Attendance | 1. Navigate to /hrm/self-service/attendance | Own attendance records | Critical |
| SS-02 | Punch In/Out | 1. Click Punch In<br>2. Later click Punch Out | Time recorded | Critical |
| SS-03 | Request Leave | 1. Navigate to /hrm/self-service/leaves<br>2. Click Request<br>3. Fill form | Leave request submitted | Critical |
| SS-04 | Leave Balance | 1. View leave dashboard | Balance shown for each type | High |
| SS-05 | My Profile | 1. Navigate to /hrm/self-service/profile | Own profile displayed | High |

### 3.10 Payroll

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| PAY-01 | Payroll List | 1. Navigate to /hrm/payroll | Payroll records displayed | Critical |
| PAY-02 | Expense Claims | 1. Navigate to /hrm/expense-claims | Claims list shown | High |
| PAY-03 | Submit Claim | 1. Click Add Claim<br>2. Fill details<br>3. Submit | Claim created with pending status | High |
| PAY-04 | Approve Claim | 1. Select claim<br>2. Approve | Status updated | High |

### 3.11 Performance Management

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| PERF-01 | Reviews List | 1. Navigate to /hrm/performance/reviews | Reviews table loads | Critical |
| PERF-02 | Create Review | 1. Click Add<br>2. Select employee, period<br>3. Submit | Review created | High |
| PERF-03 | Goals List | 1. Navigate to /hrm/goals | Goals displayed | High |
| PERF-04 | Add Goal | 1. Click Add<br>2. Fill target, deadline<br>3. Save | Goal created | High |
| PERF-05 | Disciplinary Cases | 1. Navigate to /hrm/disciplinary-cases | Cases listed | High |

### 3.12 Recruitment

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| REC-01 | Job Postings | 1. Navigate to /hrm/recruitment | Jobs list displayed | Critical |
| REC-02 | Create Job | 1. Click Add Job<br>2. Fill title, description<br>3. Publish | Job posted | Critical |
| REC-03 | View Applications | 1. Click on job<br>2. View applicants | Applicant list shown | High |
| REC-04 | Schedule Interview | 1. Select applicant<br>2. Schedule interview | Interview scheduled | High |

### 3.13 Onboarding

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| ONB-01 | Onboarding List | 1. Navigate to /hrm/onboarding | Active onboardings shown | Critical |
| ONB-02 | Start Onboarding | 1. Click Add<br>2. Select new hire<br>3. Start | Onboarding process initiated | Critical |
| ONB-03 | Update Progress | 1. Select onboarding<br>2. Mark tasks complete | Progress updated | High |
| ONB-04 | Assign Mentor | 1. Select onboarding<br>2. Assign mentor | Mentor assigned | Medium |

### 3.14 Offboarding

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| OFF-01 | Offboarding List | 1. Navigate to /hrm/offboarding | Exit processes shown | Critical |
| OFF-02 | Start Offboarding | 1. Click Add<br>2. Select employee<br>3. Set last day | Offboarding initiated | Critical |
| OFF-03 | Clearance Process | 1. Select offboarding<br>2. Complete clearance steps | Steps marked complete | High |

### 3.15 Training

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| TRN-01 | Training Sessions | 1. Navigate to /hrm/training | Sessions list displayed | Critical |
| TRN-02 | Create Session | 1. Click Add<br>2. Fill details<br>3. Save | Session created | High |
| TRN-03 | Enroll Employees | 1. Select session<br>2. Add participants | Employees enrolled | High |
| TRN-04 | Mark Completion | 1. Select participant<br>2. Mark complete | Status updated | High |

### 3.16 Reports & Analytics

| ID | Scenario | Steps | Expected Result | Priority |
|----|----------|-------|-----------------|----------|
| RPT-01 | Analytics Dashboard | 1. Navigate to /hrm/analytics | Charts and metrics load | Critical |
| RPT-02 | Attendance Report | 1. View attendance analytics | Charts display data | High |
| RPT-03 | Leave Report | 1. View leave analytics | Leave stats shown | High |
| RPT-04 | Export Data | 1. Click Export<br>2. Select format | File downloaded | Medium |

---

## 4. Test Data Requirements

### Test Users
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Admin | admin@dbedc.com | password | Full access testing |
| HR Manager | hr@dbedc.com | password | HRM module access |
| Employee | employee@dbedc.com | password | Self-service testing |

### Test Data
- Minimum 5 departments
- Minimum 10 employees
- Minimum 5 leave types
- Minimum 3 job postings
- Sample attendance records for last 30 days

---

## 5. Test Execution Tracking

### Test Run Summary
| Date | Tester | Scenarios Executed | Pass | Fail | Blocked |
|------|--------|-------------------|------|------|---------|
| 2026-01-10 | Automated | TBD | TBD | TBD | TBD |

### Defects Log
| ID | Scenario | Description | Severity | Status |
|----|----------|-------------|----------|--------|
| - | - | - | - | - |

---

## 6. Pass/Fail Criteria

### Pass Criteria
- All Critical priority tests must pass
- 90% of High priority tests must pass
- No critical/blocking defects open

### Fail Criteria
- Any Critical test fails
- More than 2 High priority tests fail
- Data integrity issues found

---

## 7. Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| QA Lead | | | |
| Product Owner | | | |
| Dev Lead | | | |
