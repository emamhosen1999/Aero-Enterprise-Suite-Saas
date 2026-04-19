<?php

return [
    /*
    |--------------------------------------------------------------------------
    | CRM Module — Customer Relationship Management
    |--------------------------------------------------------------------------
    |
    | Manages customers, leads, deals, pipelines, opportunities,
    | and marketing campaigns.
    |
    */

    'code' => 'crm',
    'scope' => 'tenant',
    'name' => 'Customer Relationship Management',
    'description' => 'End-to-end customer lifecycle management with sales pipelines, deals, and marketing automation.',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'UsersIcon',
    'priority' => 12,
    'enabled' => env('CRM_MODULE_ENABLED', true),
    'minimum_plan' => null,
    'dependencies' => ['core'],
    'route_prefix' => 'crm',

    'submodules' => [

        // ==================== CRM DASHBOARD ====================
        [
            'code' => 'crm-dashboard',
            'name' => 'CRM Dashboard',
            'description' => 'Sales pipeline overview, deal metrics, and activity feed.',
            'icon' => 'ChartPieIcon',
            'route' => 'tenant.crm.dashboard',
            'priority' => 1,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== CUSTOMERS ====================
        [
            'code' => 'customers',
            'name' => 'Customers',
            'description' => 'Customer management and relationship tracking.',
            'icon' => 'UserGroupIcon',
            'route' => 'tenant.crm.customers.index',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'customer-list',
                    'name' => 'Customer List',
                    'description' => 'View and manage all customers.',
                    'route_name' => 'tenant.crm.customers.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                        ['code' => 'import', 'name' => 'Import', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== LEADS ====================
        [
            'code' => 'leads',
            'name' => 'Leads',
            'description' => 'Lead capture, scoring, and conversion tracking.',
            'icon' => 'FunnelIcon',
            'route' => 'tenant.crm.leads.index',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'lead-list',
                    'name' => 'Lead List',
                    'description' => 'View and manage all leads.',
                    'route_name' => 'tenant.crm.leads.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'convert', 'name' => 'Convert to Customer', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== DEALS ====================
        [
            'code' => 'deals',
            'name' => 'Deals',
            'description' => 'Sales deal management with stage tracking and activities.',
            'icon' => 'CurrencyDollarIcon',
            'route' => 'tenant.crm.deals.index',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'deal-list',
                    'name' => 'Deal List',
                    'description' => 'View and manage all deals.',
                    'route_name' => 'tenant.crm.deals.index',
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
            ],
        ],

        // ==================== PIPELINES ====================
        [
            'code' => 'pipelines',
            'name' => 'Pipelines',
            'description' => 'Sales pipeline configuration and stage management.',
            'icon' => 'AdjustmentsHorizontalIcon',
            'route' => 'tenant.crm.pipelines.index',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'pipeline-list',
                    'name' => 'Pipeline List',
                    'description' => 'View and manage sales pipelines.',
                    'route_name' => 'tenant.crm.pipelines.index',
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

        // ==================== OPPORTUNITIES ====================
        [
            'code' => 'opportunities',
            'name' => 'Opportunities',
            'description' => 'Opportunity tracking and revenue forecasting.',
            'icon' => 'SparklesIcon',
            'route' => 'tenant.crm.opportunities.index',
            'priority' => 6,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'opportunity-list',
                    'name' => 'Opportunity List',
                    'description' => 'View and manage all opportunities.',
                    'route_name' => 'tenant.crm.opportunities.index',
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
            ],
        ],

        // ==================== MARKETING CAMPAIGNS ====================
        [
            'code' => 'marketing',
            'name' => 'Marketing Campaigns',
            'description' => 'Email and SMS campaign management with audience targeting.',
            'icon' => 'MegaphoneIcon',
            'route' => 'tenant.crm.marketing.index',
            'priority' => 7,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'email-campaigns',
                    'name' => 'Email Campaigns',
                    'description' => 'Create and manage email marketing campaigns.',
                    'route_name' => 'tenant.crm.marketing.email.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'sms-campaigns',
                    'name' => 'SMS Campaigns',
                    'description' => 'Create and manage SMS marketing campaigns.',
                    'route_name' => 'tenant.crm.marketing.sms.index',
                    'priority' => 2,
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
    ],
];
