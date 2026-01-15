<?php

return [
    'code' => 'project',
    'scope' => 'tenant',
    'name' => 'Enterprise Project Intelligence',
    'description' => 'Holistic project lifecycle management with AI-driven forecasting, BIM integration, and linear scheduling.',
    'version' => '2.0.0', // Major version bump
    'category' => 'business',
    'icon' => 'PresentationChartLineIcon',
    'priority' => 13,
    'enabled' => env('PROJECT_MODULE_ENABLED', true),
    'minimum_plan' => 'enterprise',
    'dependencies' => ['core', 'finance', 'assets', 'hr'],

    /*
    |--------------------------------------------------------------------------
    | Self-Service Navigation Items
    |--------------------------------------------------------------------------
    |
    | User-facing "My *" pages for the Project module.
    |
    */
    'self_service' => [
        [
            'code' => 'my-tasks',
            'name' => 'My Tasks',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => '/projects/my-tasks',
            'priority' => 20,
        ],
        [
            'code' => 'my-projects',
            'name' => 'My Projects',
            'icon' => 'FolderIcon',
            'route' => '/projects/my-projects',
            'priority' => 21,
        ],
        [
            'code' => 'my-timesheets',
            'name' => 'My Timesheets',
            'icon' => 'ClockIcon',
            'route' => '/projects/my-timesheets',
            'priority' => 22,
        ],
    ],

    // ==================== Submodules ====================
    'submodules' => [

        // ==================== 1. CORE: Intelligent Scheduling (NOVELTY: CPM + LINEAR) ====================
        [
            'code' => 'smart-scheduling',
            'name' => 'Intelligent Scheduling',
            'description' => 'Hybrid Critical Path Method (CPM) and Time-Location (Linear) scheduling for infrastructure.',
            'icon' => 'CalendarDaysIcon',
            'route' => '/project/scheduling',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'gantt-cpm',
                    'name' => 'CPM Gantt & PERT',
                    'description' => 'Interactive Gantt with auto-critical path calculation',
                    'route' => '/project/scheduling/gantt',
                    'icon' => 'ChartBarIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'simulate', 'name' => 'Monte Carlo Simulation', 'description' => 'Run schedule risk simulations'],
                        ['code' => 'baseline', 'name' => 'Manage Baselines', 'description' => 'Compare planned vs actual'],
                    ],
                ],
                [
                    'code' => 'linear-scheduler',
                    'name' => 'Time-Location Diagram', // High novelty for road/rail/pipeline projects
                    'description' => 'Visual linear scheduling for repetitive horizontal projects',
                    'route' => '/project/scheduling/linear',
                    'icon' => 'ArrowsRightLeftIcon',
                    'type' => 'page',
                    'actions' => [['code' => 'optimize', 'name' => 'Optimize Flow', 'description' => 'Detect clash in location-time matrix']],
                ],
            ],
        ],

        // ==================== 2. FINANCIAL: Advanced BOQ & Cost Control (PATENTABLE) ====================
        [
            'code' => 'boq-measurements',
            'name' => 'BOQ & Smart Certification',
            'description' => 'Bill of Quantities with chainage verification and blockchain-ready certification.',
            'icon' => 'CalculatorIcon',
            'route' => '/project/boq-measurements',
            'priority' => 10,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'measurement-list',
                    'name' => 'Measurement Book (MB)',
                    'description' => 'Digital MB with geo-fenced entry validation',
                    'route' => '/project/boq-measurements',
                    'icon' => 'TableCellsIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'verify', 'name' => 'Verify', 'description' => 'Multi-tier verification'],
                        ['code' => 'audit_trail', 'name' => 'Audit Log', 'description' => 'Immutable change history'],
                    ],
                ],
                [
                    'code' => 'earned-value',
                    'name' => 'EVM Analysis', // Earned Value Management
                    'description' => 'Real-time SPI (Schedule Performance Index) and CPI (Cost Performance Index) calculation',
                    'route' => '/project/boq-measurements/evm',
                    'icon' => 'CurrencyDollarIcon',
                    'type' => 'widget',
                ],
            ],
        ],

        // ==================== 3. ENGINEERING: BIM & Digital Twin (HIGH NOVELTY) ====================
        [
            'code' => 'digital-engineering',
            'name' => 'BIM & Engineering',
            'description' => '3D Model integration and technical documentation control.',
            'icon' => 'CubeTransparentIcon',
            'route' => '/project/engineering',
            'priority' => 15,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'bim-viewer',
                    'name' => '3D Model Viewer',
                    'description' => 'IFC/Revit model viewer with layer isolation',
                    'route' => '/project/engineering/bim',
                    'icon' => 'ViewfinderCircleIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'clash-detect', 'name' => 'Clash Detection', 'description' => 'Identify design conflicts'],
                        ['code' => 'tag-issue', 'name' => 'Tag Issue', 'description' => 'Pin tasks to 3D coordinates'],
                    ],
                ],
                [
                    'code' => 'rfi-manager',
                    'name' => 'RFI Management',
                    'description' => 'Request for Information workflow linked to BOQ items',
                    'route' => '/project/engineering/rfi',
                    'icon' => 'QuestionMarkCircleIcon',
                    'type' => 'page',
                ],
            ],
        ],

        // ==================== 4. OPERATIONS: Resource & IoT Telemetry ====================
        [
            'code' => 'site-operations',
            'name' => 'Site Operations & IoT',
            'description' => 'Live tracking of labor, machinery, and material movement.',
            'icon' => 'TruckIcon',
            'route' => '/project/operations',
            'priority' => 25,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'resource-heatmap',
                    'name' => 'Resource Heatmap',
                    'description' => 'AI-driven load balancing for manpower and machinery',
                    'route' => '/project/operations/resources',
                    'icon' => 'UserGroupIcon',
                    'type' => 'chart',
                ],
                [
                    'code' => 'iot-feed',
                    'name' => 'Equipment Telemetry',
                    'description' => 'Live feed from connected machinery (Fuel, Runtime, Idle)',
                    'route' => '/project/operations/telemetry',
                    'icon' => 'SignalIcon',
                    'type' => 'stream',
                ],
            ],
        ],

        // ==================== 5. RISK & AI: Predictive Analytics (NOVELTY) ====================
        [
            'code' => 'risk-intelligence',
            'name' => 'AI Risk Intelligence',
            'description' => 'Predictive models for delay and cost overruns.',
            'icon' => 'CpuChipIcon',
            'route' => '/project/risk',
            'priority' => 30,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'predictive-delay',
                    'name' => 'Delay Forecaster',
                    'description' => 'ML model analyzing weather, supply chain, and historical pace',
                    'route' => '/project/risk/forecast',
                    'icon' => 'CloudArrowDownIcon',
                    'type' => 'dashboard',
                ],
                [
                    'code' => 'safety-monitor',
                    'name' => 'HSE Compliance',
                    'description' => 'Health, Safety & Environment incident tracking and prevention',
                    'route' => '/project/risk/hse',
                    'icon' => 'ShieldCheckIcon',
                    'type' => 'page',
                ],
            ],
        ],
        
        // ==================== BOQ Items Master (Preserved) ====================
        [
            'code' => 'boq-items',
            'name' => 'BOQ Master Data',
            'description' => 'Central repository of cost items and rate analysis',
            'icon' => 'ClipboardDocumentListIcon',
            'route' => '/project/boq-items',
            'priority' => 20,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'item-list',
                    'name' => 'Item Library',
                    'description' => 'View and manage BOQ items',
                    'route' => '/project/boq-items',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View BOQ items'],
                        ['code' => 'import', 'name' => 'Import', 'description' => 'Import from Excel/CSV'],
                        ['code' => 'rate-analysis', 'name' => 'Rate Analysis', 'description' => 'Breakdown of material/labor costs'],
                    ],
                ],
            ],
        ],
    ],
];