# Aero UI - Controller Path Mapping

This document maps old Inertia::render paths to the new module-based structure.

## Module Organization

All frontend resources are now organized by module in `packages/aero-ui/resources/js/`:

```mermaid
graph TD;
Pages/
├── Core/          # aero-core: Auth, Settings, Admin, Dashboard, etc.
├── Platform/      # aero-platform: Installation, Billing, SaaS features
├── HRM/           # aero-hrm: All HR functionality
├── Finance/       # aero-finance: GL, AP, AR, Journal Entries
├── CRM/           # aero-crm: Customers, Leads, Pipeline
├── Project/       # aero-project: Projects, Tasks, Gantt, Time Tracking
├── IMS/           # aero-ims: Inventory Management
├── POS/           # aero-pos: Point of Sale
├── SCM/           # aero-scm: Supply Chain Management
├── Quality/       # aero-quality: Quality Management, NCR
├── Compliance/    # aero-compliance: Compliance, Audits
├── DMS/           # aero-dms: Document Management
└── Shared/        # Cross-module: Errors, Public, UsersList
```

## Path Mapping

### Core Module (aero-core)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Auth/Login` | `Pages/Core/Auth/Login` | ✓ |
| `Auth/Register` | `Pages/Core/Auth/Register` | ✓ |
| `Auth/ForgotPassword` | `Pages/Core/Auth/ForgotPassword` | ✓ |
| `Auth/ResetPassword` | `Pages/Core/Auth/ResetPassword` | ✓ |
| `Auth/VerifyEmail` | `Pages/Core/Auth/VerifyEmail` | ✓ |
| `Auth/AcceptInvitation` | `Pages/Core/Auth/AcceptInvitation` | → |
| `Auth/InvitationExpired` | `Pages/Core/Auth/InvitationExpired` | → |
| `Core/Dashboard` | `Pages/Core/Core/Dashboard` | ✓ |
| `Core/Extensions/Index` | `Pages/Core/Admin/Extensions/Index` | ✓ |
| `Core/Extensions/Settings` | `Pages/Core/Admin/Extensions/Settings` | ✓ |
| `AuditLogs/Index` | `Pages/Core/AuditLogs/Index` | ✓ |
| `FileManager/Index` | `Pages/Core/FileManager/Index` | ✓ |
| `Notifications/Index` | `Pages/Core/Notifications/Index` | ✓ |
| `Settings/CompanySettings` | `Pages/Core/Settings/CompanySettings` | ✓ |
| `Settings/SystemSettings` | `Pages/Core/Settings/SystemSettings` | ✓ |
| `Settings/SamlSettings` | `Pages/Core/Settings/SamlSettings` | ✓ |
| `Settings/InvoiceBrandingSettings` | `Pages/Core/Settings/InvoiceBrandingSettings` | ✓ |
| `UsersList` | `Pages/Shared/UsersList` | → |
| `Users/Index` | `Pages/Core/Users/Index` | → |
| `Users/Create` | `Pages/Core/Users/Create` | → |
| `Users/Edit` | `Pages/Core/Users/Edit` | → |
| `Users/Show` | `Pages/Core/Users/Show` | → |
| `UserDevices` | `Pages/Core/UserDevices/Index` | → |
| `Departments` | `Pages/Core/Departments/Index` | → |
| `Designations` | `Pages/Core/Designations/Index` | → |
| `Roles/Index` (dynamic) | `Pages/Core/Roles/Index` | ✓ |
| `Public/Pages/Careers/Index` | `Pages/Shared/Public/Careers/Index` | → |
| `Public/Pages/Careers/Show` | `Pages/Shared/Public/Careers/Show` | → |
| `Public/Pages/Careers/Apply` | `Pages/Shared/Public/Careers/Apply` | → |

