<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AdminPanelRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Use 'landlord' guard for platform admin roles (LandlordUser model)
        $guard = 'landlord';

        $roles = [
            [
                'name' => 'Platform Super Admin',
                'description' => 'Full access to every platform administration feature',
               
            ],
            [
                'name' => 'Platform Support Agent',
                'description' => 'Handles tenant support tickets, announcements, and impersonation as needed',
            
            ],
            [
                'name' => 'Platform Billing Manager',
                'description' => 'Manages billing, invoicing, and financial adjustments for tenants',
     
            ],
        ];

        foreach ($roles as $roleData) {
            Role::firstOrCreate([
                'name' => $roleData['name'],
                'guard_name' => $guard,
            ], $roleData);
        }

        // Ensure permissions exist before assignments
        $permissionSeeder = new AdminPanelPermissionSeeder;
        if (method_exists($permissionSeeder, 'setCommand') && $this->command) {
            $permissionSeeder->setCommand($this->command);
        }
        $permissionSeeder->run();

        $this->assignPermissions();

        if ($this->command) {
            $this->command->info('✅ Platform admin roles seeded successfully.');
        }
    }

    /**
     * Assign permission sets to the platform roles.
     */
    protected function assignPermissions(): void
    {
        // Use 'landlord' guard for platform admin roles
        $guard = 'landlord';

        $superRole = Role::where('name', 'Platform Super Admin')->where('guard_name', $guard)->first();
        $supportRole = Role::where('name', 'Platform Support Agent')->where('guard_name', $guard)->first();
        $billingRole = Role::where('name', 'Platform Billing Manager')->where('guard_name', $guard)->first();

        if ($superRole) {
            $superRole->syncPermissions(Permission::all());
        }

        if ($supportRole) {
            $supportRole->syncPermissions([
                'platform.tenants.view',
                'platform.tenants.update',
                'platform.tenants.impersonate',
                'platform.tenants.reset-credentials',
                'platform.support.tickets.view',
                'platform.support.tickets.manage',
                'platform.support.announcements.manage',
                'platform.support.statuspage.update',
                'platform.audit.logs.view',
            ]);
        }

        if ($billingRole) {
            $billingRole->syncPermissions([
                'platform.billing.view',
                'platform.billing.invoice',
                'platform.billing.refund',
                'platform.billing.adjust-charges',
                'platform.billing.manage-payment-methods',
                'platform.billing.export-statements',
                'platform.analytics.usage.view',
                'platform.analytics.usage.export',
            ]);
        }
    }
}
