<?php

namespace Aero\Core\Installation\Steps;

use Illuminate\Support\Facades\Artisan;

/**
 * Seeding Step
 *
 * Runs database seeders in dependency order
 */
class SeedingStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'seeding';
    }

    public function description(): string
    {
        return 'Seed database with essential data';
    }

    public function order(): int
    {
        return 6;
    }

    public function dependencies(): array
    {
        return ['config', 'database', 'migration', 'admin', 'modules'];
    }

    public function execute(): array
    {
        $this->log('Starting database seeding');

        try {
            Artisan::call('db:seed', [
                '--force' => true,
            ]);

            return [
                'seeding_status' => 'success',
                'seeded_tables' => [
                    'roles',
                    'permissions',
                    'settings',
                    'modules',
                ],
            ];

        } catch (\Exception $e) {
            $this->warn('Seeding partially completed: ' . $e->getMessage());

            return [
                'seeding_status' => 'completed_with_warnings',
                'warning' => $e->getMessage(),
            ];
        }
    }

    public function validate(): bool
    {
        // Check that some seed data exists
        try {
            $hasRoles = \DB::table('roles')->exists();
            $hasPermissions = \DB::table('permissions')->exists();

            return $hasRoles && $hasPermissions;

        } catch (\Exception) {
            return false;
        }
    }

    public function canSkip(): bool
    {
        return true; // Seeding can be skipped if necessary
    }

    public function isRetriable(): bool
    {
        return true;
    }
}
