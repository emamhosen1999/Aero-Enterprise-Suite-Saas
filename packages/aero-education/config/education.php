<?php

return [
    'name' => 'Educational Management System',
    'version' => '1.0.0',

    // Academic Settings
    'academic' => [
        'default_credit_hours' => 3,
        'max_credit_hours_per_semester' => 18,
        'min_credit_hours_full_time' => 12,
        'gpa_scale' => 4.0,
        'passing_grade' => 'D-',
        'semester_length_weeks' => 16,
    ],

    // Grading System
    'grading' => [
        'scale' => [
            'A+' => ['min' => 97, 'points' => 4.0],
            'A' => ['min' => 93, 'points' => 4.0],
            'A-' => ['min' => 90, 'points' => 3.7],
            'B+' => ['min' => 87, 'points' => 3.3],
            'B' => ['min' => 83, 'points' => 3.0],
            'B-' => ['min' => 80, 'points' => 2.7],
            'C+' => ['min' => 77, 'points' => 2.3],
            'C' => ['min' => 73, 'points' => 2.0],
            'C-' => ['min' => 70, 'points' => 1.7],
            'D+' => ['min' => 67, 'points' => 1.3],
            'D' => ['min' => 63, 'points' => 1.0],
            'D-' => ['min' => 60, 'points' => 0.7],
            'F' => ['min' => 0,  'points' => 0.0],
        ],
        'late_penalty_per_day' => 5.0, // Percentage
        'max_late_days' => 7,
    ],

    // Enrollment Settings
    'enrollment' => [
        'registration_periods' => [
            'early' => 45, // Days before semester
            'regular' => 30,
            'late' => 7,
        ],
        'waitlist_limit' => 10,
        'add_drop_deadline_weeks' => 2,
        'withdrawal_deadline_weeks' => 10,
    ],

    // Financial Aid
    'financial_aid' => [
        'disbursement_schedule' => [
            'fall' => ['08-15', '10-15'],
            'spring' => ['01-15', '03-15'],
            'summer' => ['05-15'],
        ],
        'satisfactory_progress' => [
            'min_gpa' => 2.0,
            'completion_rate' => 67, // Percentage
        ],
    ],

    // Attendance
    'attendance' => [
        'tardy_minutes' => 5,
        'late_minutes' => 15,
        'auto_excuse_reasons' => [
            'illness',
            'family_emergency',
            'medical_appointment',
            'religious_observance',
        ],
    ],

    // Transcript Settings
    'transcripts' => [
        'official_fee' => 15.00,
        'processing_days' => 5,
        'electronic_delivery' => true,
        'digital_signature' => true,
    ],

    // System Settings
    'system' => [
        'academic_year_start_month' => 8, // August
        'semester_types' => ['fall', 'spring', 'summer'],
        'notification_days_before_deadline' => [30, 14, 7, 1],
    ],
];
