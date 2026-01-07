<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RFI Module Configuration
    |--------------------------------------------------------------------------
    */

    // Enable/disable the module
    'enabled' => env('AERO_RFI_ENABLED', true),

    // Default status for new RFIs
    'default_status' => 'new',

    // Default inspection result
    'default_inspection_result' => 'pending',

    // Work types available
    'work_types' => [
        'Embankment',
        'Structure',
        'Pavement',
    ],

    // Road sides available
    'road_sides' => [
        'TR-R',
        'TR-L',
        'SR-R',
        'SR-L',
        'Both',
    ],

    // Objection categories
    'objection_categories' => [
        'design_conflict' => 'Design Conflict',
        'site_mismatch' => 'Site Condition Mismatch',
        'material_change' => 'Material Change',
        'safety_concern' => 'Safety Concern',
        'specification_error' => 'Specification Error',
        'other' => 'Other',
    ],

    // File upload settings
    'files' => [
        'max_size' => 10240, // KB
        'allowed_mimes' => [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        'disk' => 'public',
    ],

    // Pagination defaults
    'pagination' => [
        'per_page' => 15,
        'max_per_page' => 100,
    ],
];
