<?php

namespace Database\Seeders;

use Aero\Core\Database\Seeders\CoreDatabaseSeeder;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Core package data (Super Admin, roles, settings)
        $this->call(CoreDatabaseSeeder::class);

        // Additional application-specific seeders can be added here
        // $this->call(TenantSeeder::class);
    }
}
