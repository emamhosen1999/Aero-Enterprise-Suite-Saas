<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RFI & Site Intelligence Module
    |--------------------------------------------------------------------------
    |
    | The operational backbone of the project. Manages Daily Site Records,
    | Geo-Fenced Inspections (RFI), and Linear Progress Mapping.
    |
    */

    'code' => 'rfi',
    'scope' => 'tenant',
    'name' => 'RFI & Site Intelligence',
    'description' => 'Advanced site operations with geo-fenced RFI validation, linear chainage mapping, and automated daily reporting.',
    'version' => '2.1.0',
    'category' => 'engineering_ops',
    'icon' => 'MapIcon', // Changed to Map to emphasize Location/Site nature
    'priority' => 15,
    'enabled' => env('RFI_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core', 'project', 'hr', 'assets'],

    'submodules' => [

        // ==================== 1. INTELLIGENT DAILY REPORTING ====================
        [
            'code' => 'daily-reporting',
            'name' => 'Smart Daily Logs',
            'description' => 'Site diaries with automated weather capture and resource verification.',
            'icon' => 'BookOpenIcon',
            'route' => '/rfi/daily',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'daily-log',
                    'name' => 'Site Diary',
                    'description' => 'Daily record of activities, manpower, and idle hours',
                    'route' => '/rfi/daily/diary',
                    'icon' => 'DocumentTextIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'auto_weather', 'name' => 'Fetch Weather', 'description' => 'Auto-log temp/humidity/wind for claim defense'],
                        ['code' => 'import_resources', 'name' => 'Sync Resources', 'description' => 'Import active labor count from access gates'],
                    ],
                ],
                [
                    'code' => 'delay-log',
                    'name' => 'Hindrance Register',
                    'description' => 'Track stoppages caused by external factors (Force Majeure)',
                    'route' => '/rfi/daily/delays',
                    'icon' => 'ClockIcon',
                    'type' => 'page',
                ],
            ],
        ],

        // ==================== 2. GEO-FENCED INSPECTIONS (RFI) ====================
        [
            'code' => 'inspection-management',
            'name' => 'RFI Management',
            'description' => 'Request for Inspection system with geospatial locking.',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => '/rfi/inspections',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'rfi-tracker',
                    'name' => 'RFI Tracker',
                    'description' => 'Central dashboard for all inspection requests',
                    'route' => '/rfi/inspections',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'create_geolocked', 'name' => 'Create (Geo-Lock)', 'description' => 'Allow creation only if GPS matches Chainage'],
                        ['code' => 'schedule', 'name' => 'Schedule Inspection', 'description' => 'Assign surveyor time slot'],
                        ['code' => 'result_entry', 'name' => 'Enter Result', 'description' => 'Pass/Fail/Pass with Comments'],
                    ],
                ],
                [
                    'code' => 'dynamic-sampling',
                    'name' => 'AI Risk Sampling', // NOVELTY
                    'description' => 'Algorithm suggesting high-risk locations for random checks',
                    'route' => null, // Backend service
                    'icon' => 'CpuChipIcon',
                    'type' => 'widget',
                ],
            ],
        ],

        // ==================== 3. LINEAR PROGRESS (CORE IP) ====================
        [
            'code' => 'linear-progress',
            'name' => 'Linear Topology',
            'description' => 'Visual mapping of progress along the project alignment (Chainage).',
            'icon' => 'QueueListIcon',
            'route' => '/rfi/linear',
            'priority' => 30,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'digital-twin-map',
                    'name' => 'Digital Twin Map',
                    'description' => 'Interactive map showing completed layers (Earthwork -> Subbase -> Asphalt)',
                    'route' => '/rfi/linear/map',
                    'icon' => 'MapIcon',
                    'type' => 'canvas',
                    'actions' => [
                        ['code' => 'visualize_layer', 'name' => 'Toggle Layers', 'description' => 'Filter view by construction layer'],
                        ['code' => 'export_strip', 'name' => 'Export Strip Map', 'description' => 'Generate PDF Strip Chart'],
                    ],
                ],
                [
                    'code' => 'gap-analysis',
                    'name' => 'Continuity Validator',
                    'description' => 'Detects missing RFIs in the sequence (e.g., gap in foundation)',
                    'route' => '/rfi/linear/gaps',
                    'icon' => 'VariableIcon',
                    'type' => 'feature',
                ],
            ],
        ],

        // ==================== 4. ISSUE RESOLUTION ====================
        [
            'code' => 'objections',
            'name' => 'Objections & Disputes',
            'description' => 'Formal handling of rejected works and consultant objections.',
            'icon' => 'ExclamationCircleIcon',
            'route' => '/rfi/objections',
            'priority' => 40,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'objection-handler',
                    'name' => 'Objection Log',
                    'description' => 'Track reasons for rejection and required remedial actions',
                    'route' => '/rfi/objections',
                    'icon' => 'XMarkIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'convert_to_ncr', 'name' => 'Escalate to NCR', 'description' => 'Move serious issues to Quality Module'],
                        ['code' => 'resubmit', 'name' => 'Resubmit RFI', 'description' => 'Link new RFI to rejected parent'],
                    ],
                ],
            ],
        ],
    ],
];