/**
 * Aero Platform Module Navigation Definition
 * 
 * This file defines the menu structure for the Platform Admin module.
 * It mirrors the structure defined in config/module.php.
 * 
 * Navigation is registered with Core via window.Aero.registerNavigation()
 * 
 * Icon Strategy:
 * - Icons are passed as strings (e.g., 'HomeIcon')
 * - Core's useNavigation hook resolves these to actual HeroIcon components
 * - This keeps module bundles small and avoids cross-bundle component references
 * 
 * Access Control:
 * - Each nav item specifies `access_key` path: "platform.submodule.component"
 * - Access is checked dynamically by useNavigation hook
 * - Platform Super Admin bypasses all access checks
 */

export const platformNavigation = [
    /*
    |--------------------------------------------------------------------------
    | 1. Dashboard (admin_dashboard)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Dashboard',
        icon: 'HomeIcon',
        href: '/admin/dashboard',
        active_rule: 'admin.dashboard*',
        order: 1,
        access_key: 'platform.admin_dashboard',
        module: 'platform',
    },

    /*
    |--------------------------------------------------------------------------
    | 2. Tenants (tenant_management)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Tenants',
        icon: 'BuildingOffice2Icon',
        order: 2,
        access_key: 'platform.tenant_management',
        module: 'platform',
        children: [
            {
                name: 'All Tenants',
                icon: 'BuildingOfficeIcon',
                href: '/admin/tenants',
                active_rule: 'admin.tenants.index',
                access_key: 'platform.tenant_management.tenant_list',
            },
            {
                name: 'Domains',
                icon: 'GlobeAltIcon',
                href: '/admin/tenants/domains',
                active_rule: 'admin.tenants.domains',
                access_key: 'platform.tenant_management.tenant_domains',
            },
            {
                name: 'Databases',
                icon: 'CircleStackIcon',
                href: '/admin/tenants/databases',
                active_rule: 'admin.tenants.databases',
                access_key: 'platform.tenant_management.tenant_databases',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 3. Onboarding (onboarding_management)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Onboarding',
        icon: 'UserPlusIcon',
        order: 3,
        access_key: 'platform.onboarding_management',
        module: 'platform',
        children: [
            {
                name: 'Dashboard',
                icon: 'ChartBarIcon',
                href: '/admin/onboarding',
                active_rule: 'admin.onboarding.index',
                access_key: 'platform.onboarding_management.onboarding_dashboard',
            },
            {
                name: 'Pending Approvals',
                icon: 'ClipboardDocumentListIcon',
                href: '/admin/onboarding/pending',
                active_rule: 'admin.onboarding.pending',
                access_key: 'platform.onboarding_management.pending_approvals',
            },
            {
                name: 'Provisioning',
                icon: 'ServerIcon',
                href: '/admin/onboarding/provisioning',
                active_rule: 'admin.onboarding.provisioning',
                access_key: 'platform.onboarding_management.provisioning',
            },
            {
                name: 'Trials',
                icon: 'ClockIcon',
                href: '/admin/onboarding/trials',
                active_rule: 'admin.onboarding.trials',
                access_key: 'platform.onboarding_management.trials',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 4. Plans (plan_management)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Plans',
        icon: 'CurrencyDollarIcon',
        order: 4,
        access_key: 'platform.plan_management',
        module: 'platform',
        children: [
            {
                name: 'All Plans',
                icon: 'RectangleStackIcon',
                href: '/admin/plans',
                active_rule: 'admin.plans.index',
                access_key: 'platform.plan_management.plan_list',
            },
            {
                name: 'Module Assignment',
                icon: 'PuzzlePieceIcon',
                href: '/admin/plans/modules',
                active_rule: 'admin.plans.modules',
                access_key: 'platform.plan_management.plan_modules',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 5. Billing (billing_management)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Billing',
        icon: 'CreditCardIcon',
        order: 5,
        access_key: 'platform.billing_management',
        module: 'platform',
        children: [
            {
                name: 'Dashboard',
                icon: 'ChartPieIcon',
                href: '/admin/billing',
                active_rule: 'admin.billing.index',
                access_key: 'platform.billing_management.billing_dashboard',
            },
            {
                name: 'Subscriptions',
                icon: 'ArrowPathIcon',
                href: '/admin/billing/subscriptions',
                active_rule: 'admin.billing.subscriptions',
                access_key: 'platform.billing_management.subscriptions',
            },
            {
                name: 'Invoices',
                icon: 'DocumentTextIcon',
                href: '/admin/billing/invoices',
                active_rule: 'admin.billing.invoices',
                access_key: 'platform.billing_management.invoices',
            },
            {
                name: 'Payment Gateways',
                icon: 'BanknotesIcon',
                href: '/admin/billing/gateways',
                active_rule: 'admin.billing.gateways',
                access_key: 'platform.billing_management.payment_gateways',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 6. Modules (module_management)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Modules',
        icon: 'CubeIcon',
        order: 6,
        access_key: 'platform.module_management',
        module: 'platform',
        children: [
            {
                name: 'All Modules',
                icon: 'ViewColumnsIcon',
                href: '/admin/modules',
                active_rule: 'admin.modules.index',
                access_key: 'platform.module_management.module_list',
            },
            {
                name: 'Module Pricing',
                icon: 'CurrencyDollarIcon',
                href: '/admin/modules/pricing',
                active_rule: 'admin.modules.pricing',
                access_key: 'platform.module_management.module_pricing',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 7. Error Logs (error_monitoring)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Error Logs',
        icon: 'ExclamationTriangleIcon',
        order: 7,
        access_key: 'platform.error_monitoring',
        module: 'platform',
        children: [
            {
                name: 'All Errors',
                icon: 'ExclamationCircleIcon',
                href: '/admin/error-logs',
                active_rule: 'admin.error-logs.index',
                access_key: 'platform.error_monitoring.error_log_list',
            },
            {
                name: 'Analytics',
                icon: 'ChartBarSquareIcon',
                href: '/admin/error-logs/analytics',
                active_rule: 'admin.error-logs.analytics',
                access_key: 'platform.error_monitoring.error_analytics',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 8. Platform Users (landlord_users)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Platform Users',
        icon: 'UserGroupIcon',
        order: 8,
        access_key: 'platform.landlord_users',
        module: 'platform',
        children: [
            {
                name: 'All Users',
                icon: 'UsersIcon',
                href: '/admin/users',
                active_rule: 'admin.users.index',
                access_key: 'platform.landlord_users.landlord_user_list',
            },
            {
                name: 'Roles',
                icon: 'ShieldCheckIcon',
                href: '/admin/users/roles',
                active_rule: 'admin.users.roles',
                access_key: 'platform.landlord_users.landlord_roles',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 9. Integrations (integrations)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Integrations',
        icon: 'LinkIcon',
        order: 9,
        access_key: 'platform.integrations',
        module: 'platform',
        children: [
            {
                name: 'API Keys',
                icon: 'KeyIcon',
                href: '/admin/integrations/api',
                active_rule: 'admin.integrations.api',
                access_key: 'platform.integrations.api_keys',
            },
            {
                name: 'Webhooks',
                icon: 'ArrowsRightLeftIcon',
                href: '/admin/integrations/webhooks',
                active_rule: 'admin.integrations.webhooks',
                access_key: 'platform.integrations.webhooks',
            },
            {
                name: 'Connectors',
                icon: 'PuzzlePieceIcon',
                href: '/admin/integrations/connectors',
                active_rule: 'admin.integrations.connectors',
                access_key: 'platform.integrations.connectors',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 10. Settings (platform_settings)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Settings',
        icon: 'Cog6ToothIcon',
        order: 100, // High order to push to bottom
        access_key: 'platform.platform_settings',
        module: 'platform',
        children: [
            {
                name: 'General',
                icon: 'Cog8ToothIcon',
                href: '/admin/settings',
                active_rule: 'admin.settings.index',
                access_key: 'platform.platform_settings.general_settings',
            },
            {
                name: 'Branding',
                icon: 'PaintBrushIcon',
                href: '/admin/settings/branding',
                active_rule: 'admin.settings.branding',
                access_key: 'platform.platform_settings.branding_settings',
            },
            {
                name: 'Email',
                icon: 'EnvelopeIcon',
                href: '/admin/settings/email',
                active_rule: 'admin.settings.email',
                access_key: 'platform.platform_settings.email_settings',
            },
            {
                name: 'Localization',
                icon: 'LanguageIcon',
                href: '/admin/settings/localization',
                active_rule: 'platform.settings.localization',
                access_key: 'platform.platform_settings.localization_settings',
            },
            {
                name: 'Maintenance',
                icon: 'WrenchScrewdriverIcon',
                href: '/admin/settings/maintenance',
                active_rule: 'admin.settings.maintenance',
                access_key: 'platform.platform_settings.maintenance_settings',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 11. Developer Tools (developer_tools)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Developer',
        icon: 'CommandLineIcon',
        order: 101,
        access_key: 'platform.developer_tools',
        module: 'platform',
        children: [
            {
                name: 'Dashboard',
                icon: 'ComputerDesktopIcon',
                href: '/admin/developer',
                active_rule: 'admin.developer.index',
                access_key: 'platform.developer_tools.developer_dashboard',
            },
            {
                name: 'Cache',
                icon: 'CircleStackIcon',
                href: '/admin/developer/cache',
                active_rule: 'admin.developer.cache',
                access_key: 'platform.developer_tools.cache_management',
            },
            {
                name: 'Queues',
                icon: 'QueueListIcon',
                href: '/admin/developer/queues',
                active_rule: 'admin.developer.queues',
                access_key: 'platform.developer_tools.queue_management',
            },
            {
                name: 'Logs',
                icon: 'DocumentTextIcon',
                href: '/admin/developer/logs',
                active_rule: 'admin.developer.logs',
                access_key: 'platform.developer_tools.log_viewer',
            },
        ],
    },

    /*
    |--------------------------------------------------------------------------
    | 12. Audit Logs (audit_logs)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Audit Logs',
        icon: 'ClipboardDocumentListIcon',
        href: '/admin/audit-logs',
        active_rule: 'admin.audit-logs*',
        order: 102,
        access_key: 'platform.audit_logs',
        module: 'platform',
    },

    /*
    |--------------------------------------------------------------------------
    | 13. Analytics (analytics)
    |--------------------------------------------------------------------------
    */
    {
        name: 'Analytics',
        icon: 'ChartBarIcon',
        order: 13,
        access_key: 'platform.analytics',
        module: 'platform',
        children: [
            {
                name: 'Dashboard',
                icon: 'PresentationChartLineIcon',
                href: '/admin/analytics',
                active_rule: 'admin.analytics.index',
                access_key: 'platform.analytics.analytics_dashboard',
            },
            {
                name: 'Revenue',
                icon: 'BanknotesIcon',
                href: '/admin/analytics/revenue',
                active_rule: 'admin.analytics.revenue',
                access_key: 'platform.analytics.revenue_reports',
            },
            {
                name: 'Tenant Analytics',
                icon: 'BuildingOffice2Icon',
                href: '/admin/analytics/tenants',
                active_rule: 'admin.analytics.tenants',
                access_key: 'platform.analytics.tenant_analytics',
            },
        ],
    },
];

export default platformNavigation;
