# UI/UX User Acceptance Testing (UAT) Plan

## Test Environment
- **Application URL:** https://dbedc-erp.test
- **Test Date:** January 6, 2026
- **Tester:** Automated Browser Tools
- **Browser:** Chrome (DevTools MCP)

---

## Test Status Legend
- ✅ PASS - Test passed successfully
- ❌ FAIL - Test failed
- ⚠️ ISSUE - Test passed with issues
- 🔄 PENDING - Test not yet executed
- ⏭️ SKIPPED - Test skipped (dependency failed)

---

# MODULE 1: DASHBOARD

## 1.1 Role-Based Dashboard Routing
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DASH-001 | Login as Super Admin | Login with admin credentials | Redirects to Core Dashboard (/dashboard) | 🔄 | Default admin user |
| DASH-002 | Admin Dashboard Load | Check dashboard after login | Core Dashboard loads with system widgets | 🔄 | No HR widgets visible |
| DASH-003 | Login as HR Manager | Login with HR Manager role | Redirects to HRM Dashboard (/hrm/dashboard) | 🔄 | |
| DASH-004 | HRM Dashboard Load | Check HRM dashboard | Shows HR analytics and metrics | 🔄 | No core system widgets |
| DASH-005 | Login as Employee | Login with Employee role | Redirects to Employee Dashboard (/hrm/employee/dashboard) | 🔄 | |
| DASH-006 | Employee Dashboard Load | Check employee dashboard | Shows personal widgets (leaves, attendance, payslip) | 🔄 | No admin or HR widgets |
| DASH-007 | Dashboard URL Access | Try accessing /dashboard directly as Employee | Redirects to assigned dashboard | 🔄 | Should redirect based on role |
| DASH-008 | Unauthorized Access | Try accessing /hrm/dashboard as Employee | Shows 403 or redirects | 🔄 | Permission check |

## 1.2 Core Dashboard (System Admin)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DASH-010 | Page Load | Navigate to /dashboard as admin | Page loads with greeting | 🔄 | |
| DASH-011 | Greeting Display | Check greeting text | Shows "Good [time], [User]!" | 🔄 | |
| DASH-012 | Date Display | Check date | Shows current date | 🔄 | |
| DASH-013 | Stats Cards | Verify 4 stat cards | Total Users, Active Users, Inactive Users, Total Roles | 🔄 | System-level stats only |
| DASH-014 | Recent Activity | Check activity section | Shows activity log or empty state | 🔄 | |
| DASH-015 | My Goals | Check goals section | Shows goals or "Set Your First Goal" | 🔄 | |
| DASH-016 | Security Widget | Check security stats | Failed logins, Sessions, Devices | 🔄 | Admin security metrics |
| DASH-017 | Notifications Widget | Check notifications | Shows count and list | 🔄 | System notifications |
| DASH-018 | Products Widget | Check products | Shows active products | 🔄 | |
| DASH-019 | Upcoming Holidays | Check holidays | Shows holidays or empty state | 🔄 | |
| DASH-020 | Organization Widget | Check org stats | Departments, Designations, Locations | 🔄 | Organization overview |
| DASH-021 | Pending Reviews | Check reviews | Shows pending or "All caught up" | 🔄 | |
| DASH-022 | NO HR Widgets | Verify HR widgets absent | No employee stats, attendance, leave requests | 🔄 | Widget separation |

