/**
 * Navigation Configuration
 * 
 * Central configuration file for all navigation items in the application.
 * This configuration is filtered by the useNavigation hook based on:
 * - User permissions (from Spatie permissions)
 * - Enabled modules (from tenant subscription/plan)
 * 
 * Structure:
 * - label: Display name
 * - route: Laravel route name (used with route() helper)
 * - icon: Heroicons icon name (imported separately)
 * - module: Module gate key (null = always visible, 'hrm' = requires HRM module)
 * - permission: Permission required to view (null = no permission check)
 * - children: Nested navigation items (supports unlimited depth)
 * - priority: Sort order (lower = higher priority)
 * - category: Grouping category for settings sidebar
 * - badge: Optional badge text/count
 * - badgeColor: Badge color variant
 */

// =============================================================================
// MODULE DEFINITIONS
// =============================================================================
export const MODULES = {
    CORE: 'core',           // Always enabled - Dashboard, Profile
    SELF_SERVICE: 'self-service', // Employee self-service portal
    HRM: 'hrm',             // Human Resource Management
    CRM: 'crm',             // Customer Relationship Management
    PROJECT: 'project',     // Project Management
    FINANCE: 'finance',     // Finance & Accounting
    INVENTORY: 'inventory', // Inventory Management
    POS: 'pos',             // Point of Sale
    DMS: 'dms',             // Document Management System
    QUALITY: 'quality',     // Quality Management
    ANALYTICS: 'analytics', // Business Analytics
    COMPLIANCE: 'compliance', // Regulatory Compliance
    SCM: 'scm',             // Supply Chain Management
    ASSET: 'asset',         // Asset Management
    TRAINING: 'training',   // Learning & Development
};