### Platform Module (aero-platform)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Installation/Welcome` | `Pages/Platform/Admin/Installation/Welcome` | ✓ |
| `Installation/Requirements` | `Pages/Platform/Admin/Installation/Requirements` | ✓ |
| `Installation/Database` | `Pages/Platform/Admin/Installation/Database` | ✓ |
| `Installation/AdminAccount` | `Pages/Platform/Admin/Installation/AdminAccount` | ✓ |
| `Installation/PlatformSettings` | `Pages/Platform/Admin/Installation/PlatformSettings` | ✓ |
| `Installation/Review` | `Pages/Platform/Admin/Installation/Review` | ✓ |
| `Installation/Complete` | `Pages/Platform/Admin/Installation/Complete` | ✓ |
| `Installation/AlreadyInstalled` | `Pages/Platform/Admin/Installation/AlreadyInstalled` | ✓ |
| `Installation/SecretVerification` | `Pages/Platform/Admin/Installation/SecretVerification` | ✓ |
| `Admin/Auth/Login` | `Pages/Platform/Admin/Auth/Login` | ✓ |
| `Admin/Billing/TenantBilling` | `Pages/Platform/Admin/Billing/TenantBilling` | ✓ |
| `Admin/Settings/Platform` | `Pages/Platform/Admin/Settings/Platform` | ✓ |
| `Admin/Developer/Maintenance` | `Pages/Platform/Admin/Developer/Maintenance` | ✓ |
| `Admin/ErrorLogs/Index` | `Pages/Platform/Admin/ErrorLogs/Index` | ✓ |
| `Admin/ErrorLogs/Show` | `Pages/Platform/Admin/ErrorLogs/Show` | ✓ |
| `Administration/AuditLog/Index` | `Pages/Platform/Admin/AuditLogs/Index` | → |
| `Administration/AuditLog/Show` | `Pages/Platform/Admin/AuditLogs/Show` | → |
| `Administration/SystemMonitoringEnhanced` | `Pages/Platform/Admin/SystemMonitoring/Enhanced` | → |
| `Settings/Usage` | `Pages/Platform/Admin/Settings/Usage` | → |
| `Tenant/Pages/Settings/DomainManager` | `Pages/Platform/Admin/Settings/DomainManager` | → |
| `Tenant/Pages/Integrations/Dashboard` | `Pages/Shared/Integrations/Dashboard` | → |
| `Tenant/Pages/Integrations/ApiKeys` | `Pages/Shared/Integrations/ApiKeys` | → |
| `Tenant/Pages/Integrations/Connectors` | `Pages/Shared/Integrations/Connectors` | → |
| `Tenant/Pages/Integrations/Webhooks` | `Pages/Shared/Integrations/Webhooks` | → |
| `Public/Register/Provisioning` | `Pages/Platform/Public/Register/Provisioning` | ✓ |
| `Emails` | `Pages/Platform/Emails/Index` | → |
| `Shared/Pages/UsersList` | `Pages/Shared/UsersList` | ✓ |

### HRM Module (aero-hrm)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Tenant/Pages/Employees/EmployeeList` | `Pages/HRM/Employees/Index` | → |
| `AttendanceAdmin` | `Pages/HRM/Attendance/Admin` | → |
| `AttendanceEmployee` | `Pages/HRM/Attendance/Employee` | → |
| `TimeSheet` | `Pages/HRM/TimeSheet/Index` | → |
| `LeavesAdmin` | `Pages/HRM/TimeOff/AdminLeaves` | → |
| `LeavesEmployee` | `Pages/HRM/TimeOff/EmployeeLeaves` | → |
| `LeaveSummary` | `Pages/HRM/TimeOff/Summary` | → |
| `PerformanceDashboard` | `Pages/HRM/Performance/Dashboard` | ✓ |
| `Holidays` | `Pages/HRM/Holidays/Index` | → |
| `Letters` | `Pages/HRM/Letters/Index` | → |
| `Departments` | `Pages/Core/Departments/Index` | → |
| `Designations` | `Pages/Core/Designations/Index` | → |
| `HR/Dashboard` | `Pages/HRM/Dashboard` | → |
| `HR/Analytics/*` | `Pages/HRM/Analytics/*` | ✓ |
| `HR/Benefits/*` | `Pages/HRM/Benefits/*` | → |
| `HR/Documents/*` | `Pages/HRM/Documents/*` | ✓ |
| `HR/Offboarding/*` | `Pages/HRM/Offboarding/*` | ✓ |
| `HR/Onboarding/*` | `Pages/HRM/Onboarding/*` | ✓ |
| `HR/Payroll/*` | `Pages/HRM/Payroll/*` | ✓ |
| `HR/Performance/*` | `Pages/HRM/Performance/*` | ✓ |
| `HR/Profile/EmployeeProfile` | `Pages/HRM/Profile/EmployeeProfile` | ✓ |
| `HR/Recruitment/*` | `Pages/HRM/Recruitment/*` | ✓ |
| `HR/Safety/*` | `Pages/HRM/Safety/*` | → |
| `HR/SalaryStructure/*` | `Pages/HRM/SalaryStructure/*` | ✓ |
| `HR/SelfService/*` | `Pages/HRM/SelfService/*` | → |
| `HR/Skills/*` | `Pages/HRM/Skills/*` | → |
| `HR/TimeOff/*` | `Pages/HRM/TimeOff/*` | ✓ |
| `HR/Training/*` | `Pages/HRM/Training/*` | ✓ |
| `Profile/UserProfile` | `Pages/Shared/Profile/UserProfile` | → |
| `Settings/AttendanceSettings` | `Pages/HRM/Settings/AttendanceSettings` | → |
| `Settings/HRMSettings` | `Pages/HRM/Settings/HRMSettings` | → |
| `Settings/LeaveSettings` | `Pages/HRM/Settings/LeaveSettings` | → |
| `Events/*` | `Pages/HRM/Events/*` | → |
| `Public/Events/*` | `Pages/Shared/Public/Events/*` | → |

