<?php

namespace Database\Seeders;

use Database\Seeders\Tenant\ModulePermissionSeeder;
use Illuminate\Database\Seeder;

/**
 * Tenant Database Seeder
 *
 * This seeder runs when a new tenant is created or when seeding a tenant database.
 * It populates tenant-specific tables with initial data.
 *
 * Modules/SubModules/Components/Actions are stored in the LANDLORD database.
 * This seeder creates:
 * 1. Permissions - linked to module hierarchy via ModulePermission
 * 2. Default roles for the tenant
 * 3. Default tenant settings
 */
class TenantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command?->info('🌱 Running Tenant Database Seeder...');

        // 1. Seed module permissions - creates permissions and links to module hierarchy
        $this->call([
            ModulePermissionSeeder::class,
        ]);

        // 2. Create default tenant roles with permissions
        $this->seedDefaultRoles();

        $this->command?->info('✅ Tenant database seeded successfully!');
    }

    /**
     * Seed default roles for the tenant.
     */
    protected function seedDefaultRoles(): void
    {
        $this->command?->info('📋 Creating default tenant roles...');

        // Default roles that every tenant should have
        $defaultRoles = [
            [
                'name' => 'Super Administrator',
                'description' => 'Full access to all tenant features',
                'is_protected' => true,
                'permissions' => ['*'], // Will be handled separately - gets all permissions
            ],
            [
                'name' => 'Administrator',
                'description' => 'Administrative access with most features',
                'is_protected' => false,
                'permissions' => [
                    'tenant.settings.view',
                    'tenant.settings.update',
                    'tenant.users.view',
                    'tenant.users.create',
                    'tenant.users.update',
                    'tenant.roles.view',
                    'hr.access',
                    'hr.employees.view',
                    'hr.employees.create',
                    'hr.employees.update',
                    'hr.attendance.view',
                    'hr.attendance.mark',
                    'hr.leave.view',
                    'hr.leave.approve',
                ],
            ],
            [
                'name' => 'HR Manager',
                'description' => 'Human Resources management access',
                'is_protected' => false,
                'permissions' => [
                    'hr.access',
                    'hr.employees.view',
                    'hr.employees.create',
                    'hr.employees.update',
                    'hr.employees.delete',
                    'hr.employees.export',
                    'hr.employees.import',
                    'hr.departments.view',
                    'hr.departments.manage',
                    'hr.designations.view',
                    'hr.designations.manage',
                    'hr.attendance.view',
                    'hr.attendance.mark',
                    'hr.attendance.approve',
                    'hr.attendance.export',
                    'hr.leave.view',
                    'hr.leave.apply',
                    'hr.leave.approve',
                    'hr.leave.cancel',
                    'hr.leave.manage-balance',
                    'hr.payroll.view',
                    'hr.payroll.process',
                    'hr.salary-structures.view',
                    'hr.salary-structures.manage',
                ],
            ],
            [
                'name' => 'Employee',
                'description' => 'Basic employee access - self-service features',
                'is_protected' => false,
                'permissions' => [
                    'hr.employees.view', // View own profile
                    'hr.attendance.view', // View own attendance
                    'hr.leave.view', // View own leave
                    'hr.leave.apply', // Apply for leave
                ],
            ],
        ];

        foreach ($defaultRoles as $roleData) {
            $role = \Spatie\Permission\Models\Role::firstOrCreate(
                ['name' => $roleData['name'], 'guard_name' => 'web'],
                ['is_protected' => $roleData['is_protected'] ?? false]
            );

            // Assign permissions
            if ($roleData['permissions'] === ['*']) {
                // Super Administrator gets all permissions
                $allPermissions = \Spatie\Permission\Models\Permission::where('guard_name', 'web')->pluck('name')->toArray();
                $role->syncPermissions($allPermissions);
            } else {
                // Only sync permissions that exist
                $existingPermissions = \Spatie\Permission\Models\Permission::whereIn('name', $roleData['permissions'])
                    ->where('guard_name', 'web')
                    ->pluck('name')
                    ->toArray();
                $role->syncPermissions($existingPermissions);
            }
        }

        $this->command?->info('   ✓ Default roles created');
    }
}
