<?php

return [
    /*
    |--------------------------------------------------------------------------
    | RFI Module Hierarchy Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the complete module hierarchy for RFI.
    | Structure: module → submodules → components → actions
    |
    | This is loaded by aero:sync-module command to populate the database.
    |
    */

    'code' => 'rfi',
    'name' => 'RFI Management',
    'description' => 'Request for Inspection management including daily works, objections, and work locations',
    'icon' => 'ClipboardDocumentCheckIcon',
    'route_prefix' => '/rfi',
    'category' => 'project_management',
    'priority' => 20,
    'is_core' => false,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => 'basic',
    'license_type' => 'standard',
    'dependencies' => ['core'],
    'release_date' => '2025-01-01',

    'submodules' => [
        // ==================== Daily Works Submodule ====================
        [
            'code' => 'daily-works',
            'name' => 'Daily Works',
            'description' => 'Manage daily work entries, RFI submissions, and inspections',
            'icon' => 'DocumentTextIcon',
            'route' => '/rfi/daily-works',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'daily-work-list',
                    'name' => 'Daily Work List',
                    'description' => 'View and manage all daily work entries',
                    'route' => '/rfi/daily-works',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View daily work entries'],
                        ['code' => 'create', 'name' => 'Create', 'description' => 'Create new daily work entries'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update daily work entries'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete daily work entries'],
                        ['code' => 'export', 'name' => 'Export', 'description' => 'Export daily works to Excel/PDF'],
                        ['code' => 'import', 'name' => 'Import', 'description' => 'Import daily works from Excel'],
                    ],
                ],
                [
                    'code' => 'daily-work-summary',
                    'name' => 'Daily Work Summary',
                    'description' => 'View summary and statistics of daily works',
                    'route' => '/rfi/daily-works/summary',
                    'icon' => 'ChartBarIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View daily work summaries'],
                        ['code' => 'export', 'name' => 'Export', 'description' => 'Export summary reports'],
                    ],
                ],
                [
                    'code' => 'rfi-files',
                    'name' => 'RFI Files',
                    'description' => 'Manage RFI file attachments',
                    'route' => null,
                    'icon' => 'PaperClipIcon',
                    'type' => 'feature',

                    'actions' => [
                        ['code' => 'upload', 'name' => 'Upload', 'description' => 'Upload RFI files'],
                        ['code' => 'download', 'name' => 'Download', 'description' => 'Download RFI files'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete RFI files'],
                    ],
                ],
                [
                    'code' => 'inspection',
                    'name' => 'Inspection',
                    'description' => 'Manage inspection results and details',
                    'route' => null,
                    'icon' => 'MagnifyingGlassIcon',
                    'type' => 'feature',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View inspection details'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update inspection results'],
                    ],
                ],
            ],
        ],

        // ==================== Objections Submodule ====================
        [
            'code' => 'objections',
            'name' => 'Objections',
            'description' => 'Manage RFI objections and issue resolution',
            'icon' => 'ExclamationTriangleIcon',
            'route' => '/rfi/objections',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'objection-list',
                    'name' => 'Objection List',
                    'description' => 'View and manage all objections',
                    'route' => '/rfi/objections',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View objections'],
                        ['code' => 'create', 'name' => 'Create', 'description' => 'Create new objections'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update objections'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete objections'],
                    ],
                ],
                [
                    'code' => 'objection-review',
                    'name' => 'Objection Review',
                    'description' => 'Review and resolve objections',
                    'route' => null,
                    'icon' => 'CheckCircleIcon',
                    'type' => 'feature',

                    'actions' => [
                        ['code' => 'submit', 'name' => 'Submit', 'description' => 'Submit objection for review'],
                        ['code' => 'review', 'name' => 'Start Review', 'description' => 'Start reviewing objection'],
                        ['code' => 'resolve', 'name' => 'Resolve', 'description' => 'Resolve objection'],
                        ['code' => 'reject', 'name' => 'Reject', 'description' => 'Reject objection'],
                    ],
                ],
                [
                    'code' => 'objection-files',
                    'name' => 'Objection Files',
                    'description' => 'Manage objection file attachments',
                    'route' => null,
                    'icon' => 'PaperClipIcon',
                    'type' => 'feature',

                    'actions' => [
                        ['code' => 'upload', 'name' => 'Upload', 'description' => 'Upload objection files'],
                        ['code' => 'download', 'name' => 'Download', 'description' => 'Download objection files'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete objection files'],
                    ],
                ],
            ],
        ],

        // ==================== Work Locations Submodule ====================
        [
            'code' => 'work-locations',
            'name' => 'Work Locations',
            'description' => 'Manage work locations/jurisdictions with chainage ranges',
            'icon' => 'MapPinIcon',
            'route' => '/rfi/work-locations',
            'priority' => 30,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'work-location-list',
                    'name' => 'Work Location List',
                    'description' => 'View and manage work locations',
                    'route' => '/rfi/work-locations',
                    'icon' => 'ListBulletIcon',
                    'type' => 'page',

                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'description' => 'View work locations'],
                        ['code' => 'create', 'name' => 'Create', 'description' => 'Create new work locations'],
                        ['code' => 'update', 'name' => 'Update', 'description' => 'Update work locations'],
                        ['code' => 'delete', 'name' => 'Delete', 'description' => 'Delete work locations'],
                    ],
                ],
            ],
        ],
    ],
];
