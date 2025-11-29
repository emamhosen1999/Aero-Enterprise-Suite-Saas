<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class TenantSqlSeeder extends Seeder
{
    /**
     * Default password for the seeded super admin.
     * Change this in production or use environment variables.
     */
    private const DEFAULT_ADMIN_PASSWORD = 'password';

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

        // Reset admin password to a known value so new tenants can log in
        $this->resetAdminPassword();
    }

    /**
     * Reset the super admin password to a known default.
     */
    private function resetAdminPassword(): void
    {
        $admin = User::where('email', 'super_admin@gmail.com')->first();

        if ($admin) {
            $admin->password = Hash::make(self::DEFAULT_ADMIN_PASSWORD);
            $admin->save();
            $this->command?->info('Admin password reset to default.');
        }
    }
}
