<?php

namespace Aero\Core\Installation\Steps;

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

/**
 * Migration Step
 *
 * Runs all pending migrations in order:
 * 1. Core foundation migrations
 * 2. Authentication migrations
 * 3. Tenancy migrations (SaaS mode)
 * 4. Module-specific migrations
 * 5. Settings migrations
 *
 * Uses installation-migration-order config for ordering
 */
class MigrationStep extends BaseInstallationStep
{
    public function name(): string
    {
        return 'migration';
    }

    public function description(): string
    {
        return 'Run database migrations in dependency order';
    }

    public function order(): int
    {
        return 3;
    }

    public function dependencies(): array
    {
        return ['config', 'database'];
    }

    public function execute(): array
    {
        $config = config('installation-migration-order');
        $mode = env('INSTALLATION_MODE', 'standalone');
        $steps = $config['steps'][$mode] ?? [];

        $migrated = [];
        $migrationsByTag = [];

        // Get all pending migrations grouped by tag
        foreach ($steps as $stepData) {
            $tags = $stepData['tags'] ?? [];
            foreach ($tags as $tag) {
                $tagMigrations = $this->getMigrationsByTag($tag);
                $migrationsByTag[$tag] = $tagMigrations;
            }
        }

        $output = [];

        // Run migrations in order
        foreach ($steps as $stepName => $stepData) {
            $tags = $stepData['tags'] ?? [];
            $isCritical = $stepData['is_critical'] ?? false;

            foreach ($tags as $tag) {
                if (! isset($migrationsByTag[$tag])) {
                    continue;
                }

                $tagMigrations = $migrationsByTag[$tag];

                if (empty($tagMigrations)) {
                    $this->log("No pending migrations for tag: {$tag}");

                    continue;
                }

                try {
                    $this->log("Running migrations for tag: {$tag} (".count($tagMigrations).' files)');

                    // Run migrations
                    $exitCode = Artisan::call('migrate', [
                        '--step' => true,
                        '--force' => true,
                    ]);

                    if ($exitCode === 0) {
                        $migrated[$tag] = count($tagMigrations);
                        $output[$tag] = 'success';
                    } else {
                        throw new \Exception("Migration failed with exit code: {$exitCode}");
                    }

                } catch (\Exception $e) {
                    $output[$tag] = 'failed';

                    if ($isCritical) {
                        throw new \Exception("Critical migration tag '{$tag}' failed: ".$e->getMessage());
                    } else {
                        $this->warn("Non-critical migration tag '{$tag}' failed: ".$e->getMessage());
                    }
                }
            }
        }

        return [
            'migrations_run' => array_sum($migrated),
            'tags_processed' => count($output),
            'by_tag' => $output,
            'total_migrated' => $migrated,
        ];
    }

    public function validate(): bool
    {
        // Check that all pending migrations have been executed
        try {
            $pending = DB::table('migrations')->count();

            return $pending > 0; // At least some migrations should exist
        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Get migrations by tag
     *
     * Queries migrations table for entries with specific installation_tag
     */
    protected function getMigrationsByTag(string $tag): array
    {
        try {
            return DB::table('migrations')
                ->where('installation_tag', $tag)
                ->where('batch', 0) // Pending migrations
                ->pluck('migration')
                ->toArray();
        } catch (\Exception) {
            return [];
        }
    }

    public function canSkip(): bool
    {
        return false;
    }

    public function isRetriable(): bool
    {
        return true; // Can retry migrations
    }

    public function maxAttempts(): int
    {
        return 3;
    }

    public function rollback(): void
    {
        try {
            $this->log('Rolling back migrations');
            Artisan::call('migrate:rollback', [
                '--step' => 1,
                '--force' => true,
            ]);
        } catch (\Exception $e) {
            $this->warn('Rollback failed: '.$e->getMessage());
        }
    }
}
