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
    | ⭐⭐⭐ PATENTABLE FEATURES (3 algorithms):
    | 1. Linear Continuity Validator (⭐⭐⭐⭐⭐ HIGHEST PRIORITY)
    |    - Enforces construction layer prerequisites across chainage ranges
    |    - 95% threshold enforcement prevents structural failures
    |    - Component: linear-continuity-validator (integrated in RFI form)
    |
    | 2. GPS Geo-Fencing Validation (⭐⭐⭐)
    |    - Validates inspector physical presence using Haversine algorithm
    |    - 50m geofence tolerance with real-time distance calculation
    |    - Component: gps-geofencing (integrated in RFI form)
    |
    | 3. Chainage Progress Map / Digital Twin (⭐⭐⭐⭐)
    |    - Spatially-indexed construction ledger visualization
    |    - HTML5 Canvas rendering with multi-layer progress tracking
    |    - Component: digital-twin-map (Rfis page view toggle)
    |
    | All 3 features are production-ready, tested (60% coverage), and
    | demonstrable in the application workflow.
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

    /*
    |--------------------------------------------------------------------------
    | Self-Service Navigation Items
    |--------------------------------------------------------------------------
    */
    'self_service' => [
        [
            'code' => 'my-rfis',
            'name' => 'My RFIs',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => '/rfi/my-rfis',
            'priority' => 30,
        ],
        [
            'code' => 'my-inspections',
            'name' => 'My Inspections',
            'icon' => 'MagnifyingGlassIcon',
            'route' => '/rfi/my-inspections',
            'priority' => 31,
        ],
    ],

    'submodules' => [

        // ==================== 1. INTELLIGENT DAILY REPORTING ====================
        [
            'code' => 'daily-reporting',
            'name' => 'Smart Daily Logs',
            'description' => 'Site diaries with automated weather capture and resource verification.',
            'icon' => 'BookOpenIcon',
            'route' => '/rfi/site-diary',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'site-diary',
                    'name' => 'Site Diary',
                    'description' => 'Daily record of activities, manpower, equipment, materials with weather API integration',
                    'route' => '/rfi/site-diary',
                    'icon' => 'DocumentTextIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'auto_weather', 'name' => 'Fetch Weather', 'description' => 'Auto-log temp/humidity/wind with work suitability calculation'],
                        ['code' => 'import_resources', 'name' => 'Sync Resources', 'description' => 'Import active labor count from access gates'],
                        ['code' => 'upload_photos', 'name' => 'Upload Photos', 'description' => 'Multi-file progress photo upload'],
                        ['code' => 'export_pdf', 'name' => 'Export PDF', 'description' => 'Generate daily summary report'],
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

        // ==================== 2. GEO-FENCED INSPECTIONS (RFI) ==================== ⭐ PATENTABLE
        [
            'code' => 'inspection-management',
            'name' => 'RFI Management',
            'description' => 'Request for Inspection system with GPS geo-fencing validation (PATENTABLE).',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => '/rfi/rfis',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'rfi-tracker',
                    'name' => 'RFI Tracker',
                    'description' => 'Central dashboard for all inspection requests',
                    'route' => '/rfi/rfis',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'create_geolocked', 'name' => 'Create (Geo-Lock)', 'description' => 'GPS validation with 50m geofence tolerance (PATENTABLE)', 'is_patentable' => true],
                        ['code' => 'validate_gps', 'name' => 'Validate GPS', 'description' => 'Haversine distance calculation against expected location (PATENTABLE)', 'is_patentable' => true],
                        ['code' => 'schedule', 'name' => 'Schedule Inspection', 'description' => 'Assign surveyor time slot'],
                        ['code' => 'result_entry', 'name' => 'Enter Result', 'description' => 'Pass/Fail/Pass with Comments'],
                    ],
                ],
                [
                    'code' => 'gps-geofencing',
                    'name' => 'GPS Geo-Fencing', // ⭐ PATENTABLE FEATURE #1
                    'description' => 'Validates inspector physical presence using Haversine algorithm with 50m tolerance',
                    'route' => null, // Integrated in RFI form
                    'icon' => 'MapPinIcon',
                    'type' => 'feature',
                    'is_patentable' => true,
                    'patent_priority' => 2,
                    'actions' => [
                        ['code' => 'capture_gps', 'name' => 'Capture GPS', 'description' => 'Device geolocation capture'],
                        ['code' => 'validate_location', 'name' => 'Validate Location', 'description' => 'Real-time validation against expected coordinates'],
                        ['code' => 'show_map', 'name' => 'Show Map Preview', 'description' => 'Interactive Google Maps with geofence circle'],
                    ],
                ],
                [
                    'code' => 'dynamic-sampling',
                    'name' => 'AI Risk Sampling',
                    'description' => 'Algorithm suggesting high-risk locations for random checks',
                    'route' => null, // Backend service
                    'icon' => 'CpuChipIcon',
                    'type' => 'widget',
                ],
            ],
        ],

        // ==================== 3. LINEAR PROGRESS (CORE IP) ==================== ⭐⭐ PATENTABLE
        [
            'code' => 'linear-progress',
            'name' => 'Linear Topology & Digital Twin',
            'description' => 'Visual mapping of progress along the project alignment with patentable algorithms.',
            'icon' => 'QueueListIcon',
            'route' => '/project/rfis', // Integrated into Rfis page with view toggle
            'priority' => 30,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'digital-twin-map',
                    'name' => 'Digital Twin Map', // ⭐ PATENTABLE FEATURE #3
                    'description' => 'HTML5 Canvas visualization of spatially-indexed construction ledger (PATENTABLE)',
                    'route' => '/project/rfis', // Toggle view on Rfis page
                    'icon' => 'MapIcon',
                    'type' => 'canvas',
                    'is_patentable' => true,
                    'patent_priority' => 3,
                    'actions' => [
                        ['code' => 'visualize_layer', 'name' => 'Toggle Layers', 'description' => 'Filter view by construction layer'],
                        ['code' => 'zoom_control', 'name' => 'Zoom Controls', 'description' => '0.5x to 3x magnification with pan'],
                        ['code' => 'export_strip', 'name' => 'Export Strip Map', 'description' => 'Generate PDF Strip Chart (PATENTABLE)', 'is_patentable' => true],
                        ['code' => 'click_segment', 'name' => 'Click Segment', 'description' => 'View RFI details for chainage segment'],
                    ],
                ],
                [
                    'code' => 'linear-continuity-validator',
                    'name' => 'Linear Continuity Validator', // ⭐ PATENTABLE FEATURE #2 (HIGHEST PRIORITY)
                    'description' => 'Enforces construction layer prerequisites across chainage ranges with 95% threshold (PATENTABLE)',
                    'route' => null, // Integrated in RFI form
                    'icon' => 'VariableIcon',
                    'type' => 'feature',
                    'is_patentable' => true,
                    'patent_priority' => 1, // HIGHEST PRIORITY
                    'actions' => [
                        ['code' => 'check_continuity', 'name' => 'Check Continuity', 'description' => 'Validate prerequisite layer coverage ≥95%'],
                        ['code' => 'detect_gaps', 'name' => 'Detect Gaps', 'description' => 'Identify missing RFI segments with chainage locations'],
                        ['code' => 'show_dependencies', 'name' => 'Show Dependencies', 'description' => 'Visual layer hierarchy with coverage percentages'],
                        ['code' => 'block_submission', 'name' => 'Block Submission', 'description' => 'Prevent RFI approval if prerequisites incomplete'],
                    ],
                ],
                [
                    'code' => 'gap-analysis',
                    'name' => 'Chainage Gap Analysis',
                    'description' => 'Spatial prerequisite validation and optimal work location suggestions',
                    'route' => null, // Backend service
                    'icon' => 'ChartBarIcon',
                    'type' => 'service',
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