// =============================================================================
// NAVIGATION CONFIGURATION
// =============================================================================
export const navigationConfig = [
    // =========================================================================
    // DASHBOARD (Always visible if user has permission)
    // =========================================================================
    {
        label: 'Dashboard',
        route: 'dashboard',
        icon: 'HomeIcon',
        module: null, // Always visible
        permission: 'core.dashboard.view',
        priority: 1,
    },

    // =========================================================================
    // WORKSPACE / SELF-SERVICE
    // =========================================================================
    {
        label: 'Workspace',
        icon: 'UserGroupIcon',
        module: MODULES.SELF_SERVICE,
        permission: null, // Checked at child level
        priority: 2,
        children: [
            {
                label: 'My Attendance',
                route: 'attendance-employee',
                icon: 'CalendarDaysIcon',
                permission: 'attendance.own.view',
            },
            {
                label: 'My Leaves',
                route: 'leaves-employee',
                icon: 'ArrowRightOnRectangleIcon',
                permission: 'leave.own.view',
            },
            {
                label: 'Communications',
                route: 'emails',
                icon: 'EnvelopeIcon',
                permission: 'communications.own.view',
            },
        ],
    },

    // =========================================================================
    // HR MODULE
    // =========================================================================
    {
        label: 'HR',
        icon: 'UserGroupIcon',
        module: MODULES.HRM,
        permission: null,
        priority: 3,
        children: [
            // -----------------------------------------------------------------
            // Core Employee Management
            // -----------------------------------------------------------------
            {
                label: 'Employees',
                icon: 'UserGroupIcon',
                category: 'core',
                children: [
                    {
                        label: 'All Employees',
                        route: 'employees',
                        icon: 'UserGroupIcon',
                        permission: 'employees.view',
                    },
                    {
                        label: 'Departments',
                        route: 'departments',
                        icon: 'BuildingOffice2Icon',
                        permission: 'departments.view',
                    },
                    {
                        label: 'Designations',
                        route: 'designations.index',
                        icon: 'BriefcaseIcon',
                        permission: 'designations.view',
                    },
                ],
            },
            // -----------------------------------------------------------------
            // Time & Attendance
            // -----------------------------------------------------------------
            {
                label: 'Time',
                icon: 'CalendarDaysIcon',
                category: 'time',
                children: [
                    {
                        label: 'Attendance',
                        route: 'attendances',
                        icon: 'CalendarDaysIcon',
                        permission: 'attendance.view',
                    },
                    {
                        label: 'Timesheet',
                        route: 'timesheet',
                        icon: 'ClockIcon',
                        permission: 'attendance.view',
                    },
                    {
                        label: 'Time-off',
                        route: 'hr.timeoff.index',
                        icon: 'CalendarIcon',
                        permission: 'hr.timeoff.view',
                    },
                    {
                        label: 'Holidays',
                        route: 'holidays',
                        icon: 'CalendarIcon',
                        permission: 'holidays.view',
                    },
                    {
                        label: 'Leaves',
                        route: 'leaves',
                        icon: 'ArrowRightOnRectangleIcon',
                        permission: 'leaves.view',
                    },
                    {
                        label: 'Leave Analytics',
                        route: 'leave-summary',
                        icon: 'ChartBarSquareIcon',
                        permission: 'leaves.view',
                    },
                    {
                        label: 'Leave Policies',
                        route: 'leave-settings',
                        icon: 'Cog6ToothIcon',
                        permission: 'leaves.view',
                    },
                ],
            },
            // -----------------------------------------------------------------
            // Employee Lifecycle
            // -----------------------------------------------------------------
            {
                label: 'Lifecycle',
                icon: 'UserIcon',
                category: 'lifecycle',
                children: [
                    {
                        label: 'Recruitment',
                        route: 'hr.recruitment.index',
                        icon: 'BriefcaseIcon',
                        permission: 'jobs.view',
                    },
                    {
                        label: 'Onboarding',
                        route: 'hr.onboarding.index',
                        icon: 'UserIcon',
                        permission: 'hr.onboarding.view',
                    },
                    {
                        label: 'Offboarding',
                        route: 'hr.offboarding.index',
                        icon: 'ArrowRightOnRectangleIcon',
                        permission: 'hr.offboarding.view',
                    },
                    {
                        label: 'Checklists',
                        route: 'hr.checklists.index',
                        icon: 'ClipboardDocumentCheckIcon',
                        permission: 'hr.checklists.view',
                    },
                ],
            },
            // -----------------------------------------------------------------
            // Performance & Development
            // -----------------------------------------------------------------
            {
                label: 'Development',
                icon: 'AcademicCapIcon',
                category: 'development',
                children: [
                    {
                        label: 'Reviews',
                        route: 'hr.performance.index',
                        icon: 'ChartBarSquareIcon',
                        permission: 'performance-reviews.view',
                    },
                    {
                        label: 'Training',
                        route: 'hr.training.index',
                        icon: 'AcademicCapIcon',
                        permission: 'training-sessions.view',
                    },
                    {
                        label: 'Skills',
                        route: 'hr.skills.index',
                        icon: 'AcademicCapIcon',
                        permission: 'hr.skills.view',
                    },
                    {
                        label: 'Competencies',
                        route: 'hr.competencies.index',
                        icon: 'ScaleIcon',
                        permission: 'hr.competencies.view',
                    },
                ],
            },
            // -----------------------------------------------------------------
            // Payroll & Benefits
            // -----------------------------------------------------------------
            {
                label: 'Payroll',
                icon: 'BanknotesIcon',
                category: 'payroll',
                children: [
                    {
                        label: 'Payroll',
                        route: 'hr.payroll.index',
                        icon: 'BanknotesIcon',
                        permission: 'payroll.view',
                    },
                    {
                        label: 'Benefits',
                        route: 'hr.benefits.index',
                        icon: 'CreditCardIcon',
                        permission: 'hr.benefits.view',
                    },
                    {
                        label: 'Expenses',
                        route: 'hr.expenses.index',
                        icon: 'CurrencyDollarIcon',
                        permission: 'hr.expenses.view',
                    },
                ],
            },
        ],
    },

    // =========================================================================
    // CRM MODULE
    // =========================================================================
    {
        label: 'CRM',
        icon: 'UserCircleIcon',
        module: MODULES.CRM,
        permission: null,
        priority: 4,
        children: [
            {
                label: 'Dashboard',
                route: 'crm.dashboard',
                icon: 'HomeIcon',
                permission: 'crm.dashboard.view',
            },
            {
                label: 'Customers',
                route: 'crm.customers.index',
                icon: 'UserGroupIcon',
                permission: 'crm.customers.view',
            },
            {
                label: 'Leads',
                route: 'crm.leads.index',
                icon: 'UserPlusIcon',
                permission: 'crm.leads.view',
            },
            {
                label: 'Opportunities',
                route: 'crm.opportunities.index',
                icon: 'SparklesIcon',
                permission: 'crm.opportunities.view',
            },
            {
                label: 'Interactions',
                route: 'crm.interactions.index',
                icon: 'ChatBubbleLeftRightIcon',
                permission: 'crm.interactions.view',
            },
            {
                label: 'Pipeline',
                route: 'crm.pipeline.index',
                icon: 'FunnelIcon',
                permission: 'crm.pipeline.view',
            },
        ],
    },

    // =========================================================================
    // PROJECT MANAGEMENT MODULE
    // =========================================================================
    {
        label: 'Projects',
        icon: 'ClipboardDocumentCheckIcon',
        module: MODULES.PROJECT,
        permission: null,
        priority: 5,
        children: [
            {
                label: 'All Projects',
                route: 'projects.index',
                icon: 'FolderIcon',
                permission: 'projects.view',
            },
            {
                label: 'Tasks',
                route: 'tasks.index',
                icon: 'ClipboardDocumentCheckIcon',
                permission: 'tasks.view',
            },
            {
                label: 'Kanban',
                route: 'projects.kanban',
                icon: 'ViewColumnsIcon',
                permission: 'projects.view',
            },
            {
                label: 'Gantt',
                route: 'projects.gantt',
                icon: 'ChartBarIcon',
                permission: 'projects.view',
            },
            {
                label: 'Time Tracking',
                route: 'projects.time-tracking',
                icon: 'ClockIcon',
                permission: 'projects.time.view',
            },
        ],
    },

    // =========================================================================
    // FINANCE MODULE
    // =========================================================================
    {
        label: 'Finance',
        icon: 'BanknotesIcon',
        module: MODULES.FINANCE,
        permission: null,
        priority: 6,
        children: [
            {
                label: 'Dashboard',
                route: 'finance.dashboard',
                icon: 'HomeIcon',
                permission: 'finance.dashboard.view',
            },
            {
                label: 'Invoices',
                route: 'finance.invoices.index',
                icon: 'DocumentTextIcon',
                permission: 'finance.invoices.view',
            },
            {
                label: 'Expenses',
                route: 'finance.expenses.index',
                icon: 'CreditCardIcon',
                permission: 'finance.expenses.view',
            },
            {
                label: 'Payments',
                route: 'finance.payments.index',
                icon: 'BanknotesIcon',
                permission: 'finance.payments.view',
            },
            {
                label: 'Reports',
                route: 'finance.reports.index',
                icon: 'ChartBarSquareIcon',
                permission: 'finance.reports.view',
            },
        ],
    },

    // =========================================================================
    // INVENTORY MODULE
    // =========================================================================
    {
        label: 'Inventory',
        icon: 'CubeIcon',
        module: MODULES.INVENTORY,
        permission: null,
        priority: 7,
        children: [
            {
                label: 'Products',
                route: 'inventory.products.index',
                icon: 'CubeIcon',
                permission: 'inventory.products.view',
            },
            {
                label: 'Stock',
                route: 'inventory.stock.index',
                icon: 'ArchiveBoxIcon',
                permission: 'inventory.stock.view',
            },
            {
                label: 'Warehouses',
                route: 'inventory.warehouses.index',
                icon: 'BuildingStorefrontIcon',
                permission: 'inventory.warehouses.view',
            },
            {
                label: 'Transfers',
                route: 'inventory.transfers.index',
                icon: 'ArrowsRightLeftIcon',
                permission: 'inventory.transfers.view',
            },
        ],
    },

    // =========================================================================
    // DOCUMENT MANAGEMENT MODULE
    // =========================================================================
    {
        label: 'Documents',
        icon: 'DocumentDuplicateIcon',
        module: MODULES.DMS,
        permission: null,
        priority: 8,
        children: [
            {
                label: 'All Documents',
                route: 'dms.index',
                icon: 'DocumentDuplicateIcon',
                permission: 'dms.documents.view',
            },
            {
                label: 'Categories',
                route: 'dms.categories.index',
                icon: 'FolderIcon',
                permission: 'dms.categories.view',
            },
            {
                label: 'Workflows',
                route: 'dms.workflows.index',
                icon: 'ArrowPathIcon',
                permission: 'dms.workflows.view',
            },
        ],
    },

    // =========================================================================
    // QUALITY MANAGEMENT MODULE
    // =========================================================================
    {
        label: 'Quality',
        icon: 'ShieldCheckIcon',
        module: MODULES.QUALITY,
        permission: null,
        priority: 9,
        children: [
            {
                label: 'Dashboard',
                route: 'quality.dashboard',
                icon: 'HomeIcon',
                permission: 'quality.dashboard.view',
            },
            {
                label: 'Audits',
                route: 'quality.audits.index',
                icon: 'ClipboardDocumentCheckIcon',
                permission: 'quality.audits.view',
            },
            {
                label: 'Non-Conformances',
                route: 'quality.ncrs.index',
                icon: 'ExclamationTriangleIcon',
                permission: 'quality.ncrs.view',
            },
            {
                label: 'CAPAs',
                route: 'quality.capas.index',
                icon: 'WrenchScrewdriverIcon',
                permission: 'quality.capas.view',
            },
        ],
    },

    // =========================================================================
    // ANALYTICS MODULE
    // =========================================================================
    {
        label: 'Analytics',
        icon: 'ChartBarSquareIcon',
        module: MODULES.ANALYTICS,
        permission: null,
        priority: 10,
        children: [
            {
                label: 'Dashboard',
                route: 'analytics.dashboard',
                icon: 'HomeIcon',
                permission: 'analytics.dashboard.view',
            },
            {
                label: 'Reports',
                route: 'analytics.reports.index',
                icon: 'DocumentChartBarIcon',
                permission: 'analytics.reports.view',
            },
            {
                label: 'Custom Reports',
                route: 'analytics.custom.index',
                icon: 'PresentationChartLineIcon',
                permission: 'analytics.custom.view',
            },
        ],
    },

    // =========================================================================
    // COMPLIANCE MODULE
    // =========================================================================
    {
        label: 'Compliance',
        icon: 'ScaleIcon',
        module: MODULES.COMPLIANCE,
        permission: null,
        priority: 11,
        children: [
            {
                label: 'Dashboard',
                route: 'compliance.dashboard',
                icon: 'HomeIcon',
                permission: 'compliance.dashboard.view',
            },
            {
                label: 'Policies',
                route: 'compliance.policies.index',
                icon: 'DocumentTextIcon',
                permission: 'compliance.policies.view',
            },
            {
                label: 'Regulations',
                route: 'compliance.regulations.index',
                icon: 'ScaleIcon',
                permission: 'compliance.regulations.view',
            },
            {
                label: 'Audits',
                route: 'compliance.audits.index',
                icon: 'ClipboardDocumentCheckIcon',
                permission: 'compliance.audits.view',
            },
        ],
    },
];

