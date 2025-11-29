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
        if (function_exists('tenant') && tenant()) {
            $this->call([
                TenantSqlSeeder::class,
            ]);

            return;
        }

        $this->command?->warn('No tenant context detected. Running central admin seeds.');

        $this->call([
            AdminPanelUserSeeder::class,
        ]);
    }
}
