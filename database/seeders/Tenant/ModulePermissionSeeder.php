<?php

namespace Database\Seeders\Tenant;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;

class ModulePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Starting Module Permission Seeding...');
        
        $this->createModuleManagementPermissions();
        
        $this->command->info('Module management permissions seeded successfully!');
    }

    /**
     * Create module management permissions if they don't exist.
     */
    private function createModuleManagementPermissions(): void
    {
        $modulePermissions = [
            'modules.view',
            'modules.create',
            'modules.update',
            'modules.delete',
        ];

        foreach ($modulePermissions as $permission) {
            Permission::firstOrCreate(
                ['name' => $permission, 'guard_name' => 'web'],
                ['name' => $permission, 'guard_name' => 'web']
            );
        }

        $this->command->info('Module management permissions ensured.');
    }
}

      