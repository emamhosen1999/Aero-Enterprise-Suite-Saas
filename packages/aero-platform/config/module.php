<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Platform Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file defines the Aero Platform module structure.
    | The Platform module provides multi-tenant SaaS infrastructure including:
    | - Landlord authentication & administration
    | - Tenant management & provisioning
    | - Plans & subscription billing
    | - Public registration & onboarding
    | - Error monitoring & analytics
    |
    | Hierarchy: Module → SubModule → Component → Action
    |
    */

    'code' => 'platform',
    'scope' => 'landlord',
    'name' => 'Platform Administration',
    'description' => 'Multi-tenant SaaS platform management including tenants, plans, billing, and system settings',
    'icon' => 'BuildingOffice2Icon',
    'route_prefix' => '/admin',
    'category' => 'platform',
    'priority' => 0, // Highest priority - platform module
    'is_core' => true,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => null,
    'license_type' => 'platform',
    'dependencies' => [],
    'release_date' => '2024-01-01',
    'enabled' => true,

    'features' => [
        'landlord_auth' => true,
        'tenant_management' => true,
        'plan_management' => true,
        'subscription_billing' => true,
        'public_registration' => true,
        'onboarding' => true,
        'error_monitoring' => true,
        'system_settings' => true,
        'impersonation' => true,
        'audit_logs' => true,
    ],

    'submodules' => [
        /*
        |--------------------------------------------------------------------------
        | 1. Dashboard
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'admin_dashboard',
            'name' => 'Dashboard',
            'description' => 'Platform overview and statistics',
            'icon' => 'HomeIcon',
            'route' => '/admin/dashboard',
            'priority' => 1,

            'components' => [
                [
                    'code' => 'dashboard_overview',
                    'name' => 'Overview',
                    'route' => '/admin/dashboard',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Dashboard'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2. Tenant Management
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'tenant_management',
            'name' => 'Tenants',
            'description' => 'Manage all tenant organizations',
            'icon' => 'BuildingOfficeIcon',
            'route' => '/admin/tenants',
            'priority' => 2,

            'components' => [
                [
                    'code' => 'tenant_list',
                    'name' => 'All Tenants',
                    'route' => '/admin/tenants',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Tenants'],
                        ['code' => 'create', 'name' => 'Create Tenant'],
                        ['code' => 'edit', 'name' => 'Edit Tenant'],
                        ['code' => 'delete', 'name' => 'Delete Tenant'],
                        ['code' => 'suspend', 'name' => 'Suspend Tenant'],
                        ['code' => 'activate', 'name' => 'Activate Tenant'],
                        ['code' => 'impersonate', 'name' => 'Impersonate Tenant'],
                    ],
                ],
                [
                    'code' => 'tenant_domains',
                    'name' => 'Domains',
                    'route' => '/admin/tenants/domains',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Domains'],
                        ['code' => 'manage', 'name' => 'Manage Domains'],
                    ],
                ],
                [
                    'code' => 'tenant_databases',
                    'name' => 'Databases',
                    'route' => '/admin/tenants/databases',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Databases'],
                        ['code' => 'migrate', 'name' => 'Run Migrations'],
                        ['code' => 'backup', 'name' => 'Backup Database'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 3. Onboarding Management
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'onboarding_management',
            'name' => 'Onboarding',
            'description' => 'Manage tenant registration and onboarding',
            'icon' => 'UserPlusIcon',
            'route' => '/admin/onboarding',
            'priority' => 3,

            'components' => [
                [
                    'code' => 'onboarding_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/admin/onboarding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Onboarding Stats'],
                    ],
                ],
                [
                    'code' => 'pending_approvals',
                    'name' => 'Pending Approvals',
                    'route' => '/admin/onboarding/pending',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pending'],
                        ['code' => 'approve', 'name' => 'Approve Tenant'],
                        ['code' => 'reject', 'name' => 'Reject Tenant'],
                    ],
                ],
                [
                    'code' => 'provisioning',
                    'name' => 'Provisioning',
                    'route' => '/admin/onboarding/provisioning',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Provisioning'],
                        ['code' => 'retry', 'name' => 'Retry Failed'],
                    ],
                ],
                [
                    'code' => 'trials',
                    'name' => 'Trials',
                    'route' => '/admin/onboarding/trials',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Trials'],
                        ['code' => 'extend', 'name' => 'Extend Trial'],
                        ['code' => 'convert', 'name' => 'Convert to Paid'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 4. Plans & Pricing
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'plan_management',
            'name' => 'Plans',
            'description' => 'Manage subscription plans and pricing',
            'icon' => 'CurrencyDollarIcon',
            'route' => '/admin/plans',
            'priority' => 4,

            'components' => [
                [
                    'code' => 'plan_list',
                    'name' => 'All Plans',
                    'route' => '/admin/plans',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Plans'],
                        ['code' => 'create', 'name' => 'Create Plan'],
                        ['code' => 'edit', 'name' => 'Edit Plan'],
                        ['code' => 'delete', 'name' => 'Delete Plan'],
                        ['code' => 'toggle_active', 'name' => 'Toggle Active Status'],
                    ],
                ],
                [
                    'code' => 'plan_modules',
                    'name' => 'Module Assignment',
                    'route' => '/admin/plans/modules',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Module Assignments'],
                        ['code' => 'assign', 'name' => 'Assign Modules'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 5. Billing & Subscriptions
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'billing_management',
            'name' => 'Billing',
            'description' => 'Manage subscriptions, invoices, and payments',
            'icon' => 'CreditCardIcon',
            'route' => '/admin/billing',
            'priority' => 5,

            'components' => [
                [
                    'code' => 'billing_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/admin/billing',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Billing Dashboard'],
                    ],
                ],
                [
                    'code' => 'subscriptions',
                    'name' => 'Subscriptions',
                    'route' => '/admin/billing/subscriptions',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Subscriptions'],
                        ['code' => 'cancel', 'name' => 'Cancel Subscription'],
                        ['code' => 'upgrade', 'name' => 'Upgrade/Downgrade'],
                    ],
                ],
                [
                    'code' => 'invoices',
                    'name' => 'Invoices',
                    'route' => '/admin/billing/invoices',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Invoices'],
                        ['code' => 'generate', 'name' => 'Generate Invoice'],
                        ['code' => 'send', 'name' => 'Send Invoice'],
                        ['code' => 'mark_paid', 'name' => 'Mark as Paid'],
                    ],
                ],
                [
                    'code' => 'payment_gateways',
                    'name' => 'Payment Gateways',
                    'route' => '/admin/billing/gateways',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Gateways'],
                        ['code' => 'configure', 'name' => 'Configure Gateway'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 6. Modules Marketplace
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'module_management',
            'name' => 'Modules',
            'description' => 'Manage available modules and marketplace',
            'icon' => 'CubeIcon',
            'route' => '/admin/modules',
            'priority' => 6,

            'components' => [
                [
                    'code' => 'module_list',
                    'name' => 'All Modules',
                    'route' => '/admin/modules',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Modules'],
                        ['code' => 'configure', 'name' => 'Configure Module'],
                        ['code' => 'toggle_active', 'name' => 'Toggle Active'],
                    ],
                ],
                [
                    'code' => 'module_pricing',
                    'name' => 'Module Pricing',
                    'route' => '/admin/modules/pricing',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pricing'],
                        ['code' => 'edit', 'name' => 'Edit Pricing'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 7. Error Monitoring
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'error_monitoring',
            'name' => 'Error Logs',
            'description' => 'Monitor errors from all installations',
            'icon' => 'ExclamationTriangleIcon',
            'route' => '/admin/error-logs',
            'priority' => 7,

            'components' => [
                [
                    'code' => 'error_log_list',
                    'name' => 'All Errors',
                    'route' => '/admin/error-logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Errors'],
                        ['code' => 'resolve', 'name' => 'Mark Resolved'],
                        ['code' => 'delete', 'name' => 'Delete Errors'],
                    ],
                ],
                [
                    'code' => 'error_analytics',
                    'name' => 'Analytics',
                    'route' => '/admin/error-logs/analytics',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Analytics'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 8. Platform Users (Landlord)
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'landlord_users',
            'name' => 'Platform Users',
            'description' => 'Manage platform administrators',
            'icon' => 'UserGroupIcon',
            'route' => '/admin/users',
            'priority' => 8,

            'components' => [
                [
                    'code' => 'landlord_user_list',
                    'name' => 'All Users',
                    'route' => '/admin/users',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Users'],
                        ['code' => 'create', 'name' => 'Create User'],
                        ['code' => 'edit', 'name' => 'Edit User'],
                        ['code' => 'delete', 'name' => 'Delete User'],
                    ],
                ],
                [
                    'code' => 'landlord_roles',
                    'name' => 'Roles',
                    'route' => '/admin/users/roles',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Roles'],
                        ['code' => 'manage', 'name' => 'Manage Roles'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 9. Integrations
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'integrations',
            'name' => 'Integrations',
            'description' => 'Manage API keys, webhooks, and connectors',
            'icon' => 'LinkIcon',
            'route' => '/admin/integrations',
            'priority' => 9,

            'components' => [
                [
                    'code' => 'api_keys',
                    'name' => 'API Keys',
                    'route' => '/admin/integrations/api',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View API Keys'],
                        ['code' => 'create', 'name' => 'Create API Key'],
                        ['code' => 'revoke', 'name' => 'Revoke API Key'],
                    ],
                ],
                [
                    'code' => 'webhooks',
                    'name' => 'Webhooks',
                    'route' => '/admin/integrations/webhooks',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Webhooks'],
                        ['code' => 'manage', 'name' => 'Manage Webhooks'],
                    ],
                ],
                [
                    'code' => 'connectors',
                    'name' => 'Connectors',
                    'route' => '/admin/integrations/connectors',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Connectors'],
                        ['code' => 'configure', 'name' => 'Configure Connector'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 10. Platform Settings
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'platform_settings',
            'name' => 'Settings',
            'description' => 'Platform configuration and settings',
            'icon' => 'Cog6ToothIcon',
            'route' => '/admin/settings',
            'priority' => 10,

            'components' => [
                [
                    'code' => 'general_settings',
                    'name' => 'General',
                    'route' => '/admin/settings',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                    ],
                ],
                [
                    'code' => 'branding_settings',
                    'name' => 'Branding',
                    'route' => '/admin/settings/branding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Branding'],
                        ['code' => 'edit', 'name' => 'Edit Branding'],
                    ],
                ],
                [
                    'code' => 'email_settings',
                    'name' => 'Email',
                    'route' => '/admin/settings/email',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Email Settings'],
                        ['code' => 'edit', 'name' => 'Edit Email Settings'],
                        ['code' => 'test', 'name' => 'Send Test Email'],
                    ],
                ],
                [
                    'code' => 'localization_settings',
                    'name' => 'Localization',
                    'route' => '/admin/settings/localization',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Localization'],
                        ['code' => 'edit', 'name' => 'Edit Localization'],
                    ],
                ],
                [
                    'code' => 'maintenance_settings',
                    'name' => 'Maintenance',
                    'route' => '/admin/settings/maintenance',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Maintenance'],
                        ['code' => 'toggle', 'name' => 'Toggle Maintenance Mode'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 11. Developer Tools
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'developer_tools',
            'name' => 'Developer',
            'description' => 'Developer tools and system monitoring',
            'icon' => 'CommandLineIcon',
            'route' => '/admin/developer',
            'priority' => 11,

            'components' => [
                [
                    'code' => 'developer_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/admin/developer',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Developer Dashboard'],
                    ],
                ],
                [
                    'code' => 'cache_management',
                    'name' => 'Cache',
                    'route' => '/admin/developer/cache',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Cache'],
                        ['code' => 'clear', 'name' => 'Clear Cache'],
                    ],
                ],
                [
                    'code' => 'queue_management',
                    'name' => 'Queues',
                    'route' => '/admin/developer/queues',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Queues'],
                        ['code' => 'manage', 'name' => 'Manage Queues'],
                    ],
                ],
                [
                    'code' => 'log_viewer',
                    'name' => 'Logs',
                    'route' => '/admin/developer/logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Logs'],
                        ['code' => 'download', 'name' => 'Download Logs'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 12. Audit Logs
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'audit_logs',
            'name' => 'Audit Logs',
            'description' => 'Platform activity and audit trail',
            'icon' => 'ClipboardDocumentListIcon',
            'route' => '/admin/audit-logs',
            'priority' => 12,

            'components' => [
                [
                    'code' => 'audit_log_list',
                    'name' => 'All Logs',
                    'route' => '/admin/audit-logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Audit Logs'],
                        ['code' => 'export', 'name' => 'Export Logs'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 13. Analytics & Reports
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'analytics',
            'name' => 'Analytics',
            'description' => 'Platform analytics and reports',
            'icon' => 'ChartBarIcon',
            'route' => '/admin/analytics',
            'priority' => 13,

            'components' => [
                [
                    'code' => 'analytics_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/admin/analytics',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Analytics'],
                    ],
                ],
                [
                    'code' => 'revenue_reports',
                    'name' => 'Revenue',
                    'route' => '/admin/analytics/revenue',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Revenue'],
                        ['code' => 'export', 'name' => 'Export Reports'],
                    ],
                ],
                [
                    'code' => 'tenant_analytics',
                    'name' => 'Tenant Analytics',
                    'route' => '/admin/analytics/tenants',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Tenant Analytics'],
                    ],
                ],
            ],
        ],
    ],

    'access_control' => [
        'super_admin_role' => 'platform-super-admin',
        'cache_ttl' => 3600,
        'cache_tags' => ['platform-module-access', 'platform-role-access'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Tenant Lifecycle States
    |--------------------------------------------------------------------------
    */
    'tenant_states' => [
        'pending' => [
            'label' => 'Pending',
            'color' => 'warning',
            'transitions' => ['provisioning', 'cancelled'],
        ],
        'provisioning' => [
            'label' => 'Provisioning',
            'color' => 'primary',
            'transitions' => ['active', 'failed'],
        ],
        'active' => [
            'label' => 'Active',
            'color' => 'success',
            'transitions' => ['suspended', 'cancelled'],
        ],
        'suspended' => [
            'label' => 'Suspended',
            'color' => 'danger',
            'transitions' => ['active', 'cancelled'],
        ],
        'cancelled' => [
            'label' => 'Cancelled',
            'color' => 'default',
            'transitions' => ['archived'],
        ],
        'failed' => [
            'label' => 'Failed',
            'color' => 'danger',
            'transitions' => ['provisioning', 'cancelled'],
        ],
        'archived' => [
            'label' => 'Archived',
            'color' => 'default',
            'transitions' => [],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Billing Configuration
    |--------------------------------------------------------------------------
    */
    'billing' => [
        'trial_days' => env('PLATFORM_TRIAL_DAYS', 14),
        'trial_enabled' => env('PLATFORM_TRIAL_ENABLED', true),
        'grace_period_days' => env('PLATFORM_GRACE_PERIOD', 5),
        'currency' => env('PLATFORM_CURRENCY', 'USD'),
        'tax_enabled' => true,
        'tax_type' => 'region', // simple, region, external
        'payment_gateways' => [
            'stripe' => [
                'enabled' => env('STRIPE_ENABLED', false),
                'mode' => env('STRIPE_MODE', 'test'),
            ],
            'sslcommerz' => [
                'enabled' => env('SSLCOMMERZ_ENABLED', false),
                'mode' => env('SSLCOMMERZ_MODE', 'sandbox'),
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Onboarding Configuration
    |--------------------------------------------------------------------------
    */
    'onboarding' => [
        'require_email_verification' => true,
        'require_phone_verification' => false,
        'require_admin_approval' => false,
        'auto_provision' => true,
        'steps' => [
            'account_type',
            'details',
            'admin',
            'verify_email',
            'plan',
            'payment',
            'provisioning',
        ],
    ],
];
