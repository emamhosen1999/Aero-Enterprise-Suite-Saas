/**
 * Aero HRM Navigation Configuration
 *
 * This file defines the navigation structure for the HRM module.
 * HRM provides: HR Dashboard, Employees, Attendance, Leaves, Payroll, etc.
 *
 * This navigation is auto-discovered by the Core NavigationRegistry.
 */

import {
    AcademicCapIcon,
    ArrowRightOnRectangleIcon,
    BanknotesIcon,
    BriefcaseIcon,
    BuildingOffice2Icon,
    CalendarDaysIcon,
    CalendarIcon,
    ChartBarSquareIcon,
    ChartPieIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    Cog6ToothIcon,
    CubeIcon,
    CurrencyDollarIcon,
    DocumentDuplicateIcon,
    DocumentTextIcon,
    StarIcon,
    UserGroupIcon,
    UserIcon,
} from '@heroicons/react/24/outline';

/**
 * HRM module navigation items
 */
export const hrmNavigation = {
    moduleCode: 'hrm',
    moduleName: 'Human Resources',
    priority: 10,
    items: [
        // Main HRM Menu
        {
            name: 'HRM',
            icon: 'UserGroupIcon',
            access: 'hrm',
            priority: 10,
            subMenu: [
                // HR Dashboard
                {
                    name: 'HR Dashboard',
                    icon: 'ChartBarSquareIcon',
                    route: 'hrm.dashboard',
                    access: 'hrm.dashboard',
                },

                // Employees Section
                {
                    name: 'Employees',
                    icon: 'UserGroupIcon',
                    access: 'hrm.employees',
                    subMenu: [
                        {
                            name: 'Employee Directory',
                            icon: 'UserGroupIcon',
                            route: 'hrm.employees',
                            access: 'hrm.employees.employee-directory.view',
                        },
                        {
                            name: 'Departments',
                            icon: 'BuildingOffice2Icon',
                            route: 'hrm.departments',
                            access: 'hrm.employees.departments.view',
                        },
                        {
                            name: 'Designations',
                            icon: 'BriefcaseIcon',
                            route: 'hrm.designations.index',
                            access: 'hrm.employees.designations.view',
                        },
                        {
                            name: 'Onboarding',
                            icon: 'UserIcon',
                            route: 'hrm.onboarding.index',
                            access: 'hrm.employees.onboarding-wizard.view',
                        },
                        {
                            name: 'Exit/Termination',
                            icon: 'ArrowRightOnRectangleIcon',
                            route: 'hrm.offboarding.index',
                            access: 'hrm.employees.exit-termination.view',
                        },
                    ],
                },

                // Attendance Section
                {
                    name: 'Attendance',
                    icon: 'CalendarDaysIcon',
                    access: 'hrm.attendance',
                    subMenu: [
                        {
                            name: 'Daily Attendance',
                            icon: 'CalendarDaysIcon',
                            route: 'hrm.attendances',
                            access: 'hrm.attendance.daily-attendance.view',
                        },
                        {
                            name: 'Monthly Calendar',
                            icon: 'CalendarIcon',
                            route: 'hrm.attendances',
                            access: 'hrm.attendance.monthly-calendar.view',
                        },
                        {
                            name: 'Attendance Logs',
                            icon: 'ClipboardDocumentCheckIcon',
                            route: 'hrm.attendances',
                            access: 'hrm.attendance.attendance-logs.view',
                        },
                        {
                            name: 'Shift Scheduling',
                            icon: 'ClockIcon',
                            route: 'hrm.attendances',
                            access: 'hrm.attendance.shift-scheduling.view',
                        },
                        {
                            name: 'My Attendance',
                            icon: 'UserIcon',
                            route: 'hrm.attendance-employee',
                            access: 'hrm.attendance.my-attendance.view',
                        },
                        {
                            name: 'Holidays',
                            icon: 'CalendarIcon',
                            route: 'hrm.holidays',
                            access: 'hrm.leaves.holiday-calendar.view',
                        },
                    ],
                },

                // Leave Management Section
                {
                    name: 'Leaves',
                    icon: 'ArrowRightOnRectangleIcon',
                    access: 'hrm.leaves',
                    subMenu: [
                        {
                            name: 'Leave Requests',
                            icon: 'ArrowRightOnRectangleIcon',
                            route: 'hrm.leaves',
                            access: 'hrm.leaves.leave-requests.view',
                        },
                        {
                            name: 'My Leaves',
                            icon: 'UserIcon',
                            route: 'hrm.leaves-employee',
                            access: 'hrm.leaves.leave-requests.create',
                        },
                        {
                            name: 'Leave Types',
                            icon: 'DocumentTextIcon',
                            route: 'hrm.leaves',
                            access: 'hrm.leaves.leave-types.view',
                        },
                        {
                            name: 'Leave Balances',
                            icon: 'ChartPieIcon',
                            route: 'hrm.leaves',
                            access: 'hrm.leaves.leave-balances.view',
                        },
                        {
                            name: 'Leave Policies',
                            icon: 'Cog6ToothIcon',
                            route: 'hrm.leaves',
                            access: 'hrm.leaves.leave-policies.manage',
                        },
                    ],
                },

                // Payroll Section
                {
                    name: 'Payroll',
                    icon: 'CurrencyDollarIcon',
                    access: 'hrm.payroll',
                    subMenu: [
                        {
                            name: 'Payroll Run',
                            icon: 'CurrencyDollarIcon',
                            route: 'hrm.payroll.index',
                            access: 'hrm.payroll.payroll-run.view',
                        },
                        {
                            name: 'Payslips',
                            icon: 'DocumentDuplicateIcon',
                            route: 'hrm.payroll.index',
                            access: 'hrm.payroll.payslips.view',
                        },
                        {
                            name: 'Salary Structures',
                            icon: 'BuildingOfficeIcon',
                            route: 'hrm.salary-structure.index',
                            access: 'hrm.payroll.salary-structures.manage',
                        },
                        {
                            name: 'Loans & Advances',
                            icon: 'BanknotesIcon',
                            route: 'hrm.payroll.index',
                            access: 'hrm.payroll.loans.view',
                        },
                    ],
                },

                // Recruitment Section
                {
                    name: 'Recruitment',
                    icon: 'BriefcaseIcon',
                    access: 'hrm.recruitment',
                    subMenu: [
                        {
                            name: 'Job Openings',
                            icon: 'BriefcaseIcon',
                            route: 'hrm.recruitment.index',
                            access: 'hrm.recruitment.job-openings.view',
                        },
                        {
                            name: 'Applicants',
                            icon: 'UserGroupIcon',
                            route: 'hrm.recruitment.index',
                            access: 'hrm.recruitment.applicants.view',
                        },
                        {
                            name: 'Interview Schedule',
                            icon: 'CalendarIcon',
                            route: 'hrm.recruitment.index',
                            access: 'hrm.recruitment.interview-scheduling.view',
                        },
                    ],
                },

                // Performance Section
                {
                    name: 'Performance',
                    icon: 'StarIcon',
                    access: 'hrm.performance',
                    subMenu: [
                        {
                            name: 'Performance Reviews',
                            icon: 'StarIcon',
                            route: 'hrm.performance.index',
                            access: 'hrm.performance.performance-reviews.view',
                        },
                        {
                            name: 'Goals',
                            icon: 'ChartBarSquareIcon',
                            route: 'hrm.performance.index',
                            access: 'hrm.performance.goal-setting.view',
                        },
                    ],
                },

                // Training Section
                {
                    name: 'Training',
                    icon: 'AcademicCapIcon',
                    access: 'hrm.training',
                    subMenu: [
                        {
                            name: 'Training Sessions',
                            icon: 'AcademicCapIcon',
                            route: 'hrm.training.index',
                            access: 'hrm.training.training-sessions.view',
                        },
                        {
                            name: 'My Training',
                            icon: 'UserIcon',
                            route: 'hrm.training.index',
                            access: 'hrm.training.training-sessions.view',
                        },
                    ],
                },

                // HR Analytics
                {
                    name: 'HR Analytics',
                    icon: 'ChartBarSquareIcon',
                    route: 'hrm.analytics.index',
                    access: 'hrm.analytics',
                },
            ],
        },
    ],
};

