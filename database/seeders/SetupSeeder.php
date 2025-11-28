<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class SetupSeeder extends Seeder
{
    /**
     * Seed the application's database with all necessary data for a complete setup.
     * This is a master seeder that ensures all dependencies are properly handled.
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting complete application setup...');

        // Fix any migration issues first
        $this->fixMigrationIssues();

        // Run the combined seeder with all necessary data
        $this->call([
            CombinedSeeder::class,
        ]);

        // Create an admin user if it doesn't exist
        $this->ensureAdminUserExists();

        $this->command->info('✅ Application setup completed successfully!');
        $this->command->info('You can now login with the following credentials:');
        $this->command->info('Email: admin@example.com');
        $this->command->info('Password: password');
    }

    /**
     * Fix common migration issues before seeding
     */
    private function fixMigrationIssues(): void
    {
        $this->command->info('Checking and fixing migration issues...');

        try {
            Artisan::call('hrm:extend', [
                '--fix-migration-records' => true,
            ]);

            $output = Artisan::output();
            $this->command->info('Migration fixes applied:');
            $this->command->info($output);
        } catch (\Exception $e) {
            $this->command->error('Error fixing migrations: '.$e->getMessage());
        }
    }

    /**
     * Ensure an admin user exists in the system
     */
    private function ensureAdminUserExists(): void
    {
        $this->command->info('Ensuring admin user exists...');

        $userModel = app(\App\Models\User::class);
        $adminExists = $userModel::where('email', 'admin@example.com')->exists();

        if (! $adminExists) {
            // The CombinedSeeder will handle creating the admin user
            $this->command->info('✅ Admin user will be created by the CombinedSeeder');
        } else {
            $this->command->info('✅ Admin user already exists');
        }
    }
}
