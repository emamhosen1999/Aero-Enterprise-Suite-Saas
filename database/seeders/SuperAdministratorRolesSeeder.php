<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SuperAdministratorRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Creates protected Super Administrator roles for platform and tenant scopes.
     *
     * Compliance:
     * - Section 3: Super Administrator Role Rules
     * - Section 2: Role & Permission Scopes
     */
    public function run(): void
    {
        // Clear cache
        app()['cache']->forget('spatie.permission.cache');

        $this->createPlatformSuperAdministrator();
        $this->createTenantSuperAdministrators();

        $this->command->info('✅ Super Administrator roles created successfully.');
    }

    /**
     * Create Platform Super Administrator role.
     */
    protected function createPlatformSuperAdministrator(): void
    {
        // Check if role already exists
        $existingRole = Role::where('name', 'platform_super_administrator')
            ->where('guard_name', 'landlord')
            ->first();

        if ($existingRole) {
            // Update existing role to ensure compliance
            $existingRole->update([
                'scope' => 'platform',
                'tenant_id' => null,
                'is_protected' => true,
                'description' => 'Platform Super Administrator - Full platform access with protection',
            ]);

            $this->command->info('Updated existing Platform Super Administrator role.');

            return;
        }

        // Create new role
        $role = Role::create([
            'name' => 'platform_super_administrator',
            'guard_name' => 'landlord',
            'scope' => 'platform',
            'tenant_id' => null,
            'is_protected' => true,
            'description' => 'Platform Super Administrator - Full platform access with protection',
        ]);

        // Create and assign all platform permissions
        $permissions = $this->getPlatformPermissions();
        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'landlord',
            ], [
                'scope' => 'platform',
                'tenant_id' => null,
                'description' => "Platform permission: {$permissionName}",
            ]);

            $role->givePermissionTo($permission);
        }

        $this->command->info('Created Platform Super Administrator role.');
    }

    /**
     * Create Tenant Super Administrator roles for all existing tenants.
     */
    protected function createTenantSuperAdministrators(): void
    {
        $tenants = Tenant::all();

        if ($tenants->isEmpty()) {
            $this->command->warn('No tenants found. Tenant Super Administrator roles will be created during tenant provisioning.');

            return;
        }

        foreach ($tenants as $tenant) {
            $this->createTenantSuperAdministratorForTenant($tenant);
        }

        $this->command->info("Created Tenant Super Administrator roles for {$tenants->count()} tenant(s).");
    }

    /**
     * Create Tenant Super Administrator role for a specific tenant.
     */
    public function createTenantSuperAdministratorForTenant(Tenant $tenant): void
    {
        // Check if role already exists for this tenant
        $existingRole = Role::where('name', 'tenant_super_administrator')
            ->where('guard_name', 'web')
            ->where('tenant_id', $tenant->id)
            ->first();

        if ($existingRole) {
            // Update existing role to ensure compliance
            $existingRole->update([
                'scope' => 'tenant',
                'is_protected' => true,
                'description' => 'Tenant Super Administrator - Full tenant access with protection',
            ]);

            return;
        }

        // Create new role
        $role = Role::create([
            'name' => 'tenant_super_administrator',
            'guard_name' => 'web',
            'scope' => 'tenant',
            'tenant_id' => $tenant->id,
            'is_protected' => true,
            'description' => 'Tenant Super Administrator - Full tenant access with protection',
        ]);

        // Create and assign all tenant permissions
        $permissions = $this->getTenantPermissions();
        foreach ($permissions as $permissionName) {
            $permission = Permission::firstOrCreate([
                'name' => $permissionName,
                'guard_name' => 'web',
                'tenant_id' => $tenant->id,
            ], [
                'scope' => 'tenant',
                'description' => "Tenant permission: {$permissionName}",
            ]);

            $role->givePermissionTo($permission);
        }
    }

    /**
     * Get platform-level permissions.
     */
    protected function getPlatformPermissions(): array
    {
        return [
            'platform.manage_tenants',
            'platform.manage_plans',
            'platform.manage_subscriptions',
            'platform.manage_modules',
            'platform.manage_roles',
            'platform.manage_permissions',
            'platform.manage_users',
            'platform.manage_settings',
            'platform.view_analytics',
            'platform.manage_billing',
        ];
    }

    /**
     * Get tenant-level permissions (core permissions all tenants need).
     */
    protected function getTenantPermissions(): array
    {
        return [
            'tenant.manage_users',
            'tenant.manage_roles',
            'tenant.manage_permissions',
            'tenant.manage_settings',
            'tenant.view_dashboard',
            'tenant.manage_modules',
            'tenant.manage_departments',
            'tenant.manage_employees',
        ];
    }
}