/**
 * Employee self-service navigation
 * These items appear directly in the menu for employees
 */
export const employeeSelfServiceNavigation = {
    moduleCode: 'hrm-self-service',
    moduleName: 'Self Service',
    priority: 5,
    items: [
        {
            name: 'My Attendance',
            icon: 'CalendarDaysIcon',
            route: 'hrm.attendance-employee',
            access: 'hrm.attendance.my-attendance.view',
            priority: 10,
            selfService: true,
        },
        {
            name: 'My Leaves',
            icon: 'ArrowRightOnRectangleIcon',
            route: 'hrm.leaves-employee',
            access: 'hrm.leaves.leave-requests.create',
            priority: 11,
            selfService: true,
        },
    ],
};

/**
 * Icon mapping for rendering
 */
export const iconMap = {
    UserGroupIcon,
    UserIcon,
    CalendarDaysIcon,
    CalendarIcon,
    ClockIcon,
    ArrowRightOnRectangleIcon,
    CurrencyDollarIcon,
    BriefcaseIcon,
    AcademicCapIcon,
    ChartBarSquareIcon,
    BuildingOffice2Icon,
    DocumentTextIcon,
    ChartPieIcon,
    Cog6ToothIcon,
    BanknotesIcon,
    CubeIcon,
    ClipboardDocumentCheckIcon,
    DocumentDuplicateIcon,
    StarIcon,
};

/**
 * Get HRM navigation items
 *
 * @returns {Object} Navigation configuration
 */
export function getHRMNavigation() {
    return hrmNavigation;
}

/**
 * Get Employee self-service navigation items
 *
 * @returns {Object} Navigation configuration
 */
export function getEmployeeSelfServiceNavigation() {
    return employeeSelfServiceNavigation;
}

export default hrmNavigation;