### Finance Module (aero-finance)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Tenant/Pages/Finance/Dashboard` | `Pages/Finance/Dashboard` | ✓ |
| `Tenant/Pages/Finance/ChartOfAccounts` | `Pages/Finance/ChartOfAccounts` | ✓ |
| `Tenant/Pages/Finance/GeneralLedger` | `Pages/Finance/GeneralLedger` | ✓ |
| `Tenant/Pages/Finance/JournalEntries` | `Pages/Finance/JournalEntries` | ✓ |
| `Tenant/Pages/Finance/AccountsPayable` | `Pages/Finance/AccountsPayable` | ✓ |
| `Tenant/Pages/Finance/AccountsReceivable` | `Pages/Finance/AccountsReceivable` | ✓ |

### CRM Module (aero-crm)

| Old Path | New Path | Status |
|----------|----------|--------|
| `CRM/Dashboard` | `Pages/CRM/Dashboard` | → |
| `CRM/Index` | `Pages/CRM/Index` | → |
| `CRM/Customers/*` | `Pages/CRM/Customers/*` | → |
| `CRM/Leads/Index` | `Pages/CRM/Leads/Index` | → |
| `CRM/Opportunities/Index` | `Pages/CRM/Opportunities/Index` | → |
| `CRM/Pipeline/Index` | `Pages/CRM/Pipeline/Index` | ✓ |
| `CRM/Reports/Index` | `Pages/CRM/Reports/Index` | → |
| `CRM/Settings/Index` | `Pages/CRM/Settings/Index` | → |

### Project Module (aero-project)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Project/DailyWorks` | `Pages/Project/DailyWorks/Index` | → |
| `ProjectManagement/Dashboard` | `Pages/Project/Dashboard` | → |
| `ProjectManagement/Projects/*` | `Pages/Project/Projects/*` | → |
| `ProjectManagement/Gantt/Index` | `Pages/Project/Gantt/Index` | → |
| `ProjectManagement/Issues/*` | `Pages/Project/Issues/*` | → |
| `ProjectManagement/Milestones/*` | `Pages/Project/Milestones/*` | → |
| `ProjectManagement/Resources/*` | `Pages/Project/Resources/*` | → |
| `ProjectManagement/TimeTracking/*` | `Pages/Project/TimeTracking/*` | → |
| `ProjectManagement/Budget/*` | `Pages/Project/Budget/*` | → |

### IMS Module (aero-ims)

| Old Path | New Path | Status |
|----------|----------|--------|
| `IMS/Index` | `Pages/IMS/Index` | → |
| `IMS/Items/*` | `Pages/IMS/Items/*` | → |
| `IMS/Products/Index` | `Pages/IMS/Products/Index` | → |
| `IMS/PurchaseOrders/Index` | `Pages/IMS/PurchaseOrders/Index` | → |
| `IMS/Reports/Index` | `Pages/IMS/Reports/Index` | → |
| `IMS/StockMovements/Index` | `Pages/IMS/StockMovements/Index` | → |
| `IMS/Suppliers/Index` | `Pages/IMS/Suppliers/Index` | → |
| `IMS/Warehouse/Index` | `Pages/IMS/Warehouse/Index` | → |

