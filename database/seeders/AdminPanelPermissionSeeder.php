<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class AdminPanelPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = $this->guardName();

        foreach ($this->permissionGroups() as $namespace => $actions) {
            foreach ($actions as $action => $description) {
                $permission = sprintf('%s.%s', $namespace, $action);

                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => $guard,
                ], [
                    'description' => $description,
                ]);
            }
        }

        if ($this->command) {
            $this->command->info('✅ Admin panel permissions seeded successfully.');
        }
    }

    /**
     * Return the default guard that should own the admin permissions.
     * Uses 'landlord' guard for platform admin permissions.
     */
    protected function guardName(): string
    {
        return 'landlord';
    }

    /**
     * Namespaced permission groups for the platform admin panel.
     *
     * @return array<string, array<string, string>>
     */
    protected function permissionGroups(): array
    {
        return [
            'platform.tenants' => [
                'view' => 'View tenant organizations and their subscription state',
                'create' => 'Provision new tenant instances from the platform admin panel',
                'update' => 'Edit tenant metadata, contact info, or feature toggles',
                'suspend' => 'Suspend or reactivate tenant access across services',
                'impersonate' => 'Impersonate tenant admins for support and troubleshooting',
                'manage-domains' => 'Attach, verify, and remove tenant custom domains',
                'reset-credentials' => 'Reset tenant master credentials or API keys',
            ],
            'platform.users' => [
                'view' => 'View platform-level administrator accounts',
                'invite' => 'Invite new platform admins or support agents',
                'update' => 'Update admin profile fields and preferences',
                'deactivate' => 'Disable privileged admin accounts',
                'assign-roles' => 'Assign or change platform roles and scopes',
                'manage-mfa' => 'Reset or enforce MFA for privileged accounts',
            ],
            'platform.billing' => [
                'view' => 'View tenant billing summaries and invoices',
                'invoice' => 'Issue invoices or resend billing statements',
                'refund' => 'Process refunds or credits for customers',
                'adjust-charges' => 'Apply manual adjustments and one-off charges',
                'manage-payment-methods' => 'Update payment sources on behalf of tenants',
                'export-statements' => 'Export financial statements and ledger data',
            ],
            'platform.analytics' => [
                'dashboard.view' => 'Access the global platform analytics dashboard',
                'usage.view' => 'View tenant usage metrics and quotas',
                'usage.export' => 'Export usage metrics for offline analysis',
                'health.view' => 'Access platform health and uptime metrics',
            ],
            'platform.settings' => [
                'view' => 'View platform configuration and defaults',
                'update' => 'Modify core platform configuration',
                'feature-flags' => 'Toggle feature flags globally or per tenant',
                'security-policy' => 'Manage security policies and compliance settings',
            ],
            'platform.audit' => [
                'logs.view' => 'View audit logs across the platform',
                'logs.export' => 'Export audit logs for investigations',
                'incidents.manage' => 'Manage incident records and responses',
            ],
            'platform.support' => [
                'tickets.view' => 'View inbound support tickets and escalations',
                'tickets.manage' => 'Respond to and resolve support tickets',
                'announcements.manage' => 'Publish platform-wide announcements',
                'statuspage.update' => 'Update hosted status pages and incidents',
            ],
            'platform.integrations' => [
                'view' => 'View integrations enabled on the platform',
                'create' => 'Create or connect new platform integrations',
                'update' => 'Update integration configuration and scopes',
                'rotate-credentials' => 'Rotate shared secrets or API credentials',
                'sync-data' => 'Trigger data syncs or webhook replays',
            ],
        ];
    }
}
