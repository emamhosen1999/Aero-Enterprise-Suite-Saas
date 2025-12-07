# Frontend Reorganization Plan

## Overview
Reorganize frontend files (Components, Forms, Tables, Layouts, etc.) into Platform/Tenant/Shared contexts to match the backend architecture and improve code organization.

## Current Structure Issues
- Root-level directories mixing Platform, Tenant, and Shared concerns
- Difficult to determine ownership and context of components
- Import paths inconsistent with backend architecture
- ~150-200 files need categorization and relocation

## Target Structure

```
resources/js/
├── Platform/
│   ├── Components/      # Platform-specific UI components
│   ├── Forms/           # Platform admin forms
│   ├── Tables/          # Platform data tables
│   ├── Layouts/         # Platform-specific layouts
│   ├── Pages/           # ✅ Already organized
│   └── Utils/           # Platform utilities
├── Tenant/
│   ├── Components/      # Business operation components
│   │   ├── HRM/        # HR components
│   │   ├── CRM/        # CRM components
│   │   ├── Finance/    # Finance components
│   │   └── ...         # Other modules
│   ├── Forms/           # Business forms
│   │   ├── HRM/        # HR forms
│   │   ├── CRM/        # CRM forms
│   │   └── ...
│   ├── Tables/          # Business data tables
│   │   ├── HRM/        # HR tables
│   │   └── ...
│   ├── Layouts/         # Tenant-specific layouts
│   ├── Pages/           # ✅ Already organized
│   └── Utils/           # Tenant utilities
└── Shared/
    ├── Components/      # Generic reusable components
    ├── Forms/           # Generic form components
    ├── Layouts/         # Common layouts
    ├── Hooks/           # ✅ Already present
    ├── Context/         # Global contexts
    ├── Utils/           # ✅ Already present
    └── Theme/           # ✅ Already present
```

## Classification Criteria

### Platform Files
**Purpose**: Platform administration, multi-tenancy management, system operations

**Examples:**
- Tenant management (CRUD, approval, provisioning)
- Plan management (create, edit, pricing)
- Platform settings
- System monitoring dashboards
- Audit logs
- Error logs
- Billing management
- Platform-level integrations

### Tenant Files  
**Purpose**: Business operations within a tenant context

**Examples:**
- HRM (Employee, Leave, Attendance, Payroll, Recruitment, Training)
- CRM (Customer, Deal, Pipeline)
- Finance (Accounts, Ledger, Journal)
- SCM (Supplier, Logistics)
- POS (Sales, Orders)
- Quality, Compliance
- Project Management
- Department, Designation management

### Shared Files
**Purpose**: Common functionality used across Platform and Tenant

**Examples:**
- Authentication (Login, Register, Password Reset)
- Profile management
- Notification components
- Generic UI components (Button, Checkbox, Modal, Input, Card)
- Layout components (Sidebar, Header, Footer, App layout)
- Common utilities
- Hooks
- Contexts
- Theme configuration

## Detailed File Mapping

### Components Directory (80+ files)

#### Move to Platform/Components/
- `Components/Admin/` → `Platform/Components/Admin/`
- `Components/Administration/ModuleCard.jsx` → `Platform/Components/Modules/`
- `Components/Administration/RoleCard.jsx` → `Platform/Components/Roles/`
- Platform-specific monitoring, analytics

#### Move to Tenant/Components/HRM/
- `Components/Attendance/` → `Tenant/Components/HRM/Attendance/`
- `Components/BulkLeave/` → `Tenant/Components/HRM/Leave/BulkLeave/`
- `Components/Employee/` (if exists) → `Tenant/Components/HRM/Employee/`
- `DepartmentEmployeeSelector.jsx` → `Tenant/Components/HRM/Common/`
- `DeleteEmployeeModal.jsx` → `Tenant/Components/HRM/Employee/`
- `EmployeeFormModal.jsx` → `Tenant/Components/HRM/Employee/`
- `EnhancedProfileCard.jsx` → `Tenant/Components/HRM/Employee/` (if employee-specific)

