<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quality Control (QC) & Material Intelligence Module
    |--------------------------------------------------------------------------
    |
    | Advanced Quality Assurance system integrating Field Inspections (ITP),
    | Material Laboratory Data, and Defect Management (NCR).
    |
    */

    'code' => 'quality',
    'name' => 'Quality Control & Labs',
    'description' => 'Holistic quality management with material lab integration, smart inspections, and defect cost analysis.',
    'version' => '2.1.0',
    'category' => 'engineering_ops',
    'icon' => 'BeakerIcon', // Represents the Lab/Testing aspect
    'priority' => 18,
    'enabled' => env('QUALITY_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core', 'project', 'rfi', 'assets'],

    'submodules' => [

        // ==================== 1. SMART INSPECTIONS (ITP) ====================
        [
            'code' => 'inspections',
            'name' => 'Site Inspections (ITP)',
            'description' => 'Inspection & Test Plans with automated environmental validation.',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => '/quality/inspections',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'inspection-request',
                    'name' => 'Inspection Request (WIR)',
                    'description' => 'Digital WIR with hold-point management',
                    'route' => '/quality/inspections/wir',
                    'icon' => 'DocumentCheckIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'create', 'name' => 'Raise Request', 'description' => 'Submit new inspection request'],
                        // NOVELTY: Validates if weather was acceptable during work execution
                        ['code' => 'validate_env', 'name' => 'Env Check', 'description' => 'Auto-validate against RFI weather logs'],
                        ['code' => 'sign_off', 'name' => 'Digital Sign-off', 'description' => 'Multi-party digital signature'],
                    ],
                ],
                [
                    'code' => 'checklists',
                    'name' => 'Smart Checklists',
                    'description' => 'Dynamic checklists based on work type (Earthwork, Concrete, MEP)',
                    'route' => '/quality/inspections/checklists',
                    'icon' => 'ListBulletIcon',
                    'type' => 'settings',
                ],
            ],
        ],

        // ==================== 2. MATERIAL TESTING LAB (HIGH VALUE/NOVELTY) ====================
        [
            'code' => 'material-lab',
            'name' => 'Material Testing Lab',
            'description' => 'Integrated Laboratory Information Management System (LIMS) for construction materials.',
            'icon' => 'BeakerIcon',
            'route' => '/quality/lab',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'concrete-register',
                    'name' => 'Concrete Cube Register',
                    'description' => 'Track pouring dates, curing methods, and compressive strength results',
                    'route' => '/quality/lab/concrete',
                    'icon' => 'CubeIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'log_pour', 'name' => 'Log Pour', 'description' => 'Record new concrete pour'],
                        ['code' => 'input_7day', 'name' => '7-Day Result', 'description' => 'Input 7-day crush test result'],
                        ['code' => 'predict_28day', 'name' => 'AI Prediction', 'description' => 'Predict 28-day strength using regression model'],
                    ],
                ],
                [
                    'code' => 'soil-compaction',
                    'name' => 'Soil Density Tests',
                    'description' => 'Record Field Density Tests (FDT) and Proctor values',
                    'route' => '/quality/lab/soil',
                    'icon' => 'GlobeAmericasIcon',
                    'type' => 'page',
                ],
                [
                    'code' => 'material-approvals',
                    'name' => 'Material Submittals',
                    'description' => 'Track approval status of source materials (MAR)',
                    'route' => '/quality/lab/materials',
                    'icon' => 'TagIcon',
                    'type' => 'page',
                ],
            ],
        ],

        // ==================== 3. DEFECT MANAGEMENT (NCR) ====================
        [
            'code' => 'ncr-management',
            'name' => 'Non-Conformance (NCR)',
            'description' => 'Root cause analysis and cost-of-correction tracking.',
            'icon' => 'ExclamationTriangleIcon',
            'route' => '/quality/ncr',
            'priority' => 30,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'ncr-log',
                    'name' => 'NCR Register',
                    'description' => 'Central register of all non-conformances',
                    'route' => '/quality/ncr',
                    'icon' => 'TableCellsIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'issue', 'name' => 'Issue NCR', 'description' => 'Raise new non-conformance'],
                        ['code' => 'close_out', 'name' => 'Close Out', 'description' => 'Verify rectification and close'],
                    ],
                ],
                [
                    'code' => 'root-cause',
                    'name' => 'Root Cause Analysis',
                    'description' => '5-Whys or Fishbone diagram tools for defect analysis',
                    'route' => '/quality/ncr/analysis',
                    'icon' => 'ChartPieIcon',
                    'type' => 'feature',
                ],
            ],
        ],
    ],
];