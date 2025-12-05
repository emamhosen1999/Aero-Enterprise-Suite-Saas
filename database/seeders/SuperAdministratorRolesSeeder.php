<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Seeds the Platform Super Administrator role.
 *
 * This seeder ONLY creates the Super Administrator role for the platform.
 * No permissions are seeded - access control uses the role-module-access system.
 *
 * The admin user is created separately from the installation wizard data.
 */
class SuperAdministratorRolesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear cache
        app()['cache']->forget('spatie.permission.cache');

        $this->createPlatformSuperAdministrator();

        $this->command?->info('✅ Super Administrator role created successfully.');
    }

    /**
     * Create Platform Super Administrator role.
     */
    protected function createPlatformSuperAdministrator(): void
    {
        // Check if role already exists
        $existingRole = Role::where('name', 'Super Administrator')
            ->where('guard_name', 'landlord')
            ->first();

        if ($existingRole) {
            // Update existing role to ensure compliance
            $existingRole->update([
                'scope' => 'platform',
                'tenant_id' => null,
                'is_protected' => true,
                'description' => 'Platform Super Administrator - Full platform access',
            ]);

            $this->command?->info('Updated existing Platform Super Administrator role.');

            return;
        }

        // Create new role - NO permissions needed, using role-module-access system
        Role::create([
            'name' => 'Super Administrator',
            'guard_name' => 'landlord',
            'scope' => 'platform',
            'tenant_id' => null,
            'is_protected' => true,
            'description' => 'Platform Super Administrator - Full platform access',
        ]);

        $this->command?->info('Created Platform Super Administrator role.');
    }
}