## 1.3 HRM Dashboard (HR Manager)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DASH-030 | Page Load | Navigate to /hrm/dashboard as HR Manager | HRM Dashboard loads | 🔄 | |
| DASH-031 | Page Title | Check page header | "HR Management Dashboard" or similar | 🔄 | |
| DASH-032 | Employee Stats Cards | Verify 4 stat cards | Total Employees, Active Today, Pending Leaves, On Leave | 🔄 | HR-specific metrics |
| DASH-033 | Pending Leave Requests | Check leave requests section | Shows pending leave list with employee details | 🔄 | Top 10 pending leaves |
| DASH-034 | Leave Request Avatars | Check employee avatars | Employee photos/initials display | 🔄 | Visual representation |
| DASH-035 | Leave Request Status | Check status chips | Chips show Pending, Approved, Rejected | 🔄 | Color-coded status |
| DASH-036 | Leave Request Actions | Check action buttons | Approve/Reject buttons visible | 🔄 | Quick actions |
| DASH-037 | Department Overview | Check department section | Shows departments with attendance rates | 🔄 | Department breakdown |
| DASH-038 | Department Progress Bars | Check progress bars | Visual attendance rate per department | 🔄 | Progress indicators |
| DASH-039 | Attendance Summary Sidebar | Check attendance sidebar | Shows Present, Absent, Late, On Leave counts | 🔄 | Today's attendance |
| DASH-040 | HR Metrics Cards | Check HR metrics | Open Positions, Pending Expenses, New Hires | 🔄 | Additional HR KPIs |
| DASH-041 | Recent Activity Feed | Check activity section | Shows recent HR activities | 🔄 | Activity log |
| DASH-042 | Stats Async Loading | Check stats endpoint | /hrm/dashboard/stats loads data | 🔄 | Async data fetching |
| DASH-043 | Loading Skeletons | Check loading state | Skeleton loaders appear during fetch | 🔄 | UX enhancement |
| DASH-044 | NO Core Widgets | Verify core widgets absent | No system users, security stats | 🔄 | Widget separation |
| DASH-045 | NO Employee Widgets | Verify employee widgets absent | No personal leave balance, payslip access | 🔄 | Role-specific widgets |

## 1.4 Employee Dashboard (Regular Employee)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DASH-050 | Page Load | Navigate to /hrm/employee/dashboard | Employee Dashboard loads | 🔄 | |
| DASH-051 | Page Title | Check page header | "My Dashboard" or "Employee Dashboard" | 🔄 | |
| DASH-052 | Leave Balance Cards | Check leave balance | Shows annual, sick, casual leave balances | 🔄 | Personal leave data |
| DASH-053 | Apply Leave Button | Check quick actions | "Apply Leave" button present | 🔄 | Quick access to leave form |
| DASH-054 | Attendance Summary | Check attendance widget | Shows personal attendance (days present, absent, late) | 🔄 | Employee's own data |
| DASH-055 | Payslip Access | Check payslip section | Shows latest payslip or download link | 🔄 | Payroll self-service |
| DASH-056 | My Leave Requests | Check leave history | Shows employee's own leave requests | 🔄 | Personal history only |
| DASH-057 | Leave Request Status | Check status display | Shows Pending, Approved, Rejected status | 🔄 | Own request statuses |
| DASH-058 | Quick Actions Panel | Check quick actions | Clock In/Out, Apply Leave, View Payslip | 🔄 | Self-service actions |
| DASH-059 | My Attendance Graph | Check attendance chart | Visual representation of monthly attendance | 🔄 | Personal analytics |
| DASH-060 | Upcoming Holidays | Check holidays | Shows upcoming company holidays | 🔄 | Calendar information |
| DASH-061 | NO Admin Widgets | Verify admin widgets absent | No user management, role stats | 🔄 | Widget separation |
| DASH-062 | NO HR Manager Widgets | Verify HR widgets absent | No pending approvals, department stats | 🔄 | Role-specific widgets |
| DASH-063 | NO Other Employee Data | Verify data scope | Only shows own data, not other employees | 🔄 | Data privacy |

