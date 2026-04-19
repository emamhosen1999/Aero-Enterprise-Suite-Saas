<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Education Module — Learning Management System
    |--------------------------------------------------------------------------
    |
    | Manages students, faculty, courses, enrollment, grades,
    | transcripts, and attendance tracking.
    |
    */

    'code' => 'education',
    'scope' => 'tenant',
    'name' => 'Education Management',
    'description' => 'Comprehensive learning management with student enrollment, course delivery, grading, transcripts, and attendance.',
    'version' => '1.0.0',
    'category' => 'industry',
    'icon' => 'AcademicCapIcon',
    'priority' => 30,
    'enabled' => env('EDUCATION_MODULE_ENABLED', true),
    'minimum_plan' => null,
    'dependencies' => ['core'],
    'route_prefix' => 'education',

    'submodules' => [

        // ==================== EDUCATION DASHBOARD ====================
        [
            'code' => 'education-dashboard',
            'name' => 'Education Dashboard',
            'description' => 'Overview of students, courses, enrollment metrics, and academic performance.',
            'icon' => 'ChartPieIcon',
            'route' => 'tenant.education.dashboard',
            'priority' => 1,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== STUDENTS ====================
        [
            'code' => 'students',
            'name' => 'Students',
            'description' => 'Student records, transcripts, grades, and financial aid management.',
            'icon' => 'UserGroupIcon',
            'route' => 'tenant.education.students.index',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'student-list',
                    'name' => 'Student List',
                    'description' => 'View and manage all student records.',
                    'route_name' => 'tenant.education.students.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-transcript',
                    'name' => 'Student Transcript',
                    'description' => 'View student academic transcripts.',
                    'route_name' => 'tenant.education.students.transcript',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-grades',
                    'name' => 'Student Grades',
                    'description' => 'View grades for a specific student.',
                    'route_name' => 'tenant.education.students.grades',
                    'priority' => 3,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-attendance',
                    'name' => 'Student Attendance',
                    'description' => 'View attendance records for a specific student.',
                    'route_name' => 'tenant.education.students.attendance',
                    'priority' => 4,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-financial-aid',
                    'name' => 'Financial Aid',
                    'description' => 'View student financial aid information.',
                    'route_name' => 'tenant.education.students.financial-aid',
                    'priority' => 5,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== FACULTY ====================
        [
            'code' => 'faculty',
            'name' => 'Faculty',
            'description' => 'Faculty member management and assignment.',
            'icon' => 'BriefcaseIcon',
            'route' => 'tenant.education.faculty.index',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'faculty-list',
                    'name' => 'Faculty List',
                    'description' => 'View and manage all faculty members.',
                    'route_name' => 'tenant.education.faculty.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== COURSES ====================
        [
            'code' => 'courses',
            'name' => 'Courses',
            'description' => 'Course catalog management with sections and scheduling.',
            'icon' => 'BookOpenIcon',
            'route' => 'tenant.education.courses.index',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'course-list',
                    'name' => 'Course List',
                    'description' => 'View and manage all courses.',
                    'route_name' => 'tenant.education.courses.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'course-sections',
                    'name' => 'Course Sections',
                    'description' => 'Manage sections within a course.',
                    'route_name' => 'tenant.education.courses.sections',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== ENROLLMENT ====================
        [
            'code' => 'enrollment',
            'name' => 'Enrollment',
            'description' => 'Student enrollment, drop, withdrawal, and waitlist management.',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => 'tenant.education.enrollment.index',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'enrollment-list',
                    'name' => 'Enrollment List',
                    'description' => 'View and manage student enrollments.',
                    'route_name' => 'tenant.education.enrollment.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'enroll', 'name' => 'Enroll Student', 'is_active' => true],
                        ['code' => 'drop', 'name' => 'Drop Enrollment', 'is_active' => true],
                        ['code' => 'withdraw', 'name' => 'Withdraw Student', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'enrollment-waitlist',
                    'name' => 'Waitlist',
                    'description' => 'View and manage course waitlists.',
                    'route_name' => 'tenant.education.enrollment.waitlist',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== GRADES ====================
        [
            'code' => 'grades',
            'name' => 'Grades',
            'description' => 'Grade management by section and student.',
            'icon' => 'DocumentCheckIcon',
            'route' => 'tenant.education.grades.section',
            'priority' => 6,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'section-grades',
                    'name' => 'Section Grades',
                    'description' => 'View and update grades for a course section.',
                    'route_name' => 'tenant.education.grades.section',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-grade-report',
                    'name' => 'Student Grade Report',
                    'description' => 'View all grades for a specific student.',
                    'route_name' => 'tenant.education.grades.student',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== TRANSCRIPTS ====================
        [
            'code' => 'transcripts',
            'name' => 'Transcripts',
            'description' => 'Official transcript requests, generation, and management.',
            'icon' => 'DocumentTextIcon',
            'route' => 'tenant.education.transcripts.index',
            'priority' => 7,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'transcript-list',
                    'name' => 'Transcript List',
                    'description' => 'View and manage transcript requests.',
                    'route_name' => 'tenant.education.transcripts.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'request', 'name' => 'Request Transcript', 'is_active' => true],
                        ['code' => 'generate', 'name' => 'Generate Transcript', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== ATTENDANCE ====================
        [
            'code' => 'attendance',
            'name' => 'Attendance',
            'description' => 'Attendance tracking by section and student.',
            'icon' => 'CalendarDaysIcon',
            'route' => 'tenant.education.attendance.section',
            'priority' => 8,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'section-attendance',
                    'name' => 'Section Attendance',
                    'description' => 'View and take attendance for a course section.',
                    'route_name' => 'tenant.education.attendance.section',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Take Attendance', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'student-attendance-report',
                    'name' => 'Student Attendance Report',
                    'description' => 'View attendance records for a specific student.',
                    'route_name' => 'tenant.education.attendance.student',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== REPORTS ====================
        [
            'code' => 'education-reports',
            'name' => 'Reports',
            'description' => 'Academic reports and analytics.',
            'icon' => 'ChartBarIcon',
            'route' => 'tenant.education.reports',
            'priority' => 9,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'report-list',
                    'name' => 'Report List',
                    'description' => 'View available education reports.',
                    'route_name' => 'tenant.education.reports',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
            ],
        ],
    ],
];
