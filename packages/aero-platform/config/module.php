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
    | Scope: 'platform' - Platform admin modules, 'tenant' - Tenant user modules
    |
    */

    'code' => 'platform',
    'scope' => 'platform',
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
            'route' => '/dashboard',
            'priority' => 1,

            'components' => [
                [
                    'code' => 'dashboard_overview',
                    'name' => 'Dashboard',
                    'route' => '/dashboard',
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
            'route' => '/tenants',
            'priority' => 2,

            'components' => [
                [
                    'code' => 'tenant_list',
                    'name' => 'All Tenants',
                    'route' => '/tenants',
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
                    'route' => '/tenants/domains',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Domains'],
                        ['code' => 'manage', 'name' => 'Manage Domains'],
                    ],
                ],
                [
                    'code' => 'tenant_databases',
                    'name' => 'Databases',
                    'route' => '/tenants/databases',
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
            'route' => '/onboarding',
            'priority' => 3,

            'components' => [
                [
                    'code' => 'onboarding_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/onboarding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Onboarding Stats'],
                    ],
                ],
                [
                    'code' => 'pending_approvals',
                    'name' => 'Pending Approvals',
                    'route' => '/onboarding/pending',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pending'],
                        ['code' => 'approve', 'name' => 'Approve Tenant'],
                        ['code' => 'reject', 'name' => 'Reject Tenant'],
                    ],
                ],
                [
                    'code' => 'provisioning',
                    'name' => 'Provisioning',
                    'route' => '/onboarding/provisioning',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Provisioning'],
                        ['code' => 'retry', 'name' => 'Retry Failed'],
                    ],
                ],
                [
                    'code' => 'trials',
                    'name' => 'Trials',
                    'route' => '/onboarding/trials',
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
            'route' => '/plans',
            'priority' => 4,

            'components' => [
                [
                    'code' => 'plan_list',
                    'name' => 'All Plans',
                    'route' => '/plans',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Plans'],
                        ['code' => 'create', 'name' => 'Create Plan'],
                        ['code' => 'edit', 'name' => 'Edit Plan'],
                        ['code' => 'delete', 'name' => 'Delete Plan'],
                        ['code' => 'archive', 'name' => 'Archive Plan'],
                        ['code' => 'clone', 'name' => 'Clone Plan'],
                    ],
                ],
                [
                    'code' => 'plan_details',
                    'name' => 'Plan Details',
                    'route' => '/plans/{id}',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Plan Details'],
                        ['code' => 'view_subscribers', 'name' => 'View Subscribers'],
                        ['code' => 'view_revenue', 'name' => 'View Revenue Metrics'],
                        ['code' => 'export', 'name' => 'Export Reports'],
                    ],
                ],
                [
                    'code' => 'plan_modules',
                    'name' => 'Module Assignment',
                    'route' => '/plans/modules',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Module Assignments'],
                        ['code' => 'assign', 'name' => 'Assign Modules'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 5. Quota Management
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'quota_management',
            'name' => 'Quota Management',
            'description' => 'Monitor and configure quota enforcement across all tenants',
            'icon' => 'ChartPieIcon',
            'route' => '/quotas',
            'priority' => 5,

            'components' => [
                [
                    'code' => 'quota_dashboard',
                    'name' => 'Quota Monitor',
                    'route' => '/quotas',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Quota Dashboard'],
                        ['code' => 'override', 'name' => 'Override Tenant Quotas'],
                        ['code' => 'dismiss_warnings', 'name' => 'Dismiss Warnings'],
                    ],
                ],
                [
                    'code' => 'quota_settings',
                    'name' => 'Enforcement Settings',
                    'route' => '/quotas/settings',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Enforcement Settings'],
                        ['code' => 'edit', 'name' => 'Edit Enforcement Settings'],
                    ],
                ],
                [
                    'code' => 'quota_analytics',
                    'name' => 'Usage Analytics',
                    'route' => '/quotas/analytics',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Usage Analytics'],
                        ['code' => 'export', 'name' => 'Export Reports'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 6. Billing & Subscriptions
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'billing_management',
            'name' => 'Billing',
            'description' => 'Manage subscriptions, invoices, and payments',
            'icon' => 'CreditCardIcon',
            'route' => '/billing',
            'priority' => 6,

            'components' => [
                [
                    'code' => 'billing_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/billing',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Billing Dashboard'],
                    ],
                ],
                [
                    'code' => 'subscriptions',
                    'name' => 'Subscriptions',
                    'route' => '/billing/subscriptions',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Subscriptions'],
                        ['code' => 'cancel', 'name' => 'Cancel Subscription'],
                        ['code' => 'upgrade', 'name' => 'Upgrade/Downgrade'],
                    ],
                ],
                [
                    'code' => 'invoices',
                    'name' => 'Invoices',
                    'route' => '/billing/invoices',
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
                    'route' => '/billing/gateways',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Gateways'],
                        ['code' => 'configure', 'name' => 'Configure Gateway'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 7. Modules Marketplace
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'module_management',
            'name' => 'Modules',
            'description' => 'Manage available modules and marketplace',
            'icon' => 'CubeIcon',
            'route' => '/modules',
            'priority' => 7,

            'components' => [
                [
                    'code' => 'module_list',
                    'name' => 'All Modules',
                    'route' => '/modules',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Modules'],
                        ['code' => 'configure', 'name' => 'Configure Module'],
                        ['code' => 'toggle_active', 'name' => 'Toggle Active'],
                    ],
                ],
                [
                    'code' => 'module_pricing',
                    'name' => 'Module Pricing',
                    'route' => '/modules/pricing',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pricing'],
                        ['code' => 'edit', 'name' => 'Edit Pricing'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 8. Error Monitoring
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'error_monitoring',
            'name' => 'Error Logs',
            'description' => 'Monitor errors from all installations',
            'icon' => 'ExclamationTriangleIcon',
            'route' => '/error-logs',
            'priority' => 8,

            'components' => [
                [
                    'code' => 'error_log_list',
                    'name' => 'All Errors',
                    'route' => '/error-logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Errors'],
                        ['code' => 'resolve', 'name' => 'Mark Resolved'],
                        ['code' => 'delete', 'name' => 'Delete Errors'],
                    ],
                ],
                [
                    'code' => 'error_analytics',
                    'name' => 'Analytics',
                    'route' => '/error-logs/analytics',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Analytics'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 9. Platform Users (Landlord)
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'landlord_users',
            'name' => 'Platform Users',
            'description' => 'Manage platform administrators',
            'icon' => 'UserGroupIcon',
            'route' => '/users',
            'priority' => 9,

            'components' => [
                [
                    'code' => 'landlord_user_list',
                    'name' => 'All Users',
                    'route' => '/users',
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
                    'route' => '/roles',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Roles'],
                        ['code' => 'manage', 'name' => 'Manage Roles'],
                    ],
                ],
                [
                    'code' => 'module_access',
                    'name' => 'Module Access',
                    'route' => '/module-access',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Module Access'],
                        ['code' => 'manage', 'name' => 'Manage Module Access'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 10. Integrations
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'integrations',
            'name' => 'Integrations',
            'description' => 'Manage API keys, webhooks, and connectors',
            'icon' => 'LinkIcon',
            'route' => '/integrations',
            'priority' => 10,

            'components' => [
                [
                    'code' => 'api_keys',
                    'name' => 'API Keys',
                    'route' => '/integrations/api',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View API Keys'],
                        ['code' => 'create', 'name' => 'Create API Key'],
                        ['code' => 'revoke', 'name' => 'Revoke API Key'],
                    ],
                ],
                [
                    'code' => 'webhooks',
                    'name' => 'Webhooks',
                    'route' => '/integrations/webhooks',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Webhooks'],
                        ['code' => 'manage', 'name' => 'Manage Webhooks'],
                    ],
                ],
                [
                    'code' => 'connectors',
                    'name' => 'Connectors',
                    'route' => '/integrations/connectors',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Connectors'],
                        ['code' => 'configure', 'name' => 'Configure Connector'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 11. Platform Settings
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'platform_settings',
            'name' => 'Settings',
            'description' => 'Platform configuration and settings',
            'icon' => 'Cog6ToothIcon',
            'route' => '/settings',
            'priority' => 11,

            'components' => [
                [
                    'code' => 'general_settings',
                    'name' => 'General',
                    'route' => '/settings',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                    ],
                ],
                [
                    'code' => 'branding_settings',
                    'name' => 'Branding',
                    'route' => '/settings/branding',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Branding'],
                        ['code' => 'edit', 'name' => 'Edit Branding'],
                    ],
                ],
                [
                    'code' => 'email_settings',
                    'name' => 'Email',
                    'route' => '/settings/email',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Email Settings'],
                        ['code' => 'edit', 'name' => 'Edit Email Settings'],
                        ['code' => 'test', 'name' => 'Send Test Email'],
                    ],
                ],
                [
                    'code' => 'localization_settings',
                    'name' => 'Localization',
                    'route' => '/settings/localization',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Localization'],
                        ['code' => 'edit', 'name' => 'Edit Localization'],
                    ],
                ],
                [
                    'code' => 'maintenance_settings',
                    'name' => 'Maintenance',
                    'route' => '/settings/maintenance',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Maintenance'],
                        ['code' => 'toggle', 'name' => 'Toggle Maintenance Mode'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 12. Developer Tools
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'developer_tools',
            'name' => 'Developer',
            'description' => 'Developer tools and system monitoring',
            'icon' => 'CommandLineIcon',
            'route' => '/developer',
            'priority' => 12,

            'components' => [
                [
                    'code' => 'developer_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/developer',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Developer Dashboard'],
                    ],
                ],
                [
                    'code' => 'cache_management',
                    'name' => 'Cache',
                    'route' => '/developer/cache',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Cache'],
                        ['code' => 'clear', 'name' => 'Clear Cache'],
                    ],
                ],
                [
                    'code' => 'queue_management',
                    'name' => 'Queues',
                    'route' => '/developer/queues',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Queues'],
                        ['code' => 'manage', 'name' => 'Manage Queues'],
                    ],
                ],
                [
                    'code' => 'log_viewer',
                    'name' => 'Logs',
                    'route' => '/developer/logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Logs'],
                        ['code' => 'download', 'name' => 'Download Logs'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 13. Audit Logs
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'audit_logs',
            'name' => 'Audit Logs',
            'description' => 'Platform activity and audit trail',
            'icon' => 'ClipboardDocumentListIcon',
            'route' => '/audit-logs',
            'priority' => 13,

            'components' => [
                [
                    'code' => 'audit_log_list',
                    'name' => 'All Logs',
                    'route' => '/audit-logs',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Audit Logs'],
                        ['code' => 'export', 'name' => 'Export Logs'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 14. Analytics & Reports
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'analytics',
            'name' => 'Analytics',
            'description' => 'Platform analytics and reports',
            'icon' => 'ChartBarIcon',
            'route' => '/analytics',
            'priority' => 14,

            'components' => [
                [
                    'code' => 'analytics_dashboard',
                    'name' => 'Dashboard',
                    'route' => '/analytics',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Analytics'],
                    ],
                ],
                [
                    'code' => 'revenue_reports',
                    'name' => 'Revenue',
                    'route' => '/analytics/revenue',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Revenue'],
                        ['code' => 'export', 'name' => 'Export Reports'],
                    ],
                ],
                [
                    'code' => 'tenant_analytics',
                    'name' => 'Tenant Analytics',
                    'route' => '/analytics/tenants',
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