## 1.5 Dashboard Assignment in Role Management
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DASH-070 | Navigate to Roles | Go to Roles & Module Access | Opens roles page | 🔄 | |
| DASH-071 | Edit Role Form | Click edit on a role | Opens role edit form | 🔄 | |
| DASH-072 | Dashboard Selector Present | Check form fields | "Default Dashboard" dropdown present | 🔄 | New field added |
| DASH-073 | Dashboard Options | Open dashboard dropdown | Shows: None, Core Dashboard, HRM Dashboard, Employee Dashboard | 🔄 | All 4 options |
| DASH-074 | Assign Core Dashboard | Select "Core Dashboard" for admin role | Saves successfully | 🔄 | Admin assignment |
| DASH-075 | Assign HRM Dashboard | Select "HRM Dashboard" for HR Manager | Saves successfully | 🔄 | HR Manager assignment |
| DASH-076 | Assign Employee Dashboard | Select "Employee Dashboard" for Employee role | Saves successfully | 🔄 | Employee assignment |
| DASH-077 | None Option | Select "None" for custom role | Uses default routing logic | 🔄 | Fallback behavior |
| DASH-078 | Verify Assignment | Check role after save | Dashboard assignment persists | 🔄 | Data persistence |
| DASH-079 | Login After Assignment | Login with role after dashboard change | Redirects to newly assigned dashboard | 🔄 | Routing works |

---

# MODULE 2: USER MANAGEMENT

## 2.1 Users List
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| USER-001 | Navigate to Users | Click User Management > Users | Opens /users page | 🔄 | |
| USER-002 | Page Title | Check page header | "User Management" title | 🔄 | |
| USER-003 | Search Input | Locate search box | Search input present | 🔄 | |
| USER-004 | Role Filter | Locate role dropdown | Role filter dropdown present | 🔄 | |
| USER-005 | Status Filter | Locate status filter | Status filter present | 🔄 | |
| USER-006 | Add User Button | Locate add button | "Add User" or "Invite User" button | 🔄 | |
| USER-007 | Users Table | Check table structure | Shows user list with columns | 🔄 | |
| USER-008 | Search Functionality | Type in search box | Filters users by name/email | 🔄 | |
| USER-009 | Role Filter Apply | Select a role | Filters users by role | 🔄 | |
| USER-010 | Add User Modal | Click Add User | Opens add user form modal | 🔄 | |
| USER-011 | Edit User | Click edit on a user | Opens edit form | 🔄 | |
| USER-012 | Delete User | Click delete on a user | Shows confirmation dialog | 🔄 | |

## 2.2 Invite User
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| USER-020 | Invite Button | Click Invite User | Opens invite modal | 🔄 | |
| USER-021 | Email Field | Check invite form | Email input field present | 🔄 | |
| USER-022 | Role Selection | Check role field | Role dropdown present | 🔄 | |
| USER-023 | Send Invite | Submit invite form | Sends invitation email | 🔄 | |

---

# MODULE 3: ROLES & MODULE ACCESS

## 3.1 Roles Management
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| ROLE-001 | Navigate to Roles | Click Roles & Module Access | Opens roles page | 🔄 | |
| ROLE-002 | Roles List | Check roles display | Shows list of roles | 🔄 | |
| ROLE-003 | Add Role Button | Locate add role button | Button present | 🔄 | |
| ROLE-004 | Create Role | Click add, fill form | Creates new role | 🔄 | |
| ROLE-005 | Edit Role | Click edit on role | Opens edit form | 🔄 | |
| ROLE-006 | Permissions Matrix | Check permissions | Shows module permissions | 🔄 | |
| ROLE-007 | Assign Permissions | Toggle permissions | Updates role permissions | 🔄 | |

---

# MODULE 4: HUMAN RESOURCES (HRM)

