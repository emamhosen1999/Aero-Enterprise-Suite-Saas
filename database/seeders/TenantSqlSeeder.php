<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

class TenantSqlSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $sqlPath = database_path('migrations/tenant/tenant.sql');

        if (! File::exists($sqlPath)) {
            $this->command?->error('Unable to locate tenant.sql.');

            return;
        }

        $statements = trim(File::get($sqlPath));

        if ($statements === '') {
            $this->command?->warn('tenant.sql is empty, skipping import.');

            return;
        }

        DB::unprepared($statements);
        $this->command?->info('tenant.sql import completed.');
    }
}
