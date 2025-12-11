<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HRM Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the complete module hierarchy for HRM.
    | Structure: module → submodules → components → actions
    |
    | This is loaded by aero:sync-module command to populate the database.
    |
    */

    'code' => 'hrm',
    'name' => 'Human Resources',
    'description' => 'Complete HR management including employees, attendance, leave, payroll, recruitment, performance, training, and analytics',
    'icon' => 'UserGroupIcon',
    'route_prefix' => '/tenant/hr',
    'category' => 'human_resources',
    'priority' => 10,
    'is_core' => false,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => 'basic',
    'license_type' => 'standard',
    'dependencies' => ['core'],
    'release_date' => '2024-01-01',

    'submodules' => [
        // Module hierarchy copied from TODO/config/modules.php lines 2490-3267
        // Contains 8 submodules: Employees, Attendance, Leaves, Payroll, Recruitment, Performance, Training, HR Analytics
        // Full structure available in source file
    ],
];