## 4.1 Employee Directory
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-001 | Navigate to Employees | Click HRM > Employees > Employee Directory | Opens /hrm/employees | 🔄 | |
| HRM-002 | Page Title | Check header | "Employee Directory" title | 🔄 | |
| HRM-003 | Stats Cards | Count stat cards | 8 stats cards present | 🔄 | |
| HRM-004 | Add Button | Locate add button | "Add from User List" present | 🔄 | |
| HRM-005 | Search Input | Check search box | Employee search present | 🔄 | |
| HRM-006 | View Toggle | Check Table/Grid buttons | Both view options present | 🔄 | |
| HRM-007 | Table Headers | Check column headers | All columns present | 🔄 | |
| HRM-008 | Empty State | Check empty message | "No employees found" if empty | 🔄 | |
| HRM-009 | Pagination | Check pagination | Pagination controls present | 🔄 | |
| HRM-010 | Add Employee | Click add button | Opens user selection | 🔄 | |

## 4.2 Departments
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-020 | Navigate to Departments | Click HRM > Employees > Departments | Opens /hrm/departments | 🔄 | |
| HRM-021 | Page Title | Check header | "Departments" title | 🔄 | |
| HRM-022 | Add Department Button | Locate add button | Add button present | 🔄 | |
| HRM-023 | Departments Table | Check table | Shows department list | 🔄 | |
| HRM-024 | Create Department | Click add, fill form | Opens create modal | 🔄 | |
| HRM-025 | Department Name Input | Fill name field | Accepts text input | 🔄 | |
| HRM-026 | Parent Department | Select parent | Dropdown with departments | 🔄 | |
| HRM-027 | Save Department | Submit form | Creates department | 🔄 | |
| HRM-028 | Edit Department | Click edit action | Opens edit modal | 🔄 | |
| HRM-029 | Delete Department | Click delete action | Shows confirmation | 🔄 | |

## 4.3 Designations
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-030 | Navigate to Designations | Click HRM > Employees > Designations | Opens /hrm/designations | 🔄 | |
| HRM-031 | Page Title | Check header | "Designations" title | 🔄 | |
| HRM-032 | Add Designation Button | Locate add button | Add button present | 🔄 | |
| HRM-033 | Create Designation | Click add, fill form | Opens create modal | 🔄 | |
| HRM-034 | Designation Name | Fill name field | Accepts text input | 🔄 | |
| HRM-035 | Department Selection | Select department | Dropdown present | 🔄 | |
| HRM-036 | Save Designation | Submit form | Creates designation | 🔄 | |

## 4.4 Attendance
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-040 | Navigate to Attendance | Click HRM > Attendance | Opens attendance section | 🔄 | |
| HRM-041 | Daily Attendance | Click Daily Attendance | Opens daily view | 🔄 | |
| HRM-042 | Date Picker | Select date | Filters by date | 🔄 | |
| HRM-043 | Attendance Records | Check table | Shows attendance data | 🔄 | |
| HRM-044 | Clock In/Out | Check clock buttons | Clock actions available | 🔄 | |
| HRM-045 | Attendance Types | Navigate to types | Opens types management | 🔄 | |
| HRM-046 | Create Attendance Type | Add new type | Creates attendance type | 🔄 | |

## 4.5 Leaves
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-050 | Navigate to Leaves | Click HRM > Leaves | Opens leaves section | 🔄 | |
| HRM-051 | Leave Dashboard | Check dashboard | Shows leave stats | 🔄 | |
| HRM-052 | Apply Leave Button | Locate apply button | Apply leave present | 🔄 | |
| HRM-053 | Leave Form | Click apply | Opens leave form | 🔄 | |
| HRM-054 | Leave Type Select | Select leave type | Dropdown works | 🔄 | |
| HRM-055 | Date Range | Select dates | Date pickers work | 🔄 | |
| HRM-056 | Submit Leave | Submit form | Creates leave request | 🔄 | |
| HRM-057 | Leave Approvals | Navigate to approvals | Shows pending approvals | 🔄 | |
| HRM-058 | Approve Leave | Click approve | Approves request | 🔄 | |
| HRM-059 | Reject Leave | Click reject | Rejects with reason | 🔄 | |

