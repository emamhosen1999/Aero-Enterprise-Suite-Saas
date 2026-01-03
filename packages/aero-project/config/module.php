<?php

return [
    'code' => 'project',
    'name' => 'Project Management',
    'description' => 'Project management with tasks, milestones, time tracking, and Gantt charts',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'BriefcaseIcon',
    'priority' => 13,
    'enabled' => env('PROJECT_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    // ==================== Submodules ====================
    'submodules' => [

        // ==================== BOQ Measurements Submodule (PATENTABLE) ====================
        [
            'code' => 'boq-measurements',
            'name' => 'BOQ Measurements',
            'description' => 'Bill of Quantities measurements with chainage-indexed verification',
            'icon' => 'CalculatorIcon',
            'route' => '/project/boq-measurements',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'measurement-list',
                    'name' => 'Measurement List',
                    'description' => 'View and manage BOQ measurements',
                    'route' => '/project/boq-measurements',
                    'icon' => 'TableCellsIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View BOQ measurements'],
                        ['code' => 'create', 'name' => 'Create', 'description' => 'Create new measurements'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update measurements'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete measurements'],
                        ['code' => 'verify', 'name' => 'Verify', 'description' => 'Verify measurements'],
                        ['code' => 'reject', 'name' => 'Reject', 'description' => 'Reject measurements'],
                    ],
                ],
                [
                    'code' => 'summary-report',
                    'name' => 'Summary Report',
                    'description' => 'BOQ measurement summary and reports',
                    'route' => '/project/boq-measurements/summary',
                    'icon' => 'DocumentChartBarIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View summary report'],
                        ['code' => 'export', 'name' => 'Export', 'description' => 'Export reports'],
                    ],
                ],
            ],
        ],

        // ==================== BOQ Items Submodule (PATENTABLE) ====================
        [
            'code' => 'boq-items',
            'name' => 'BOQ Items',
            'description' => 'Bill of Quantities items master data',
            'icon' => 'ClipboardDocumentListIcon',
            'route' => '/project/boq-items',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'item-list',
                    'name' => 'Item List',
                    'description' => 'View and manage BOQ items',
                    'route' => '/project/boq-items',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View BOQ items'],
                        ['code' => 'create', 'name' => 'Create', 'description' => 'Create new BOQ items'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update BOQ items'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete BOQ items'],
                        ['code' => 'import', 'name' => 'Import', 'description' => 'Import BOQ items'],
                        ['code' => 'export', 'name' => 'Export', 'description' => 'Export BOQ items'],
                    ],
                ],
            ],
        ],
    ],
];