### POS Module (aero-pos)

| Old Path | New Path | Status |
|----------|----------|--------|
| `POS/Dashboard` | `Pages/POS/Dashboard` | → |
| `POS/Index` | `Pages/POS/Index` | → |
| `POS/Customers/Index` | `Pages/POS/Customers/Index` | → |
| `POS/Products/Index` | `Pages/POS/Products/Index` | → |
| `POS/Sales/*` | `Pages/POS/Sales/*` | → |
| `POS/Settings/Index` | `Pages/POS/Settings/Index` | → |
| `POS/Transactions/Index` | `Pages/POS/Transactions/Index` | → |
| `POS/Reports/Index` | `Pages/POS/Reports/Index` | → |

### SCM Module (aero-scm)

| Old Path | New Path | Status |
|----------|----------|--------|
| `SCM/Dashboard` | `Pages/SCM/Dashboard` | → |
| `SCM/DemandForecast/*` | `Pages/SCM/DemandForecast/*` | → |
| `SCM/ImportExport/*` | `Pages/SCM/ImportExport/*` | → |
| `SCM/Logistics/*` | `Pages/SCM/Logistics/*` | → |
| `SCM/Procurement/*` | `Pages/SCM/Procurement/*` | → |
| `SCM/ProductionPlan/*` | `Pages/SCM/ProductionPlan/*` | → |
| `SCM/Purchases/*` | `Pages/SCM/Purchases/*` | → |
| `SCM/ReturnManagement/*` | `Pages/SCM/ReturnManagement/*` | → |
| `SCM/Suppliers/*` | `Pages/SCM/Suppliers/*` | → |

### Quality Module (aero-quality)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Quality/Dashboard` | `Pages/Quality/Dashboard` | → |
| `Quality/Index` | `Pages/Quality/Index` | → |
| `Quality/Inspections/*` | `Pages/Quality/Inspections/*` | → |
| `Quality/NCR/*` | `Pages/Quality/NCR/*` | → |

### Compliance Module (aero-compliance)

| Old Path | New Path | Status |
|----------|----------|--------|
| `Compliance/Dashboard` | `Pages/Compliance/Dashboard` | → |
| `Compliance/Audits/*` | `Pages/Compliance/Audits/*` | → |
| `Compliance/Documents/*` | `Pages/Compliance/Documents/*` | → |
| `Compliance/Policies/*` | `Pages/Compliance/Policies/*` | → |
| `Compliance/RegulatoryRequirements/*` | `Pages/Compliance/RegulatoryRequirements/*` | → |

### DMS Module (aero-dms)

| Old Path | New Path | Status |
|----------|----------|--------|
| `DMS/Dashboard` | `Pages/DMS/Dashboard` | → |
| `DMS/Index` | `Pages/DMS/Index` | → |
| `DMS/AccessControl` | `Pages/DMS/AccessControl` | → |
| `DMS/Analytics` | `Pages/DMS/Analytics` | → |
| `DMS/Categories` | `Pages/DMS/Categories` | → |
| `DMS/DocumentCreate` | `Pages/DMS/DocumentCreate` | → |
| `DMS/DocumentView` | `Pages/DMS/DocumentView` | → |
| `DMS/Documents` | `Pages/DMS/Documents` | → |
| `DMS/Folders` | `Pages/DMS/Folders` | → |
| `DMS/SharedDocuments` | `Pages/DMS/SharedDocuments` | → |

## Legend

- ✓ = Path already exists in correct location
- → = Needs controller update (file exists, path reference needs changing)
- ⚠️ = File missing (needs to be created)

## Implementation Notes

1. All paths now follow the pattern: `Pages/{Module}/{Feature}/{Action}`
2. Shared resources (errors, public pages, user lists) are in `Pages/Shared/`
3. Platform-specific admin features are in `Pages/Platform/Admin/`
4. Core authentication and settings are in `Pages/Core/`
5. Each module has its own namespace for better organization and maintainability