## 4.6 Payroll
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-060 | Navigate to Payroll | Click HRM > Payroll | Opens payroll section | 🔄 | |
| HRM-061 | Salary Structures | Click Salary Structures | Opens salary config | 🔄 | |
| HRM-062 | Create Structure | Add new structure | Opens form modal | 🔄 | |
| HRM-063 | Payslips | Navigate to payslips | Shows payslip list | 🔄 | |
| HRM-064 | Generate Payslip | Click generate | Generates payslip | 🔄 | |

## 4.7 Recruitment
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-070 | Navigate to Recruitment | Click HRM > Recruitment | Opens recruitment | 🔄 | |
| HRM-071 | Job Openings | Check openings list | Shows job list | 🔄 | |
| HRM-072 | Create Job | Click add job | Opens job form | 🔄 | |
| HRM-073 | Job Title Input | Fill title | Accepts input | 🔄 | |
| HRM-074 | Job Description | Fill description | Rich text editor works | 🔄 | |
| HRM-075 | Applications | View applications | Shows applicant list | 🔄 | |

## 4.8 Performance
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-080 | Navigate to Performance | Click HRM > Performance | Opens performance | 🔄 | |
| HRM-081 | Reviews List | Check reviews | Shows review list | 🔄 | |
| HRM-082 | Create Review | Click create | Opens review form | 🔄 | |
| HRM-083 | Goals | Navigate to goals | Shows goals list | 🔄 | |
| HRM-084 | Create Goal | Add new goal | Opens goal form | 🔄 | |

## 4.9 Training
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| HRM-090 | Navigate to Training | Click HRM > Training | Opens training | 🔄 | |
| HRM-091 | Training Programs | Check programs list | Shows programs | 🔄 | |
| HRM-092 | Create Program | Click add | Opens form | 🔄 | |
| HRM-093 | Enroll Employees | Add enrollments | Enrollment works | 🔄 | |

---

# MODULE 5: ENTERPRISE PROJECT INTELLIGENCE

## 5.1 Intelligent Scheduling
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| PROJ-001 | Navigate to Scheduling | Click Project > Scheduling | Opens scheduling | 🔄 | |
| PROJ-002 | Gantt Chart | Check Gantt view | Gantt chart displays | 🔄 | |
| PROJ-003 | Task List | Check task list | Shows tasks | 🔄 | |
| PROJ-004 | Create Task | Add new task | Opens task form | 🔄 | |

## 5.2 BOQ & Smart Certification
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| PROJ-010 | Navigate to BOQ | Click Project > BOQ | Opens BOQ page | 🔄 | |
| PROJ-011 | BOQ Items | Check items list | Shows BOQ items | 🔄 | |
| PROJ-012 | Add BOQ Item | Click add | Opens item form | 🔄 | |
| PROJ-013 | Certifications | Navigate to certs | Shows certificates | 🔄 | |

## 5.3 BIM & Engineering
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| PROJ-020 | Navigate to BIM | Click Project > BIM | Opens BIM page | 🔄 | |
| PROJ-021 | Models List | Check models | Shows BIM models | 🔄 | |
| PROJ-022 | Upload Model | Click upload | Opens upload form | 🔄 | |

---

# MODULE 6: RFI & SITE INTELLIGENCE

## 6.1 RFI Tracker
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| RFI-001 | Navigate to RFI | Click RFI > RFI Tracker | Opens /rfi/inspections | 🔄 | |
| RFI-002 | Page Title | Check header | "RFI Tracker" or similar | 🔄 | |
| RFI-003 | Stats Cards | Check stats | RFI statistics present | 🔄 | |
| RFI-004 | Create RFI Button | Locate create button | Button present | 🔄 | |
| RFI-005 | RFI Table | Check table | Shows RFI list | 🔄 | |
| RFI-006 | Create RFI | Click create | Opens RFI form | 🔄 | |
| RFI-007 | RFI Title Input | Fill title | Accepts input | 🔄 | |
| RFI-008 | Location Select | Select location | Dropdown works | 🔄 | |
| RFI-009 | Submit RFI | Submit form | Creates RFI | 🔄 | |
| RFI-010 | View RFI Details | Click on RFI | Opens details page | 🔄 | |

