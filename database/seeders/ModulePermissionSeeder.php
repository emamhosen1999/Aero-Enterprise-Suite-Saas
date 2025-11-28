<?php

namespace Database\Seeders;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModulePermission;
use App\Models\SubModule;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;

class ModulePermissionSeeder extends Seeder
{
    /**
     * Module definitions with full hierarchy and permission mappings.
     * This structure defines all modules, sub-modules, components, and their required permissions.
     */
    private array $moduleDefinitions = [
        // =====================================================================
        // CORE SYSTEM - Dashboard & Analytics
        // =====================================================================
        [
            'code' => 'CORE',
            'name' => 'Dashboard & Analytics',
            'description' => 'Core system dashboard, analytics, and overview',
            'icon' => 'HomeIcon',
            'category' => Module::CATEGORY_CORE,
            'route_prefix' => '/',
            'is_active' => true,
            'sort_order' => 1,
            'permissions' => ['core.dashboard.view', 'core.stats.view', 'core.updates.view'],
            'sub_modules' => [
                [
                    'code' => 'DASHBOARD',
                    'name' => 'Dashboard',
                    'description' => 'Main dashboard with overview widgets',
                    'icon' => 'ChartBarIcon',
                    'route_prefix' => '/dashboard',
                    'permissions' => ['core.dashboard.view'],
                    'components' => [
                        ['code' => 'DASHBOARD_PAGE', 'name' => 'Dashboard Page', 'type' => 'page', 'route_name' => 'dashboard', 'permissions' => ['core.dashboard.view']],
                        ['code' => 'STATS_WIDGET', 'name' => 'Statistics Widget', 'type' => 'widget', 'permissions' => ['core.stats.view']],
                        ['code' => 'UPDATES_WIDGET', 'name' => 'Recent Updates Widget', 'type' => 'widget', 'permissions' => ['core.updates.view']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // SELF SERVICE MODULE
        // =====================================================================
        [
            'code' => 'SELF_SERVICE',
            'name' => 'Self Service Portal',
            'description' => 'Employee self-service for attendance, leave, and profile management',
            'icon' => 'UserCircleIcon',
            'category' => Module::CATEGORY_SELF_SERVICE,
            'route_prefix' => '/self-service',
            'is_active' => true,
            'sort_order' => 2,
            'permissions' => ['attendance.own.view', 'leave.own.view', 'profile.own.view'],
            'sub_modules' => [
                [
                    'code' => 'MY_ATTENDANCE',
                    'name' => 'My Attendance',
                    'description' => 'Personal attendance tracking and punch',
                    'icon' => 'ClockIcon',
                    'route_prefix' => '/self-service/attendance',
                    'permissions' => ['attendance.own.view', 'attendance.own.punch'],
                    'components' => [
                        ['code' => 'MY_ATTENDANCE_PAGE', 'name' => 'My Attendance Page', 'type' => 'page', 'route_name' => 'self-service.attendance', 'permissions' => ['attendance.own.view']],
                        ['code' => 'PUNCH_ACTION', 'name' => 'Punch In/Out', 'type' => 'action', 'permissions' => ['attendance.own.punch']],
                    ],
                ],
                [
                    'code' => 'MY_LEAVES',
                    'name' => 'My Leave Requests',
                    'description' => 'Personal leave management',
                    'icon' => 'CalendarDaysIcon',
                    'route_prefix' => '/self-service/leaves',
                    'permissions' => ['leave.own.view', 'leave.own.create', 'leave.own.update', 'leave.own.delete'],
                    'components' => [
                        ['code' => 'MY_LEAVES_PAGE', 'name' => 'My Leaves Page', 'type' => 'page', 'route_name' => 'self-service.leaves', 'permissions' => ['leave.own.view']],
                        ['code' => 'CREATE_LEAVE_BTN', 'name' => 'Create Leave Request', 'type' => 'action', 'permissions' => ['leave.own.create']],
                        ['code' => 'EDIT_LEAVE_BTN', 'name' => 'Edit Leave Request', 'type' => 'action', 'permissions' => ['leave.own.update']],
                        ['code' => 'CANCEL_LEAVE_BTN', 'name' => 'Cancel Leave Request', 'type' => 'action', 'permissions' => ['leave.own.delete']],
                    ],
                ],
                [
                    'code' => 'MY_PROFILE',
                    'name' => 'My Profile',
                    'description' => 'Personal profile and password management',
                    'icon' => 'UserIcon',
                    'route_prefix' => '/profile',
                    'permissions' => ['profile.own.view', 'profile.own.update', 'profile.password.change'],
                    'components' => [
                        ['code' => 'PROFILE_PAGE', 'name' => 'Profile Page', 'type' => 'page', 'route_name' => 'profile.show', 'permissions' => ['profile.own.view']],
                        ['code' => 'EDIT_PROFILE_BTN', 'name' => 'Edit Profile', 'type' => 'action', 'permissions' => ['profile.own.update']],
                        ['code' => 'CHANGE_PASSWORD_BTN', 'name' => 'Change Password', 'type' => 'action', 'permissions' => ['profile.password.change']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // HUMAN RESOURCE MANAGEMENT (HRM)
        // =====================================================================
        [
            'code' => 'HRM',
            'name' => 'Human Resource Management',
            'description' => 'Comprehensive HR management including employees, departments, attendance, and leaves',
            'icon' => 'UsersIcon',
            'category' => Module::CATEGORY_HUMAN_RESOURCES,
            'route_prefix' => '/hr',
            'is_active' => true,
            'sort_order' => 3,
            'permissions' => ['employees.view', 'departments.view', 'attendance.view', 'leaves.view'],
            'sub_modules' => [
                [
                    'code' => 'EMPLOYEES',
                    'name' => 'Employees',
                    'description' => 'Employee management',
                    'icon' => 'UsersIcon',
                    'route_prefix' => '/hr/employees',
                    'permissions' => ['employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.import', 'employees.export'],
                    'components' => [
                        ['code' => 'EMPLOYEES_LIST', 'name' => 'Employees List Page', 'type' => 'page', 'route_name' => 'employees.index', 'permissions' => ['employees.view']],
                        ['code' => 'EMPLOYEE_DETAIL', 'name' => 'Employee Detail Page', 'type' => 'page', 'route_name' => 'employees.show', 'permissions' => ['employees.view']],
                        ['code' => 'CREATE_EMPLOYEE_BTN', 'name' => 'Create Employee', 'type' => 'action', 'permissions' => ['employees.create']],
                        ['code' => 'EDIT_EMPLOYEE_BTN', 'name' => 'Edit Employee', 'type' => 'action', 'permissions' => ['employees.update']],
                        ['code' => 'DELETE_EMPLOYEE_BTN', 'name' => 'Delete Employee', 'type' => 'action', 'permissions' => ['employees.delete']],
                        ['code' => 'IMPORT_EMPLOYEES_BTN', 'name' => 'Import Employees', 'type' => 'action', 'permissions' => ['employees.import']],
                        ['code' => 'EXPORT_EMPLOYEES_BTN', 'name' => 'Export Employees', 'type' => 'action', 'permissions' => ['employees.export']],
                    ],
                ],
                [
                    'code' => 'DEPARTMENTS',
                    'name' => 'Departments',
                    'description' => 'Department management',
                    'icon' => 'BuildingOfficeIcon',
                    'route_prefix' => '/hr/departments',
                    'permissions' => ['departments.view', 'departments.create', 'departments.update', 'departments.delete'],
                    'components' => [
                        ['code' => 'DEPARTMENTS_LIST', 'name' => 'Departments List Page', 'type' => 'page', 'route_name' => 'departments.index', 'permissions' => ['departments.view']],
                        ['code' => 'CREATE_DEPT_BTN', 'name' => 'Create Department', 'type' => 'action', 'permissions' => ['departments.create']],
                        ['code' => 'EDIT_DEPT_BTN', 'name' => 'Edit Department', 'type' => 'action', 'permissions' => ['departments.update']],
                        ['code' => 'DELETE_DEPT_BTN', 'name' => 'Delete Department', 'type' => 'action', 'permissions' => ['departments.delete']],
                    ],
                ],
                [
                    'code' => 'DESIGNATIONS',
                    'name' => 'Designations',
                    'description' => 'Job designation/position management',
                    'icon' => 'BriefcaseIcon',
                    'route_prefix' => '/hr/designations',
                    'permissions' => ['designations.view', 'designations.create', 'designations.update', 'designations.delete'],
                    'components' => [
                        ['code' => 'DESIGNATIONS_LIST', 'name' => 'Designations List Page', 'type' => 'page', 'route_name' => 'designations.index', 'permissions' => ['designations.view']],
                        ['code' => 'CREATE_DESIG_BTN', 'name' => 'Create Designation', 'type' => 'action', 'permissions' => ['designations.create']],
                        ['code' => 'EDIT_DESIG_BTN', 'name' => 'Edit Designation', 'type' => 'action', 'permissions' => ['designations.update']],
                        ['code' => 'DELETE_DESIG_BTN', 'name' => 'Delete Designation', 'type' => 'action', 'permissions' => ['designations.delete']],
                    ],
                ],
                [
                    'code' => 'ATTENDANCE',
                    'name' => 'Attendance Management',
                    'description' => 'Employee attendance tracking and management',
                    'icon' => 'ClockIcon',
                    'route_prefix' => '/hr/attendance',
                    'permissions' => ['attendance.view', 'attendance.create', 'attendance.update', 'attendance.delete', 'attendance.import', 'attendance.export'],
                    'components' => [
                        ['code' => 'ATTENDANCE_LIST', 'name' => 'Attendance List Page', 'type' => 'page', 'route_name' => 'attendance.index', 'permissions' => ['attendance.view']],
                        ['code' => 'CREATE_ATTEND_BTN', 'name' => 'Create Attendance', 'type' => 'action', 'permissions' => ['attendance.create']],
                        ['code' => 'EDIT_ATTEND_BTN', 'name' => 'Edit Attendance', 'type' => 'action', 'permissions' => ['attendance.update']],
                        ['code' => 'DELETE_ATTEND_BTN', 'name' => 'Delete Attendance', 'type' => 'action', 'permissions' => ['attendance.delete']],
                        ['code' => 'IMPORT_ATTEND_BTN', 'name' => 'Import Attendance', 'type' => 'action', 'permissions' => ['attendance.import']],
                        ['code' => 'EXPORT_ATTEND_BTN', 'name' => 'Export Attendance', 'type' => 'action', 'permissions' => ['attendance.export']],
                    ],
                ],
                [
                    'code' => 'HOLIDAYS',
                    'name' => 'Holidays',
                    'description' => 'Holiday calendar management',
                    'icon' => 'CalendarIcon',
                    'route_prefix' => '/hr/holidays',
                    'permissions' => ['holidays.view', 'holidays.create', 'holidays.update', 'holidays.delete'],
                    'components' => [
                        ['code' => 'HOLIDAYS_LIST', 'name' => 'Holidays List Page', 'type' => 'page', 'route_name' => 'holidays.index', 'permissions' => ['holidays.view']],
                        ['code' => 'CREATE_HOLIDAY_BTN', 'name' => 'Create Holiday', 'type' => 'action', 'permissions' => ['holidays.create']],
                        ['code' => 'EDIT_HOLIDAY_BTN', 'name' => 'Edit Holiday', 'type' => 'action', 'permissions' => ['holidays.update']],
                        ['code' => 'DELETE_HOLIDAY_BTN', 'name' => 'Delete Holiday', 'type' => 'action', 'permissions' => ['holidays.delete']],
                    ],
                ],
                [
                    'code' => 'LEAVES',
                    'name' => 'Leave Management',
                    'description' => 'Employee leave requests and approvals',
                    'icon' => 'CalendarDaysIcon',
                    'route_prefix' => '/hr/leaves',
                    'permissions' => ['leaves.view', 'leaves.create', 'leaves.update', 'leaves.delete', 'leaves.approve', 'leaves.analytics'],
                    'components' => [
                        ['code' => 'LEAVES_LIST', 'name' => 'Leaves List Page', 'type' => 'page', 'route_name' => 'leaves.index', 'permissions' => ['leaves.view']],
                        ['code' => 'LEAVE_ANALYTICS', 'name' => 'Leave Analytics', 'type' => 'page', 'route_name' => 'leaves.analytics', 'permissions' => ['leaves.analytics']],
                        ['code' => 'CREATE_LEAVE_BTN', 'name' => 'Create Leave', 'type' => 'action', 'permissions' => ['leaves.create']],
                        ['code' => 'EDIT_LEAVE_BTN', 'name' => 'Edit Leave', 'type' => 'action', 'permissions' => ['leaves.update']],
                        ['code' => 'DELETE_LEAVE_BTN', 'name' => 'Delete Leave', 'type' => 'action', 'permissions' => ['leaves.delete']],
                        ['code' => 'APPROVE_LEAVE_BTN', 'name' => 'Approve Leave', 'type' => 'action', 'permissions' => ['leaves.approve']],
                    ],
                ],
                [
                    'code' => 'LEAVE_SETTINGS',
                    'name' => 'Leave Settings',
                    'description' => 'Leave types and policies configuration',
                    'icon' => 'Cog6ToothIcon',
                    'route_prefix' => '/hr/leave-settings',
                    'permissions' => ['leave-settings.view', 'leave-settings.update'],
                    'components' => [
                        ['code' => 'LEAVE_SETTINGS_PAGE', 'name' => 'Leave Settings Page', 'type' => 'page', 'route_name' => 'leave-settings.index', 'permissions' => ['leave-settings.view']],
                        ['code' => 'UPDATE_LEAVE_SETTINGS', 'name' => 'Update Leave Settings', 'type' => 'action', 'permissions' => ['leave-settings.update']],
                    ],
                ],
                [
                    'code' => 'JURISDICTIONS',
                    'name' => 'Jurisdictions',
                    'description' => 'Office/Branch location management',
                    'icon' => 'MapPinIcon',
                    'route_prefix' => '/hr/jurisdictions',
                    'permissions' => ['jurisdiction.view', 'jurisdiction.create', 'jurisdiction.update', 'jurisdiction.delete'],
                    'components' => [
                        ['code' => 'JURISDICTIONS_LIST', 'name' => 'Jurisdictions List Page', 'type' => 'page', 'route_name' => 'jurisdictions.index', 'permissions' => ['jurisdiction.view']],
                        ['code' => 'CREATE_JURIS_BTN', 'name' => 'Create Jurisdiction', 'type' => 'action', 'permissions' => ['jurisdiction.create']],
                        ['code' => 'EDIT_JURIS_BTN', 'name' => 'Edit Jurisdiction', 'type' => 'action', 'permissions' => ['jurisdiction.update']],
                        ['code' => 'DELETE_JURIS_BTN', 'name' => 'Delete Jurisdiction', 'type' => 'action', 'permissions' => ['jurisdiction.delete']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // PROJECT & PORTFOLIO MANAGEMENT (PPM)
        // =====================================================================
        [
            'code' => 'PPM',
            'name' => 'Project & Portfolio Management',
            'description' => 'Project management, daily work logs, tasks, and reports',
            'icon' => 'FolderOpenIcon',
            'category' => Module::CATEGORY_PROJECT_MANAGEMENT,
            'route_prefix' => '/projects',
            'is_active' => true,
            'sort_order' => 4,
            'permissions' => ['daily-works.view', 'tasks.view', 'reports.view', 'projects.analytics'],
            'sub_modules' => [
                [
                    'code' => 'DAILY_WORKS',
                    'name' => 'Daily Works',
                    'description' => 'Daily work logging and tracking',
                    'icon' => 'DocumentTextIcon',
                    'route_prefix' => '/projects/daily-works',
                    'permissions' => ['daily-works.view', 'daily-works.create', 'daily-works.update', 'daily-works.delete', 'daily-works.import', 'daily-works.export'],
                    'components' => [
                        ['code' => 'DAILY_WORKS_LIST', 'name' => 'Daily Works List Page', 'type' => 'page', 'route_name' => 'daily-works.index', 'permissions' => ['daily-works.view']],
                        ['code' => 'CREATE_DAILY_WORK_BTN', 'name' => 'Create Daily Work', 'type' => 'action', 'permissions' => ['daily-works.create']],
                        ['code' => 'EDIT_DAILY_WORK_BTN', 'name' => 'Edit Daily Work', 'type' => 'action', 'permissions' => ['daily-works.update']],
                        ['code' => 'DELETE_DAILY_WORK_BTN', 'name' => 'Delete Daily Work', 'type' => 'action', 'permissions' => ['daily-works.delete']],
                        ['code' => 'IMPORT_DAILY_WORK_BTN', 'name' => 'Import Daily Works', 'type' => 'action', 'permissions' => ['daily-works.import']],
                        ['code' => 'EXPORT_DAILY_WORK_BTN', 'name' => 'Export Daily Works', 'type' => 'action', 'permissions' => ['daily-works.export']],
                    ],
                ],
                [
                    'code' => 'PROJECT_ANALYTICS',
                    'name' => 'Project Analytics',
                    'description' => 'Project performance analytics and dashboards',
                    'icon' => 'ChartPieIcon',
                    'route_prefix' => '/projects/analytics',
                    'permissions' => ['projects.analytics'],
                    'components' => [
                        ['code' => 'PROJECT_ANALYTICS_PAGE', 'name' => 'Project Analytics Page', 'type' => 'page', 'route_name' => 'projects.analytics', 'permissions' => ['projects.analytics']],
                    ],
                ],
                [
                    'code' => 'TASKS',
                    'name' => 'Tasks',
                    'description' => 'Task management and assignment',
                    'icon' => 'CheckCircleIcon',
                    'route_prefix' => '/projects/tasks',
                    'permissions' => ['tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign'],
                    'components' => [
                        ['code' => 'TASKS_LIST', 'name' => 'Tasks List Page', 'type' => 'page', 'route_name' => 'tasks.index', 'permissions' => ['tasks.view']],
                        ['code' => 'CREATE_TASK_BTN', 'name' => 'Create Task', 'type' => 'action', 'permissions' => ['tasks.create']],
                        ['code' => 'EDIT_TASK_BTN', 'name' => 'Edit Task', 'type' => 'action', 'permissions' => ['tasks.update']],
                        ['code' => 'DELETE_TASK_BTN', 'name' => 'Delete Task', 'type' => 'action', 'permissions' => ['tasks.delete']],
                        ['code' => 'ASSIGN_TASK_BTN', 'name' => 'Assign Task', 'type' => 'action', 'permissions' => ['tasks.assign']],
                    ],
                ],
                [
                    'code' => 'REPORTS',
                    'name' => 'Reports',
                    'description' => 'Project reports and documentation',
                    'icon' => 'DocumentChartBarIcon',
                    'route_prefix' => '/projects/reports',
                    'permissions' => ['reports.view', 'reports.create', 'reports.update', 'reports.delete'],
                    'components' => [
                        ['code' => 'REPORTS_LIST', 'name' => 'Reports List Page', 'type' => 'page', 'route_name' => 'reports.index', 'permissions' => ['reports.view']],
                        ['code' => 'CREATE_REPORT_BTN', 'name' => 'Create Report', 'type' => 'action', 'permissions' => ['reports.create']],
                        ['code' => 'EDIT_REPORT_BTN', 'name' => 'Edit Report', 'type' => 'action', 'permissions' => ['reports.update']],
                        ['code' => 'DELETE_REPORT_BTN', 'name' => 'Delete Report', 'type' => 'action', 'permissions' => ['reports.delete']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // DOCUMENT MANAGEMENT SYSTEM (DMS)
        // =====================================================================
        [
            'code' => 'DMS',
            'name' => 'Document Management',
            'description' => 'Document and letter management system',
            'icon' => 'DocumentDuplicateIcon',
            'category' => Module::CATEGORY_DOCUMENT_MANAGEMENT,
            'route_prefix' => '/dms',
            'is_active' => true,
            'sort_order' => 5,
            'permissions' => ['letters.view', 'documents.view'],
            'sub_modules' => [
                [
                    'code' => 'LETTERS',
                    'name' => 'Letters',
                    'description' => 'Official letter management',
                    'icon' => 'EnvelopeIcon',
                    'route_prefix' => '/dms/letters',
                    'permissions' => ['letters.view', 'letters.create', 'letters.update', 'letters.delete'],
                    'components' => [
                        ['code' => 'LETTERS_LIST', 'name' => 'Letters List Page', 'type' => 'page', 'route_name' => 'letters.index', 'permissions' => ['letters.view']],
                        ['code' => 'CREATE_LETTER_BTN', 'name' => 'Create Letter', 'type' => 'action', 'permissions' => ['letters.create']],
                        ['code' => 'EDIT_LETTER_BTN', 'name' => 'Edit Letter', 'type' => 'action', 'permissions' => ['letters.update']],
                        ['code' => 'DELETE_LETTER_BTN', 'name' => 'Delete Letter', 'type' => 'action', 'permissions' => ['letters.delete']],
                    ],
                ],
                [
                    'code' => 'DOCUMENTS',
                    'name' => 'Documents',
                    'description' => 'Document storage and management',
                    'icon' => 'DocumentIcon',
                    'route_prefix' => '/dms/documents',
                    'permissions' => ['documents.view', 'documents.create', 'documents.update', 'documents.delete'],
                    'components' => [
                        ['code' => 'DOCUMENTS_LIST', 'name' => 'Documents List Page', 'type' => 'page', 'route_name' => 'documents.index', 'permissions' => ['documents.view']],
                        ['code' => 'CREATE_DOC_BTN', 'name' => 'Create Document', 'type' => 'action', 'permissions' => ['documents.create']],
                        ['code' => 'EDIT_DOC_BTN', 'name' => 'Edit Document', 'type' => 'action', 'permissions' => ['documents.update']],
                        ['code' => 'DELETE_DOC_BTN', 'name' => 'Delete Document', 'type' => 'action', 'permissions' => ['documents.delete']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // CUSTOMER RELATIONSHIP MANAGEMENT (CRM) - Future Module
        // =====================================================================
        [
            'code' => 'CRM',
            'name' => 'Customer Relationship Management',
            'description' => 'Customer, lead, and feedback management',
            'icon' => 'UserGroupIcon',
            'category' => Module::CATEGORY_CUSTOMER_RELATIONS,
            'route_prefix' => '/crm',
            'is_active' => false, // Future module
            'sort_order' => 6,
            'permissions' => ['customers.view', 'leads.view', 'feedback.view'],
            'sub_modules' => [
                [
                    'code' => 'CUSTOMERS',
                    'name' => 'Customers',
                    'description' => 'Customer management',
                    'icon' => 'UsersIcon',
                    'route_prefix' => '/crm/customers',
                    'permissions' => ['customers.view', 'customers.create', 'customers.update', 'customers.delete'],
                    'components' => [
                        ['code' => 'CUSTOMERS_LIST', 'name' => 'Customers List Page', 'type' => 'page', 'route_name' => 'customers.index', 'permissions' => ['customers.view']],
                        ['code' => 'CREATE_CUSTOMER_BTN', 'name' => 'Create Customer', 'type' => 'action', 'permissions' => ['customers.create']],
                        ['code' => 'EDIT_CUSTOMER_BTN', 'name' => 'Edit Customer', 'type' => 'action', 'permissions' => ['customers.update']],
                        ['code' => 'DELETE_CUSTOMER_BTN', 'name' => 'Delete Customer', 'type' => 'action', 'permissions' => ['customers.delete']],
                    ],
                ],
                [
                    'code' => 'LEADS',
                    'name' => 'Leads',
                    'description' => 'Sales lead management',
                    'icon' => 'StarIcon',
                    'route_prefix' => '/crm/leads',
                    'permissions' => ['leads.view', 'leads.create', 'leads.update', 'leads.delete'],
                    'components' => [
                        ['code' => 'LEADS_LIST', 'name' => 'Leads List Page', 'type' => 'page', 'route_name' => 'leads.index', 'permissions' => ['leads.view']],
                        ['code' => 'CREATE_LEAD_BTN', 'name' => 'Create Lead', 'type' => 'action', 'permissions' => ['leads.create']],
                        ['code' => 'EDIT_LEAD_BTN', 'name' => 'Edit Lead', 'type' => 'action', 'permissions' => ['leads.update']],
                        ['code' => 'DELETE_LEAD_BTN', 'name' => 'Delete Lead', 'type' => 'action', 'permissions' => ['leads.delete']],
                    ],
                ],
                [
                    'code' => 'FEEDBACK',
                    'name' => 'Feedback',
                    'description' => 'Customer feedback management',
                    'icon' => 'ChatBubbleLeftEllipsisIcon',
                    'route_prefix' => '/crm/feedback',
                    'permissions' => ['feedback.view', 'feedback.create', 'feedback.update', 'feedback.delete'],
                    'components' => [
                        ['code' => 'FEEDBACK_LIST', 'name' => 'Feedback List Page', 'type' => 'page', 'route_name' => 'feedback.index', 'permissions' => ['feedback.view']],
                        ['code' => 'CREATE_FEEDBACK_BTN', 'name' => 'Create Feedback', 'type' => 'action', 'permissions' => ['feedback.create']],
                        ['code' => 'EDIT_FEEDBACK_BTN', 'name' => 'Edit Feedback', 'type' => 'action', 'permissions' => ['feedback.update']],
                        ['code' => 'DELETE_FEEDBACK_BTN', 'name' => 'Delete Feedback', 'type' => 'action', 'permissions' => ['feedback.delete']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // SUPPLY CHAIN MANAGEMENT (SCM) - Future Module
        // =====================================================================
        [
            'code' => 'SCM',
            'name' => 'Supply Chain & Inventory',
            'description' => 'Inventory, suppliers, and purchase order management',
            'icon' => 'TruckIcon',
            'category' => Module::CATEGORY_SUPPLY_CHAIN,
            'route_prefix' => '/scm',
            'is_active' => false, // Future module
            'sort_order' => 7,
            'permissions' => ['inventory.view', 'suppliers.view', 'purchase-orders.view'],
            'sub_modules' => [
                [
                    'code' => 'INVENTORY',
                    'name' => 'Inventory',
                    'description' => 'Inventory management',
                    'icon' => 'ArchiveBoxIcon',
                    'route_prefix' => '/scm/inventory',
                    'permissions' => ['inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete'],
                    'components' => [
                        ['code' => 'INVENTORY_LIST', 'name' => 'Inventory List Page', 'type' => 'page', 'route_name' => 'inventory.index', 'permissions' => ['inventory.view']],
                        ['code' => 'CREATE_INVENTORY_BTN', 'name' => 'Create Inventory', 'type' => 'action', 'permissions' => ['inventory.create']],
                        ['code' => 'EDIT_INVENTORY_BTN', 'name' => 'Edit Inventory', 'type' => 'action', 'permissions' => ['inventory.update']],
                        ['code' => 'DELETE_INVENTORY_BTN', 'name' => 'Delete Inventory', 'type' => 'action', 'permissions' => ['inventory.delete']],
                    ],
                ],
                [
                    'code' => 'SUPPLIERS',
                    'name' => 'Suppliers',
                    'description' => 'Supplier management',
                    'icon' => 'BuildingStorefrontIcon',
                    'route_prefix' => '/scm/suppliers',
                    'permissions' => ['suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.delete'],
                    'components' => [
                        ['code' => 'SUPPLIERS_LIST', 'name' => 'Suppliers List Page', 'type' => 'page', 'route_name' => 'suppliers.index', 'permissions' => ['suppliers.view']],
                        ['code' => 'CREATE_SUPPLIER_BTN', 'name' => 'Create Supplier', 'type' => 'action', 'permissions' => ['suppliers.create']],
                        ['code' => 'EDIT_SUPPLIER_BTN', 'name' => 'Edit Supplier', 'type' => 'action', 'permissions' => ['suppliers.update']],
                        ['code' => 'DELETE_SUPPLIER_BTN', 'name' => 'Delete Supplier', 'type' => 'action', 'permissions' => ['suppliers.delete']],
                    ],
                ],
                [
                    'code' => 'PURCHASE_ORDERS',
                    'name' => 'Purchase Orders',
                    'description' => 'Purchase order management',
                    'icon' => 'ShoppingCartIcon',
                    'route_prefix' => '/scm/purchase-orders',
                    'permissions' => ['purchase-orders.view', 'purchase-orders.create', 'purchase-orders.update', 'purchase-orders.delete'],
                    'components' => [
                        ['code' => 'PO_LIST', 'name' => 'Purchase Orders List Page', 'type' => 'page', 'route_name' => 'purchase-orders.index', 'permissions' => ['purchase-orders.view']],
                        ['code' => 'CREATE_PO_BTN', 'name' => 'Create Purchase Order', 'type' => 'action', 'permissions' => ['purchase-orders.create']],
                        ['code' => 'EDIT_PO_BTN', 'name' => 'Edit Purchase Order', 'type' => 'action', 'permissions' => ['purchase-orders.update']],
                        ['code' => 'DELETE_PO_BTN', 'name' => 'Delete Purchase Order', 'type' => 'action', 'permissions' => ['purchase-orders.delete']],
                    ],
                ],
                [
                    'code' => 'WAREHOUSING',
                    'name' => 'Warehousing',
                    'description' => 'Warehouse management',
                    'icon' => 'HomeModernIcon',
                    'route_prefix' => '/scm/warehousing',
                    'permissions' => ['warehousing.view', 'warehousing.manage'],
                    'components' => [
                        ['code' => 'WAREHOUSING_PAGE', 'name' => 'Warehousing Page', 'type' => 'page', 'route_name' => 'warehousing.index', 'permissions' => ['warehousing.view']],
                        ['code' => 'MANAGE_WAREHOUSE_BTN', 'name' => 'Manage Warehouse', 'type' => 'action', 'permissions' => ['warehousing.manage']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // RETAIL & SALES - Future Module
        // =====================================================================
        [
            'code' => 'RETAIL',
            'name' => 'Retail & Sales',
            'description' => 'Point of sale and retail operations',
            'icon' => 'ShoppingBagIcon',
            'category' => Module::CATEGORY_RETAIL_SALES,
            'route_prefix' => '/retail',
            'is_active' => false, // Future module
            'sort_order' => 8,
            'permissions' => ['pos.view', 'sales.view'],
            'sub_modules' => [
                [
                    'code' => 'POS',
                    'name' => 'Point of Sale',
                    'description' => 'POS terminal operations',
                    'icon' => 'CurrencyDollarIcon',
                    'route_prefix' => '/retail/pos',
                    'permissions' => ['pos.view', 'pos.operate'],
                    'components' => [
                        ['code' => 'POS_PAGE', 'name' => 'POS Terminal', 'type' => 'page', 'route_name' => 'pos.index', 'permissions' => ['pos.view']],
                        ['code' => 'POS_OPERATE_BTN', 'name' => 'Operate POS', 'type' => 'action', 'permissions' => ['pos.operate']],
                    ],
                ],
                [
                    'code' => 'SALES',
                    'name' => 'Sales',
                    'description' => 'Sales management and analytics',
                    'icon' => 'PresentationChartLineIcon',
                    'route_prefix' => '/retail/sales',
                    'permissions' => ['sales.view', 'sales.create', 'sales.analytics'],
                    'components' => [
                        ['code' => 'SALES_LIST', 'name' => 'Sales List Page', 'type' => 'page', 'route_name' => 'sales.index', 'permissions' => ['sales.view']],
                        ['code' => 'CREATE_SALE_BTN', 'name' => 'Create Sale', 'type' => 'action', 'permissions' => ['sales.create']],
                        ['code' => 'SALES_ANALYTICS_PAGE', 'name' => 'Sales Analytics', 'type' => 'page', 'route_name' => 'sales.analytics', 'permissions' => ['sales.analytics']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // FINANCIAL MANAGEMENT - Future Module
        // =====================================================================
        [
            'code' => 'FINANCE',
            'name' => 'Financial Management',
            'description' => 'Accounting and financial operations',
            'icon' => 'BanknotesIcon',
            'category' => Module::CATEGORY_FINANCIAL,
            'route_prefix' => '/finance',
            'is_active' => false, // Future module
            'sort_order' => 9,
            'permissions' => ['accounts-payable.view', 'accounts-receivable.view', 'ledger.view', 'financial-reports.view'],
            'sub_modules' => [
                [
                    'code' => 'ACCOUNTS_PAYABLE',
                    'name' => 'Accounts Payable',
                    'description' => 'Payables management',
                    'icon' => 'ArrowUpTrayIcon',
                    'route_prefix' => '/finance/payables',
                    'permissions' => ['accounts-payable.view', 'accounts-payable.manage'],
                    'components' => [
                        ['code' => 'AP_LIST', 'name' => 'Accounts Payable Page', 'type' => 'page', 'route_name' => 'payables.index', 'permissions' => ['accounts-payable.view']],
                        ['code' => 'MANAGE_AP_BTN', 'name' => 'Manage Payables', 'type' => 'action', 'permissions' => ['accounts-payable.manage']],
                    ],
                ],
                [
                    'code' => 'ACCOUNTS_RECEIVABLE',
                    'name' => 'Accounts Receivable',
                    'description' => 'Receivables management',
                    'icon' => 'ArrowDownTrayIcon',
                    'route_prefix' => '/finance/receivables',
                    'permissions' => ['accounts-receivable.view', 'accounts-receivable.manage'],
                    'components' => [
                        ['code' => 'AR_LIST', 'name' => 'Accounts Receivable Page', 'type' => 'page', 'route_name' => 'receivables.index', 'permissions' => ['accounts-receivable.view']],
                        ['code' => 'MANAGE_AR_BTN', 'name' => 'Manage Receivables', 'type' => 'action', 'permissions' => ['accounts-receivable.manage']],
                    ],
                ],
                [
                    'code' => 'LEDGER',
                    'name' => 'General Ledger',
                    'description' => 'General ledger management',
                    'icon' => 'BookOpenIcon',
                    'route_prefix' => '/finance/ledger',
                    'permissions' => ['ledger.view', 'ledger.manage'],
                    'components' => [
                        ['code' => 'LEDGER_PAGE', 'name' => 'General Ledger Page', 'type' => 'page', 'route_name' => 'ledger.index', 'permissions' => ['ledger.view']],
                        ['code' => 'MANAGE_LEDGER_BTN', 'name' => 'Manage Ledger', 'type' => 'action', 'permissions' => ['ledger.manage']],
                    ],
                ],
                [
                    'code' => 'FINANCIAL_REPORTS',
                    'name' => 'Financial Reports',
                    'description' => 'Financial reporting and analytics',
                    'icon' => 'DocumentChartBarIcon',
                    'route_prefix' => '/finance/reports',
                    'permissions' => ['financial-reports.view', 'financial-reports.create'],
                    'components' => [
                        ['code' => 'FIN_REPORTS_LIST', 'name' => 'Financial Reports Page', 'type' => 'page', 'route_name' => 'financial-reports.index', 'permissions' => ['financial-reports.view']],
                        ['code' => 'CREATE_FIN_REPORT_BTN', 'name' => 'Create Financial Report', 'type' => 'action', 'permissions' => ['financial-reports.create']],
                    ],
                ],
            ],
        ],

        // =====================================================================
        // SYSTEM ADMINISTRATION
        // =====================================================================
        [
            'code' => 'ADMIN',
            'name' => 'System Administration',
            'description' => 'System settings, users, roles, and administration',
            'icon' => 'Cog8ToothIcon',
            'category' => Module::CATEGORY_ADMINISTRATION,
            'route_prefix' => '/admin',
            'is_active' => true,
            'sort_order' => 10,
            'permissions' => ['users.view', 'roles.view', 'settings.view', 'modules.view'],
            'sub_modules' => [
                [
                    'code' => 'USERS',
                    'name' => 'User Management',
                    'description' => 'System user management',
                    'icon' => 'UsersIcon',
                    'route_prefix' => '/admin/users',
                    'permissions' => ['users.view', 'users.create', 'users.update', 'users.delete', 'users.impersonate'],
                    'components' => [
                        ['code' => 'USERS_LIST', 'name' => 'Users List Page', 'type' => 'page', 'route_name' => 'users.index', 'permissions' => ['users.view']],
                        ['code' => 'CREATE_USER_BTN', 'name' => 'Create User', 'type' => 'action', 'permissions' => ['users.create']],
                        ['code' => 'EDIT_USER_BTN', 'name' => 'Edit User', 'type' => 'action', 'permissions' => ['users.update']],
                        ['code' => 'DELETE_USER_BTN', 'name' => 'Delete User', 'type' => 'action', 'permissions' => ['users.delete']],
                        ['code' => 'IMPERSONATE_USER_BTN', 'name' => 'Impersonate User', 'type' => 'action', 'permissions' => ['users.impersonate']],
                    ],
                ],
                [
                    'code' => 'ROLES',
                    'name' => 'Roles & Permissions',
                    'description' => 'Role and permission management',
                    'icon' => 'ShieldCheckIcon',
                    'route_prefix' => '/admin/roles',
                    'permissions' => ['roles.view', 'roles.create', 'roles.update', 'roles.delete', 'permissions.assign'],
                    'components' => [
                        ['code' => 'ROLES_LIST', 'name' => 'Roles List Page', 'type' => 'page', 'route_name' => 'roles.index', 'permissions' => ['roles.view']],
                        ['code' => 'CREATE_ROLE_BTN', 'name' => 'Create Role', 'type' => 'action', 'permissions' => ['roles.create']],
                        ['code' => 'EDIT_ROLE_BTN', 'name' => 'Edit Role', 'type' => 'action', 'permissions' => ['roles.update']],
                        ['code' => 'DELETE_ROLE_BTN', 'name' => 'Delete Role', 'type' => 'action', 'permissions' => ['roles.delete']],
                        ['code' => 'ASSIGN_PERMISSIONS_BTN', 'name' => 'Assign Permissions', 'type' => 'action', 'permissions' => ['permissions.assign']],
                    ],
                ],
                [
                    'code' => 'MODULES',
                    'name' => 'Module Management',
                    'description' => 'Module permission registry management',
                    'icon' => 'CubeIcon',
                    'route_prefix' => '/admin/modules',
                    'permissions' => ['modules.view', 'modules.create', 'modules.update', 'modules.delete'],
                    'components' => [
                        ['code' => 'MODULES_LIST', 'name' => 'Modules List Page', 'type' => 'page', 'route_name' => 'modules.index', 'permissions' => ['modules.view']],
                        ['code' => 'CREATE_MODULE_BTN', 'name' => 'Create Module', 'type' => 'action', 'permissions' => ['modules.create']],
                        ['code' => 'EDIT_MODULE_BTN', 'name' => 'Edit Module', 'type' => 'action', 'permissions' => ['modules.update']],
                        ['code' => 'DELETE_MODULE_BTN', 'name' => 'Delete Module', 'type' => 'action', 'permissions' => ['modules.delete']],
                    ],
                ],
                [
                    'code' => 'SETTINGS',
                    'name' => 'System Settings',
                    'description' => 'Application settings configuration',
                    'icon' => 'Cog6ToothIcon',
                    'route_prefix' => '/admin/settings',
                    'permissions' => ['settings.view', 'settings.update'],
                    'components' => [
                        ['code' => 'SETTINGS_PAGE', 'name' => 'Settings Page', 'type' => 'page', 'route_name' => 'settings.index', 'permissions' => ['settings.view']],
                        ['code' => 'COMPANY_SETTINGS', 'name' => 'Company Settings', 'type' => 'section', 'permissions' => ['company.settings']],
                        ['code' => 'ATTENDANCE_SETTINGS', 'name' => 'Attendance Settings', 'type' => 'section', 'permissions' => ['attendance.settings']],
                        ['code' => 'EMAIL_SETTINGS', 'name' => 'Email Settings', 'type' => 'section', 'permissions' => ['email.settings']],
                        ['code' => 'NOTIFICATION_SETTINGS', 'name' => 'Notification Settings', 'type' => 'section', 'permissions' => ['notification.settings']],
                        ['code' => 'THEME_SETTINGS', 'name' => 'Theme Settings', 'type' => 'section', 'permissions' => ['theme.settings']],
                        ['code' => 'LOCALIZATION_SETTINGS', 'name' => 'Localization Settings', 'type' => 'section', 'permissions' => ['localization.settings']],
                        ['code' => 'PERFORMANCE_SETTINGS', 'name' => 'Performance Settings', 'type' => 'section', 'permissions' => ['performance.settings']],
                        ['code' => 'APPROVAL_SETTINGS', 'name' => 'Approval Settings', 'type' => 'section', 'permissions' => ['approval.settings']],
                        ['code' => 'INVOICE_SETTINGS', 'name' => 'Invoice Settings', 'type' => 'section', 'permissions' => ['invoice.settings']],
                        ['code' => 'SALARY_SETTINGS', 'name' => 'Salary Settings', 'type' => 'section', 'permissions' => ['salary.settings']],
                        ['code' => 'SYSTEM_SETTINGS', 'name' => 'System Settings', 'type' => 'section', 'permissions' => ['system.settings']],
                    ],
                ],
                [
                    'code' => 'AUDIT',
                    'name' => 'Audit Logs',
                    'description' => 'System audit trail and logs',
                    'icon' => 'ClipboardDocumentListIcon',
                    'route_prefix' => '/admin/audit',
                    'permissions' => ['audit.view', 'audit.export'],
                    'components' => [
                        ['code' => 'AUDIT_LIST', 'name' => 'Audit Logs Page', 'type' => 'page', 'route_name' => 'audit.index', 'permissions' => ['audit.view']],
                        ['code' => 'EXPORT_AUDIT_BTN', 'name' => 'Export Audit Logs', 'type' => 'action', 'permissions' => ['audit.export']],
                    ],
                ],
                [
                    'code' => 'BACKUP',
                    'name' => 'Backup & Restore',
                    'description' => 'System backup management',
                    'icon' => 'CloudArrowUpIcon',
                    'route_prefix' => '/admin/backup',
                    'permissions' => ['backup.create', 'backup.restore'],
                    'components' => [
                        ['code' => 'BACKUP_PAGE', 'name' => 'Backup Page', 'type' => 'page', 'route_name' => 'backup.index', 'permissions' => ['backup.create']],
                        ['code' => 'CREATE_BACKUP_BTN', 'name' => 'Create Backup', 'type' => 'action', 'permissions' => ['backup.create']],
                        ['code' => 'RESTORE_BACKUP_BTN', 'name' => 'Restore Backup', 'type' => 'action', 'permissions' => ['backup.restore']],
                    ],
                ],
            ],
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Module Permission Registry Seeding...');

        // First, ensure module permissions exist
        $this->createModuleManagementPermissions();

        DB::beginTransaction();

        try {
            foreach ($this->moduleDefinitions as $moduleData) {
                $this->seedModule($moduleData);
            }

            DB::commit();
            $this->command->info('Module Permission Registry seeded successfully!');
            $this->printStatistics();
        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Failed to seed modules: '.$e->getMessage());
            Log::error('ModulePermissionSeeder failed', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            throw $e;
        }
    }

    /**
     * Create module management permissions if they don't exist.
     */
    private function createModuleManagementPermissions(): void
    {
        $modulePermissions = [
            'modules.view',
            'modules.create',
            'modules.update',
            'modules.delete',
        ];

        foreach ($modulePermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web'],
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        $this->command->info('Module management permissions ensured.');
    }

    /**
     * Seed a single module with all its sub-modules and components.
     */
    private function seedModule(array $moduleData): void
    {
        // Create or update module
        $module = Module::updateOrCreate(
            ['code' => $moduleData['code']],
            [
                'name' => $moduleData['name'],
                'description' => $moduleData['description'],
                'icon' => $moduleData['icon'],
                'category' => $moduleData['category'],
                'route_prefix' => $moduleData['route_prefix'],
                'is_active' => $moduleData['is_active'],
                'priority' => $moduleData['sort_order'],
            ]
        );

        $this->command->line("  Module: {$module->name}");

        // Assign module-level permissions
        if (! empty($moduleData['permissions'])) {
            $this->assignPermissions($module, $moduleData['permissions'], 'module');
        }

        // Seed sub-modules
        if (! empty($moduleData['sub_modules'])) {
            foreach ($moduleData['sub_modules'] as $subModuleData) {
                $this->seedSubModule($module, $subModuleData);
            }
        }
    }

    /**
     * Seed a sub-module with all its components.
     */
    private function seedSubModule(Module $module, array $subModuleData): void
    {
        // Create or update sub-module
        $subModule = SubModule::updateOrCreate(
            ['code' => $subModuleData['code'], 'module_id' => $module->id],
            [
                'name' => $subModuleData['name'],
                'description' => $subModuleData['description'],
                'icon' => $subModuleData['icon'] ?? null,
                'route' => $subModuleData['route_prefix'] ?? null,
                'is_active' => $subModuleData['is_active'] ?? true,
                'priority' => $subModuleData['sort_order'] ?? 0,
            ]
        );

        $this->command->line("    Sub-Module: {$subModule->name}");

        // Assign sub-module-level permissions
        if (! empty($subModuleData['permissions'])) {
            $this->assignPermissions($subModule, $subModuleData['permissions'], 'sub_module');
        }

        // Seed components
        if (! empty($subModuleData['components'])) {
            foreach ($subModuleData['components'] as $componentData) {
                $this->seedComponent($subModule, $componentData);
            }
        }
    }

    /**
     * Seed a component.
     */
    private function seedComponent(SubModule $subModule, array $componentData): void
    {
        // Create or update component
        $component = ModuleComponent::updateOrCreate(
            ['code' => $componentData['code'], 'sub_module_id' => $subModule->id],
            [
                'module_id' => $subModule->module_id,
                'name' => $componentData['name'],
                'description' => $componentData['description'] ?? null,
                'type' => $componentData['type'],
                'route' => $componentData['route_name'] ?? null,
                'is_active' => $componentData['is_active'] ?? true,
                'settings' => $componentData['metadata'] ?? null,
            ]
        );

        // Assign component-level permissions
        if (! empty($componentData['permissions'])) {
            $this->assignPermissions($component, $componentData['permissions'], 'component');
        }
    }

    /**
     * Assign permissions to a module, sub-module, or component.
     */
    private function assignPermissions($entity, array $permissions, string $type): void
    {
        // Clear existing permission requirements for this entity
        ModulePermission::where($type.'_id', $entity->id)->delete();

        foreach ($permissions as $permissionName) {
            $permission = Permission::where('name', $permissionName)->first();

            if ($permission) {
                ModulePermission::create([
                    'module_id' => $type === 'module' ? $entity->id : ($type === 'sub_module' ? $entity->module_id : $entity->module_id),
                    'sub_module_id' => $type === 'sub_module' ? $entity->id : ($type === 'component' ? $entity->sub_module_id : null),
                    'component_id' => $type === 'component' ? $entity->id : null,
                    'permission_id' => $permission->id,
                    'requirement_type' => ModulePermission::TYPE_REQUIRED,
                    'requirement_group' => null,
                ]);
            } else {
                $this->command->warn("      Permission not found: {$permissionName}");
            }
        }
    }

    /**
     * Print seeding statistics.
     */
    private function printStatistics(): void
    {
        $this->command->newLine();
        $this->command->info('=== Module Permission Registry Statistics ===');
        $this->command->line('  Modules: '.Module::count());
        $this->command->line('  Sub-Modules: '.SubModule::count());
        $this->command->line('  Components: '.ModuleComponent::count());
        $this->command->line('  Permission Requirements: '.ModulePermission::count());
        $this->command->line('  Active Modules: '.Module::where('is_active', true)->count());
        $this->command->newLine();
    }
}
