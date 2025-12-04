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
            AdminPanelPermissionSeeder::class,  // Platform admin permissions (landlord guard)
            AdminPanelRoleSeeder::class,        // Platform admin roles (landlord guard)
            LandlordUserSeeder::class,          // Platform/Admin super admin user (landlord_users table)
            ModuleSeeder::class,                // Module hierarchy (modules, sub_modules, components, actions)
            PlanSeeder::class,                  // Subscription plans with module assignments
        ]);
    }
}