## 6.2 Linear Topology - Digital Twin Map
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| RFI-020 | Navigate to Map | Click RFI > Linear > Digital Twin Map | Opens /rfi/linear/map | 🔄 | |
| RFI-021 | Map Display | Check map | Map renders | 🔄 | |
| RFI-022 | Map Controls | Check controls | Zoom, pan available | 🔄 | |

## 6.3 Continuity Validator
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| RFI-030 | Navigate to Validator | Click RFI > Linear > Continuity Validator | Opens /rfi/linear/gaps | 🔄 | |
| RFI-031 | Gaps List | Check gaps | Shows continuity gaps | 🔄 | |

## 6.4 Objections & Disputes
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| RFI-040 | Navigate to Objections | Click RFI > Objections | Opens objections page | 🔄 | |
| RFI-041 | Objections List | Check list | Shows objections | 🔄 | |
| RFI-042 | Create Objection | Click create | Opens form | 🔄 | |

---

# MODULE 7: HSE & COMPLIANCE

## 7.1 Compliance Dashboard
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| COMP-001 | Navigate to Compliance | Click Compliance Dashboard | Opens /compliance | 🔄 | |
| COMP-002 | Page Title | Check header | "Compliance Dashboard" | 🔄 | |
| COMP-003 | Stats Cards | Check 4 stat cards | Score, Policies, Risks, Training | 🔄 | |
| COMP-004 | Time Filter | Check Month/Year buttons | Filter buttons present | 🔄 | |
| COMP-005 | Policy Updates | Check section | Recent updates or empty | 🔄 | |
| COMP-006 | High Priority Risks | Check section | Risks or empty state | 🔄 | |
| COMP-007 | Upcoming Audits | Check section | Audits or empty | 🔄 | |
| COMP-008 | Compliance Metrics | Check metrics | 3 percentage metrics | 🔄 | |
| COMP-009 | New Policy Button | Locate button | Button present | 🔄 | |
| COMP-010 | Report Risk Button | Locate button | Button present | 🔄 | |
| COMP-011 | View Reports Button | Locate button | Button present | 🔄 | |

## 7.2 Site Safety (HSE)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| COMP-020 | Navigate to HSE | Click Compliance > Site Safety | Opens HSE page | 🔄 | |
| COMP-021 | Safety Dashboard | Check dashboard | Shows safety stats | 🔄 | |
| COMP-022 | Incidents List | Check incidents | Shows incident list | 🔄 | |
| COMP-023 | Report Incident | Click report | Opens incident form | 🔄 | |
| COMP-024 | PTW (Permit to Work) | Navigate to PTW | Opens permit page | 🔄 | |
| COMP-025 | Create Permit | Click create | Opens permit form | 🔄 | |

## 7.3 Labor Certifications
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| COMP-030 | Navigate to Certs | Click Labor Certifications | Opens certs page | 🔄 | |
| COMP-031 | Certifications List | Check list | Shows certifications | 🔄 | |
| COMP-032 | Add Certification | Click add | Opens form | 🔄 | |
| COMP-033 | Expiry Alerts | Check alerts | Shows expiring certs | 🔄 | |

## 7.4 Regulatory & Audits
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| COMP-040 | Navigate to Audits | Click Regulatory & Audits | Opens audits page | 🔄 | |
| COMP-041 | Audits List | Check list | Shows audit list | 🔄 | |
| COMP-042 | Schedule Audit | Click schedule | Opens scheduling form | 🔄 | |
| COMP-043 | Audit Checklist | Open checklist | Shows checklist items | 🔄 | |

---

# MODULE 8: QUALITY CONTROL & LABS

