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
            // 3. Tenant module hierarchy from config/modules.hierarchy
            ModuleSeeder::class,

            // 4. Subscription plans with module assignments
            PlanSeeder::class,

            // 5. Default landlord user (optional - for development)
            LandlordUserSeeder::class,
        ]);
    }
}
