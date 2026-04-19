<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Real Estate Module — Property & Lease Management
    |--------------------------------------------------------------------------
    |
    | Manages properties, agents, listings, leases, maintenance
    | requests, and real estate reporting.
    |
    */

    'code' => 'real-estate',
    'scope' => 'tenant',
    'name' => 'Real Estate Management',
    'description' => 'Property management with listings, lease tracking, agent assignment, maintenance requests, and real estate analytics.',
    'version' => '1.0.0',
    'category' => 'industry',
    'icon' => 'BuildingOffice2Icon',
    'priority' => 32,
    'enabled' => env('REAL_ESTATE_MODULE_ENABLED', true),
    'minimum_plan' => null,
    'dependencies' => ['core'],
    'route_prefix' => 'real-estate',

    'submodules' => [

        // ==================== REAL ESTATE DASHBOARD ====================
        [
            'code' => 'real-estate-dashboard',
            'name' => 'Real Estate Dashboard',
            'description' => 'Overview of properties, listings, leases, and maintenance metrics.',
            'icon' => 'ChartPieIcon',
            'route' => 'tenant.real-estate.dashboard',
            'priority' => 1,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== PROPERTIES ====================
        [
            'code' => 'properties',
            'name' => 'Properties',
            'description' => 'Property records, details, and photo management.',
            'icon' => 'HomeModernIcon',
            'route' => 'tenant.real-estate.properties.index',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'property-list',
                    'name' => 'Property List',
                    'description' => 'View and manage all properties.',
                    'route_name' => 'tenant.real-estate.properties.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'property-photos',
                    'name' => 'Property Photos',
                    'description' => 'Upload and manage property photos.',
                    'route_name' => 'tenant.real-estate.properties.photos.upload',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'create', 'name' => 'Upload Photos', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete Photos', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== AGENTS ====================
        [
            'code' => 'agents',
            'name' => 'Agents',
            'description' => 'Real estate agent profiles and assignment management.',
            'icon' => 'UserGroupIcon',
            'route' => 'tenant.real-estate.agents.index',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'agent-list',
                    'name' => 'Agent List',
                    'description' => 'View and manage all agents.',
                    'route_name' => 'tenant.real-estate.agents.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== LISTINGS ====================
        [
            'code' => 'listings',
            'name' => 'Listings',
            'description' => 'Property listings with inquiry tracking and showing scheduling.',
            'icon' => 'NewspaperIcon',
            'route' => 'tenant.real-estate.listings.index',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'listing-list',
                    'name' => 'Listing List',
                    'description' => 'View and manage all property listings.',
                    'route_name' => 'tenant.real-estate.listings.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'listing-inquiries',
                    'name' => 'Inquiries',
                    'description' => 'Manage inquiries for a listing.',
                    'route_name' => 'tenant.real-estate.listings.inquiries.store',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'create', 'name' => 'Create Inquiry', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'listing-showings',
                    'name' => 'Showings',
                    'description' => 'Schedule and manage property showings.',
                    'route_name' => 'tenant.real-estate.listings.showings.store',
                    'priority' => 3,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'create', 'name' => 'Schedule Showing', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== LEASES ====================
        [
            'code' => 'leases',
            'name' => 'Leases',
            'description' => 'Lease agreements, renewals, and payment tracking.',
            'icon' => 'DocumentDuplicateIcon',
            'route' => 'tenant.real-estate.leases.index',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'lease-list',
                    'name' => 'Lease List',
                    'description' => 'View and manage all lease agreements.',
                    'route_name' => 'tenant.real-estate.leases.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'lease-payments',
                    'name' => 'Lease Payments',
                    'description' => 'Record and view payment history for leases.',
                    'route_name' => 'tenant.real-estate.leases.payments.index',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Payments', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Record Payment', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== MAINTENANCE ====================
        [
            'code' => 'maintenance',
            'name' => 'Maintenance',
            'description' => 'Maintenance request management, vendor assignment, and completion tracking.',
            'icon' => 'WrenchScrewdriverIcon',
            'route' => 'tenant.real-estate.maintenance.index',
            'priority' => 6,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'maintenance-list',
                    'name' => 'Maintenance Requests',
                    'description' => 'View and manage all maintenance requests.',
                    'route_name' => 'tenant.real-estate.maintenance.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'assign', 'name' => 'Assign Vendor', 'is_active' => true],
                        ['code' => 'complete', 'name' => 'Mark Complete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== REPORTS ====================
        [
            'code' => 'real-estate-reports',
            'name' => 'Reports',
            'description' => 'Property, lease, and financial analytics.',
            'icon' => 'ChartBarIcon',
            'route' => 'tenant.real-estate.reports',
            'priority' => 7,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'report-list',
                    'name' => 'Report List',
                    'description' => 'View available real estate reports.',
                    'route_name' => 'tenant.real-estate.reports',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
            ],
        ],
    ],
];