## 8.1 Site Inspections (ITP)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| QUAL-001 | Navigate to WIR | Click Quality > Inspections > WIR | Opens /quality/inspections/wir | 🔄 | |
| QUAL-002 | Page Title | Check header | Inspection Request title | 🔄 | |
| QUAL-003 | Create WIR Button | Locate button | Create button present | 🔄 | |
| QUAL-004 | WIR Table | Check table | Shows inspection requests | 🔄 | |
| QUAL-005 | Create WIR | Click create | Opens WIR form | 🔄 | |
| QUAL-006 | Submit WIR | Fill and submit | Creates WIR | 🔄 | |

## 8.2 Smart Checklists
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| QUAL-010 | Navigate to Checklists | Click Smart Checklists | Opens checklists page | 🔄 | |
| QUAL-011 | Checklists List | Check list | Shows checklists | 🔄 | |
| QUAL-012 | Create Checklist | Click create | Opens form | 🔄 | |
| QUAL-013 | Add Checklist Items | Add items | Items added | 🔄 | |

## 8.3 Material Testing Lab
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| QUAL-020 | Navigate to Concrete | Click Concrete Cube Register | Opens /quality/lab/concrete | 🔄 | |
| QUAL-021 | Concrete Tests List | Check table | Shows concrete tests | 🔄 | |
| QUAL-022 | Add Concrete Test | Click add | Opens test form | 🔄 | |
| QUAL-023 | Navigate to Soil | Click Soil Density Tests | Opens /quality/lab/soil | 🔄 | |
| QUAL-024 | Soil Tests List | Check table | Shows soil tests | 🔄 | |
| QUAL-025 | Material Submittals | Navigate to materials | Opens submittals page | 🔄 | |

## 8.4 Non-Conformance (NCR)
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| QUAL-030 | Navigate to NCR | Click Non-Conformance | Opens NCR page | 🔄 | |
| QUAL-031 | NCR List | Check list | Shows NCR list | 🔄 | |
| QUAL-032 | Create NCR | Click create | Opens NCR form | 🔄 | |
| QUAL-033 | NCR Details | View NCR | Shows details page | 🔄 | |
| QUAL-034 | Close NCR | Click close | Closes NCR | 🔄 | |

---

# MODULE 9: DOCUMENT MANAGEMENT

## 9.1 Document Library
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| DOC-001 | Navigate to Documents | Click Document Management | Opens docs page | 🔄 | |
| DOC-002 | Folder Structure | Check folders | Shows folder tree | 🔄 | |
| DOC-003 | Upload Document | Click upload | Opens upload modal | 🔄 | |
| DOC-004 | Create Folder | Click new folder | Creates folder | 🔄 | |
| DOC-005 | Document Preview | Click document | Opens preview | 🔄 | |
| DOC-006 | Download Document | Click download | Downloads file | 🔄 | |
| DOC-007 | Delete Document | Click delete | Shows confirmation | 🔄 | |
| DOC-008 | Search Documents | Use search | Filters documents | 🔄 | |

---

# MODULE 10: SETTINGS

## 10.1 General Settings
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| SET-001 | Navigate to Settings | Click Settings | Opens settings page | 🔄 | |
| SET-002 | Company Info | Check company section | Company fields present | 🔄 | |
| SET-003 | Update Company Name | Edit company name | Saves changes | 🔄 | |
| SET-004 | Logo Upload | Upload logo | Logo updates | 🔄 | |

## 10.2 Theme Settings
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| SET-010 | Theme Section | Find theme settings | Theme options present | 🔄 | |
| SET-011 | Change Primary Color | Select color | Color updates | 🔄 | |
| SET-012 | Toggle Dark Mode | Click toggle | Theme switches | 🔄 | |
| SET-013 | Font Selection | Change font | Font updates | 🔄 | |

---

# CROSS-CUTTING TESTS