// =============================================================================
// SETTINGS NAVIGATION
// =============================================================================
export const settingsNavigationConfig = [
    {
        label: 'General',
        icon: 'Cog6ToothIcon',
        route: 'settings.general',
        permission: 'settings.general.view',
        priority: 1,
    },
    {
        label: 'Company',
        icon: 'BuildingOffice2Icon',
        route: 'settings.company',
        permission: 'settings.company.view',
        priority: 2,
    },
    {
        label: 'Users & Roles',
        icon: 'UserGroupIcon',
        route: 'settings.users',
        permission: 'settings.users.view',
        priority: 3,
    },
    {
        label: 'Modules',
        icon: 'CubeIcon',
        route: 'settings.modules',
        permission: 'settings.modules.view',
        priority: 4,
    },
    {
        label: 'Integrations',
        icon: 'LinkIcon',
        route: 'settings.integrations',
        permission: 'settings.integrations.view',
        priority: 5,
    },
    {
        label: 'Billing',
        icon: 'CreditCardIcon',
        route: 'settings.billing',
        permission: 'settings.billing.view',
        priority: 6,
    },
    {
        label: 'Invoice Branding',
        icon: 'DocumentTextIcon',
        route: 'settings.invoice-branding',
        permission: 'settings.billing.view',
        priority: 7,
    },
    {
        label: 'SAML SSO',
        icon: 'ShieldCheckIcon',
        route: 'settings.saml',
        permission: 'settings.security.view',
        priority: 8,
    },
];

export default navigationConfig;
