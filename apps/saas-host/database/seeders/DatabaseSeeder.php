<?php

namespace Database\Seeders;

use Aero\Platform\Database\Seeders\PlatformDatabaseSeeder;
use Illuminate\Database\Seeder;

/**
 * Main Database Seeder for SaaS Host.
 *
 * In SaaS mode, the main database is the LANDLORD database.
 * This seeder ONLY seeds landlord-specific data:
 * - Platform admins (LandlordUsers)
 * - Subscription plans
 *
 * Tenant-specific data (Users, Employees, Departments, etc.)
 * is seeded when a tenant is provisioned, NOT here.
 *
 * @see \Aero\Platform\Database\Seeders\PlatformDatabaseSeeder
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the landlord database.
     */
    public function run(): void
    {
        // Seed platform (landlord) data only
        $this->call([
            PlatformDatabaseSeeder::class,
        ]);
    }
}