## Navigation & Layout
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| NAV-001 | Sidebar Visibility | Check sidebar | Sidebar visible at 320px | 🔄 | |
| NAV-002 | Menu Text Truncation | Check all menu items | No text truncated | 🔄 | |
| NAV-003 | Submenu Expansion | Click parent menu | Submenu expands | 🔄 | |
| NAV-004 | Nested Submenu | Click nested item | 3+ levels work | 🔄 | |
| NAV-005 | Active State | Navigate to page | Menu item highlighted | 🔄 | |
| NAV-006 | Breadcrumbs | Check breadcrumbs | Shows navigation path | 🔄 | |
| NAV-007 | Mobile Responsive | Resize window | Sidebar collapses | 🔄 | |
| NAV-008 | Search Menus | Use menu search | Filters menu items | 🔄 | |

## Forms & Inputs
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| FORM-001 | Required Fields | Submit empty form | Shows validation errors | 🔄 | |
| FORM-002 | Email Validation | Enter invalid email | Shows email error | 🔄 | |
| FORM-003 | Date Picker | Click date field | Calendar opens | 🔄 | |
| FORM-004 | Select Dropdown | Click select | Options show | 🔄 | |
| FORM-005 | File Upload | Select file | File selected | 🔄 | |
| FORM-006 | Form Reset | Click cancel | Form clears | 🔄 | |

## Tables & Lists
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| TBL-001 | Table Headers | Check headers | All headers visible | 🔄 | |
| TBL-002 | Sorting | Click column header | Data sorts | 🔄 | |
| TBL-003 | Pagination | Click next page | Shows next records | 🔄 | |
| TBL-004 | Empty State | View empty table | Shows "No data" message | 🔄 | |
| TBL-005 | Actions Column | Check actions | Edit/Delete available | 🔄 | |
| TBL-006 | Row Selection | Click checkbox | Row selected | 🔄 | |
| TBL-007 | Bulk Actions | Select multiple | Bulk actions appear | 🔄 | |

## Modals & Dialogs
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| MOD-001 | Modal Opens | Click action button | Modal appears | 🔄 | |
| MOD-002 | Modal Close X | Click X button | Modal closes | 🔄 | |
| MOD-003 | Modal Close Outside | Click overlay | Modal closes | 🔄 | |
| MOD-004 | Modal Submit | Click submit | Form submits | 🔄 | |
| MOD-005 | Confirmation Dialog | Click delete | Confirm dialog shows | 🔄 | |

## Toast Notifications
| Test ID | Test Case | Steps | Expected Result | Status | Notes |
|---------|-----------|-------|-----------------|--------|-------|
| TOAST-001 | Success Toast | Complete action | Green success toast | 🔄 | |
| TOAST-002 | Error Toast | Trigger error | Red error toast | 🔄 | |
| TOAST-003 | Toast Dismiss | Click X or wait | Toast disappears | 🔄 | |

---

# GAPS AND ISSUES FOUND

## Critical Issues (Blocking)
| Issue ID | Module | Description | Impact | Status |
|----------|--------|-------------|--------|--------|
| | | | | |

## High Priority Issues
| Issue ID | Module | Description | Impact | Status |
|----------|--------|-------------|--------|--------|
| | | | | |

## Medium Priority Issues
| Issue ID | Module | Description | Impact | Status |
|----------|--------|-------------|--------|--------|
| | | | | |

## Low Priority Issues
| Issue ID | Module | Description | Impact | Status |
|----------|--------|-------------|--------|--------|
| | | | | |

## UI/UX Improvements Suggested
| Suggestion ID | Module | Description | Priority |
|---------------|--------|-------------|----------|
| | | | |

---

# TEST EXECUTION LOG

## Session 1 - [Date]
| Time | Tests Executed | Pass | Fail | Notes |
|------|----------------|------|------|-------|
| | | | | |

---

# SUMMARY

## Test Coverage
- Total Test Cases: 150+
- Executed: 0
- Passed: 0
- Failed: 0
- Skipped: 0

## Overall Status
🔄 **Testing In Progress**

---

*Last Updated: January 6, 2026*
