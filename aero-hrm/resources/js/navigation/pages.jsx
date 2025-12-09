/**
 * Aero HRM Navigation Configuration
 *
 * This file defines the navigation structure for the HRM module.
 * HRM provides: HR Dashboard, Employees, Attendance, Leaves, Payroll, etc.
 *
 * This navigation is auto-discovered by the Core NavigationRegistry.
 */

import {
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
                    route: 'hr.dashboard',
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
                            route: 'employees.index',
                            access: 'hrm.employees.employee-directory.view',
                        },
                        {
                            name: 'Departments',
                            icon: 'BuildingOffice2Icon',
                            route: 'departments.index',
                            access: 'hrm.employees.departments.view',
                        },
                        {
                            name: 'Designations',
                            icon: 'BriefcaseIcon',
                            route: 'designations.index',
                            access: 'hrm.employees.designations.view',
                        },
                        {
                            name: 'Onboarding',
                            icon: 'UserIcon',
                            route: 'hr.onboarding.index',
                            access: 'hrm.employees.onboarding-wizard.view',
                        },
                        {
                            name: 'Exit/Termination',
                            icon: 'ArrowRightOnRectangleIcon',
                            route: 'hr.offboarding.index',
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
                            route: 'attendance.index',
                            access: 'hrm.attendance.daily-attendance.view',
                        },
                        {
                            name: 'Monthly Calendar',
                            icon: 'CalendarIcon',
                            route: 'attendance.calendar',
                            access: 'hrm.attendance.monthly-calendar.view',
                        },
                        {
                            name: 'Attendance Logs',
                            icon: 'ClipboardDocumentCheckIcon',
                            route: 'attendance.logs',
                            access: 'hrm.attendance.attendance-logs.view',
                        },
                        {
                            name: 'Shift Scheduling',
                            icon: 'ClockIcon',
                            route: 'shifts.index',
                            access: 'hrm.attendance.shift-scheduling.view',
                        },
                        {
                            name: 'My Attendance',
                            icon: 'UserIcon',
                            route: 'attendance.my',
                            access: 'hrm.attendance.my-attendance.view',
                        },
                        {
                            name: 'Holidays',
                            icon: 'CalendarIcon',
                            route: 'holidays.index',
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
                            route: 'leaves.index',
                            access: 'hrm.leaves.leave-requests.view',
                        },
                        {
                            name: 'My Leaves',
                            icon: 'UserIcon',
                            route: 'leaves.my',
                            access: 'hrm.leaves.leave-requests.create',
                        },
                        {
                            name: 'Leave Types',
                            icon: 'DocumentTextIcon',
                            route: 'leave-types.index',
                            access: 'hrm.leaves.leave-types.view',
                        },
                        {
                            name: 'Leave Balances',
                            icon: 'ChartPieIcon',
                            route: 'leave-balances.index',
                            access: 'hrm.leaves.leave-balances.view',
                        },
                        {
                            name: 'Leave Policies',
                            icon: 'Cog6ToothIcon',
                            route: 'leave-settings.index',
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
                            route: 'hr.payroll.index',
                            access: 'hrm.payroll.payroll-run.view',
                        },
                        {
                            name: 'Payslips',
                            icon: 'DocumentDuplicateIcon',
                            route: 'hr.payroll.payslips',
                            access: 'hrm.payroll.payslips.view',
                        },
                        {
                            name: 'Salary Structures',
                            icon: 'CubeIcon',
                            route: 'hr.payroll.structures',
                            access: 'hrm.payroll.salary-structures.view',
                        },
                        {
                            name: 'Loans & Advances',
                            icon: 'BanknotesIcon',
                            route: 'hr.payroll.loans',
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
                            route: 'hr.recruitment.index',
                            access: 'hrm.recruitment.job-openings.view',
                        },
                        {
                            name: 'Applicants',
                            icon: 'UserGroupIcon',
                            route: 'hr.recruitment.applicants',
                            access: 'hrm.recruitment.applicants.view',
                        },
                        {
                            name: 'Interview Schedule',
                            icon: 'CalendarIcon',
                            route: 'hr.recruitment.interviews',
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
                            route: 'hr.performance.index',
                            access: 'hrm.performance.performance-reviews.view',
                        },
                        {
                            name: 'Goals',
                            icon: 'ChartBarSquareIcon',
                            route: 'hr.performance.goals',
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
                            route: 'hr.training.index',
                            access: 'hrm.training.training-sessions.view',
                        },
                        {
                            name: 'My Training',
                            icon: 'UserIcon',
                            route: 'hr.training.my',
                            access: 'hrm.training.training-sessions.view',
                        },
                    ],
                },

                // HR Analytics
                {
                    name: 'HR Analytics',
                    icon: 'ChartBarSquareIcon',
                    route: 'hr.analytics.index',
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
            route: 'attendance.my',
            access: 'hrm.attendance.my-attendance.view',
            priority: 10,
            selfService: true,
        },
        {
            name: 'My Leaves',
            icon: 'ArrowRightOnRectangleIcon',
            route: 'leaves.my',
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
