/**
 * Aero HRM Module Navigation Definition
 * 
 * This file defines the menu structure for the HRM module.
 * It will be dynamically registered with Core via window.Aero.registerNavigation()
 * 
 * Icon Strategy:
 * - Icons are passed as strings (e.g., 'UserGroupIcon') 
 * - Core's Sidebar will resolve these to actual HeroIcon components
 * - This keeps module bundles small and avoids cross-bundle component references
 */

export const hrmNavigation = [
    {
        name: 'HRM',
        icon: 'UserGroupIcon', // String identifier resolved by Core
        order: 100, // Appears after Dashboard (0) but before Settings (1000)
        access_key: 'hrm',
        children: [
            { 
                name: 'HR Dashboard', 
                href: '/hrm/dashboard',
                icon: 'ChartBarSquareIcon',
                active_rule: 'hr.dashboard',
                access_key: 'hrm.dashboard',
            },
            {
                name: 'Employees',
                icon: 'UserIcon',
                access_key: 'hrm.employees',
                children: [
                    { 
                        name: 'Employee Directory', 
                        href: '/employees',
                        active_rule: 'employees.index',
                        access_key: 'hrm.employees.employee-directory',
                    },
                    { 
                        name: 'Departments', 
                        href: '/departments',
                        active_rule: 'departments.index',
                        access_key: 'hrm.employees.departments',
                    },
                    { 
                        name: 'Designations', 
                        href: '/designations',
                        active_rule: 'designations.index',
                        access_key: 'hrm.employees.designations',
                    },
                ]
            },
            { 
                name: 'Attendance', 
                href: '/hrm/attendance',
                icon: 'CalendarDaysIcon',
                active_rule: 'hrm.attendance.*',
                access_key: 'hrm.attendance.tracking',
            },
            { 
                name: 'Leave Management', 
                href: '/hrm/leaves',
                icon: 'CalendarIcon',
                active_rule: 'hrm.leaves.*',
                access_key: 'hrm.leaves.requests',
            },
            { 
                name: 'Payroll', 
                href: '/hrm/payroll',
                icon: 'CurrencyDollarIcon',
                active_rule: 'hrm.payroll.*',
                access_key: 'hrm.payroll.processing',
            },
            {
                name: 'Performance',
                icon: 'StarIcon',
                access_key: 'hrm.performance',
                children: [
                    { 
                        name: 'Reviews', 
                        href: '/hrm/performance/reviews',
                        active_rule: 'hrm.performance.reviews.*',
                        access_key: 'hrm.performance.reviews',
                    },
                    { 
                        name: 'Goals', 
                        href: '/hrm/performance/goals',
                        active_rule: 'hrm.performance.goals.*',
                        access_key: 'hrm.performance.goals',
                    },
                ]
            },
            {
                name: 'Training',
                icon: 'AcademicCapIcon',
                access_key: 'hrm.training',
                children: [
                    { 
                        name: 'Programs', 
                        href: '/hrm/training/programs',
                        active_rule: 'hrm.training.programs.*',
                        access_key: 'hrm.training.programs',
                    },
                    { 
                        name: 'Enrollments', 
                        href: '/hrm/training/enrollments',
                        active_rule: 'hrm.training.enrollments.*',
                        access_key: 'hrm.training.enrollments',
                    },
                ]
            },
            { 
                name: 'Reports', 
                href: '/hrm/reports',
                icon: 'DocumentTextIcon',
                active_rule: 'hrm.reports.*',
                access_key: 'hrm.reports',
            },
        ]
    }
];