#### Move to Tenant/Components/ (Other Modules)
- `Components/Compliance/` → `Tenant/Components/Compliance/`
- `Components/Analytics/` → `Tenant/Components/Analytics/`
- CRM, Finance, SCM, POS components

#### Move to Shared/Components/
- `ActionButtons.jsx` → `Shared/Components/UI/`
- `AuthCard.jsx` → `Shared/Components/Auth/`
- `AuthGuard.jsx` → `Shared/Components/Auth/`
- `AuthLayout.jsx` → `Shared/Layouts/`
- `Breadcrumb.jsx` → `Shared/Components/Navigation/`
- `Button.jsx` → `Shared/Components/UI/`
- `CameraCapture.jsx` → `Shared/Components/Media/`
- `Checkbox.jsx` → `Shared/Components/UI/`
- `DarkModeSwitch.jsx` → `Shared/Components/Theme/`
- `EnhancedModal.jsx` → `Shared/Components/UI/`
- `Components/Auth/` → `Shared/Components/Auth/`
- `Components/Common/` → `Shared/Components/Common/`
- `Components/ErrorBoundary/` → `Shared/Components/ErrorHandling/`
- Generic form inputs, cards, badges, etc.

### Forms Directory (50+ files)

#### Move to Tenant/Forms/HRM/
**Most forms are HRM-related:**
- `AddEditUserForm.jsx` → `Tenant/Forms/HRM/User/`
- `AddUserForm.jsx` → `Tenant/Forms/HRM/User/`
- `BankInformationForm.jsx` → `Tenant/Forms/HRM/Employee/`
- `BulkMarkAsPresentForm.jsx` → `Tenant/Forms/HRM/Attendance/`
- `DailyWorkForm.jsx` → `Tenant/Forms/HRM/Attendance/`
- `DeleteDepartmentForm.jsx` → `Tenant/Forms/HRM/Department/`
- `DeleteDesignationForm.jsx` → `Tenant/Forms/HRM/Designation/`
- `DeleteLeaveForm.jsx` → `Tenant/Forms/HRM/Leave/`
- `DepartmentForm.jsx` → `Tenant/Forms/HRM/Department/`
- `DesignationForm.jsx` → `Tenant/Forms/HRM/Designation/`
- `EducationInformationForm.jsx` → `Tenant/Forms/HRM/Employee/`
- `EmergencyContactForm.jsx` → `Tenant/Forms/HRM/Employee/`
- `HolidayForm.jsx` → `Tenant/Forms/HRM/Holiday/`
- `LeaveForm.jsx` → `Tenant/Forms/HRM/Leave/`
- `AddEditJobForm.jsx` → `Tenant/Forms/HRM/Recruitment/`
- `AddEditTrainingForm.jsx` → `Tenant/Forms/HRM/Training/`
- `PerformanceReviewForm.jsx` → `Tenant/Forms/HRM/Performance/`
- `PayrollForm.jsx` → `Tenant/Forms/HRM/Payroll/`
- All daily work, timesheet, attendance forms → `Tenant/Forms/HRM/Attendance/`

#### Move to Shared/Forms/
- `CompanyInformationForm.jsx` → `Shared/Forms/Company/` (used by both contexts)
- Generic form components (if any)

### Tables Directory (18 files)

#### Move to Tenant/Tables/HRM/
**All tables are tenant-specific:**
- `AttendanceAdminTable.jsx` → `Tenant/Tables/HRM/Attendance/`
- `AttendanceEmployeeTable.jsx` → `Tenant/Tables/HRM/Attendance/`
- `DailyWorkSummaryTable.jsx` → `Tenant/Tables/HRM/Attendance/`
- `DailyWorksTable.jsx` → `Tenant/Tables/HRM/Attendance/`
- `DepartmentTable.jsx` → `Tenant/Tables/HRM/Department/`
- `DesignationTable.jsx` → `Tenant/Tables/HRM/Designation/`
- `EmployeeTable.jsx` → `Tenant/Tables/HRM/Employee/`
- `HolidayTable.jsx` → `Tenant/Tables/HRM/Holiday/`
- `LeaveEmployeeTable.jsx` → `Tenant/Tables/HRM/Leave/`
- `LettersTable.jsx` → `Tenant/Tables/HRM/Letters/`
- `PerformanceReviewsTable.jsx` → `Tenant/Tables/HRM/Performance/`
- `TimeSheetTable.jsx` → `Tenant/Tables/HRM/Attendance/`
- `TrainingSessionsTable.jsx` → `Tenant/Tables/HRM/Training/`
- `UsersTable.jsx` → `Tenant/Tables/HRM/User/`
- `WorkLocationsTable.jsx` → `Tenant/Tables/HRM/WorkLocation/`

