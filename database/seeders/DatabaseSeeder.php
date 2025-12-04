<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command?->warn('No tenant context detected. Running central admin seeds.');

        $this->call([
            // 1. Super Administrator role + platform permissions from config
            SuperAdministratorRolesSeeder::class,

            // 2. Platform module permissions from config/modules.platform_hierarchy
            PlatformModulePermissionSeeder::class,

            // 3. Tenant module hierarchy from config/modules.hierarchy
            ModuleSeeder::class,

            // 4. Subscription plans with module assignments
            PlanSeeder::class,

            // 5. Default landlord user (optional - for development)
            LandlordUserSeeder::class,
        ]);
    }
}
