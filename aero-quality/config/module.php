<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quality Management Module Configuration
    |--------------------------------------------------------------------------
    */

    'module' => [
        'code' => 'quality',
        'name' => 'Quality Management',
        'description' => 'Quality assurance, inspections, and non-conformance tracking',
        'version' => '1.0.0',
    ],

    /*
    |--------------------------------------------------------------------------
    | Inspection Settings
    |--------------------------------------------------------------------------
    */

    'inspections' => [
        'enabled' => env('QUALITY_INSPECTIONS_ENABLED', true),
        'auto_numbering' => env('QUALITY_INSPECTION_AUTO_NUMBERING', true),
        'number_prefix' => env('QUALITY_INSPECTION_PREFIX', 'INS'),
        'require_approval' => env('QUALITY_INSPECTION_REQUIRE_APPROVAL', true),
        'types' => [
            'receiving' => 'Receiving Inspection',
            'in_process' => 'In-Process Inspection',
            'final' => 'Final Inspection',
            'audit' => 'Quality Audit',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Non-Conformance Report (NCR) Settings
    |--------------------------------------------------------------------------
    */

    'ncr' => [
        'enabled' => env('QUALITY_NCR_ENABLED', true),
        'auto_numbering' => env('QUALITY_NCR_AUTO_NUMBERING', true),
        'number_prefix' => env('QUALITY_NCR_PREFIX', 'NCR'),
        'severity_levels' => [
            'critical' => 'Critical',
            'major' => 'Major',
            'minor' => 'Minor',
        ],
        'require_root_cause' => env('QUALITY_NCR_REQUIRE_ROOT_CAUSE', true),
        'require_corrective_action' => env('QUALITY_NCR_REQUIRE_CORRECTIVE_ACTION', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Quality Standards Settings
    |--------------------------------------------------------------------------
    */

    'standards' => [
        'enabled' => env('QUALITY_STANDARDS_ENABLED', true),
        'allow_custom_standards' => env('QUALITY_ALLOW_CUSTOM_STANDARDS', true),
        'default_tolerance_unit' => env('QUALITY_DEFAULT_TOLERANCE_UNIT', '%'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Reporting Settings
    |--------------------------------------------------------------------------
    */

    'reporting' => [
        'export_formats' => ['pdf', 'excel', 'csv'],
        'default_format' => env('QUALITY_REPORT_DEFAULT_FORMAT', 'pdf'),
    ],
];