#### Move to Shared/Tables/
- `RolesTable.jsx` → `Shared/Tables/` (used in both Platform and Tenant)
- `PermissionsTable.jsx` → `Shared/Tables/` (if still used - should be deprecated per policy compliance)
- `UserRolesTable.jsx` → `Shared/Tables/`

### Layouts Directory (5+ files)

#### Move to Shared/Layouts/
- All layout files should be in Shared as they're used across contexts
- `App.jsx` → `Shared/Layouts/`
- Any Sidebar, Header, Footer components

### Context/Contexts Directories

#### Move to Shared/Context/
- `Context/ModuleContext.jsx` → `Shared/Context/`
- `Contexts/*` → `Shared/Context/`

### Features Directory

#### Analyze and distribute:
- Check each feature and categorize appropriately

## Import Update Strategy

After moving files, update imports in:

1. **Page files** (Platform/Pages/*, Tenant/Pages/*)
2. **Component files** (cross-references)
3. **Form files** (cross-references)
4. **Layout files**
5. **Test files**

### Import Pattern Changes

**Before:**
```jsx
import UsersTable from '@/Tables/UsersTable';
import LeaveForm from '@/Forms/LeaveForm';
import Button from '@/Components/Button';
```

**After:**
```jsx
import UsersTable from '@/Tenant/Tables/HRM/User/UsersTable';
import LeaveForm from '@/Tenant/Forms/HRM/Leave/LeaveForm';
import Button from '@/Shared/Components/UI/Button';
```

## Execution Plan

### Phase 2: Components Migration
1. Create new directory structure
2. Move Platform components
3. Move Tenant components (by module)
4. Move Shared components
5. Verify no files left in old Components/

### Phase 3: Forms Migration
1. Create Forms structure under Tenant/Forms/HRM/
2. Move all form files
3. Move any shared forms

### Phase 4: Tables Migration
1. Create Tables structure under Tenant/Tables/HRM/
2. Move all table files
3. Move shared tables

### Phase 5: Layouts & Other
1. Move Layouts to Shared
2. Move Context files to Shared
3. Handle Features directory

### Phase 6: Import Updates
1. Update Platform/Pages/* imports
2. Update Tenant/Pages/* imports
3. Update component cross-references
4. Update form cross-references
5. Update table cross-references

### Phase 7: Build & Verify
1. Run `npm run build`
2. Check for import errors
3. Test key features manually
4. Verify no broken imports

## Risk Mitigation

1. **Incremental approach**: Move one directory at a time
2. **Test after each phase**: Ensure build passes
3. **Keep documentation**: Track all moves in commits
4. **Pattern consistency**: Follow same patterns as backend reorganization

## Success Criteria

- ✅ All frontend files organized by Platform/Tenant/Shared
- ✅ No files remaining in root-level Components/, Forms/, Tables/
- ✅ All imports updated and functional
- ✅ Build completes without errors
- ✅ Application loads and key features work
- ✅ Consistent architecture with backend organization

## Estimated Effort

- Phase 2 (Components): ~80 files
- Phase 3 (Forms): ~50 files
- Phase 4 (Tables): ~18 files
- Phase 5 (Other): ~20 files
- Phase 6 (Imports): ~200-300 import statements
- **Total**: 168 files to move, 200-300 imports to update

## Notes

- The Pages directories are already well-organized, so we're focusing on Components, Forms, Tables, and other supporting files
- Follow HeroUI component patterns mentioned in repository instructions
- Maintain backward compatibility during migration
- Document all changes for team awareness
