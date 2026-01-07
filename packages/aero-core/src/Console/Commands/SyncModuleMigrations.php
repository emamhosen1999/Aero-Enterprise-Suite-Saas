<?php

namespace Aero\Core\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

/**
 * Sync Module Migrations Command
 *
 * Discovers all installed Aero packages (using the same mechanism as aero:sync-module)
 * and runs their migrations. This ensures all package database tables are created.
 *
 * Discovery mechanism:
 * 1. Scans vendor/aero/* for installed packages
 * 2. Scans modules/* for runtime modules
 * 3. Collects database/migrations paths from each package
 * 4. Runs migrations for all discovered paths
 *
 * Usage: php artisan aero:sync-migrations
 *        php artisan aero:sync-migrations --fresh   (runs migrate:fresh)
 *        php artisan aero:sync-migrations --status  (shows migration status only)
 */
class SyncModuleMigrations extends Command
{
    protected $signature = 'aero:sync-migrations
                          {--fresh : Run migrate:fresh (drops all tables and re-runs migrations)}
                          {--status : Show migration status without running}
                          {--seed : Run seeders after migrations}
                          {--force : Force migrations in production}';

    protected $description = 'Discover and run migrations from all installed Aero packages (uses same discovery as aero:sync-module)';

    /**
     * Aero package vendor prefix
     */
    protected string $vendorPrefix = 'aero';

    /**
     * Discovered migration paths
     */
    protected array $migrationPaths = [];

    public function handle(): int
    {
        $this->info('🚀 Starting Module Migration Sync...');
        $this->newLine();

        // Discover all package migration paths
        $this->discoverMigrationPaths();

        if (empty($this->migrationPaths)) {
            $this->warn('⚠️  No migration paths found in installed packages.');
            return self::SUCCESS;
        }

        $this->info("📦 Found " . count($this->migrationPaths) . " package(s) with migrations:");
        foreach ($this->migrationPaths as $package => $path) {
            $this->line("   • {$package}: {$path}");
        }
        $this->newLine();

        // Status only mode
        if ($this->option('status')) {
            return $this->showMigrationStatus();
        }

        // Run migrations
        return $this->runMigrations();
    }

    /**
     * Discover migration paths from all installed Aero packages.
     * Uses the same discovery mechanism as ModuleDiscoveryService.
     */
    protected function discoverMigrationPaths(): void
    {
        // 1. Discover packages installed via Composer (vendor/aero/*)
        $vendorPath = base_path('vendor/' . $this->vendorPrefix);
        if (File::exists($vendorPath)) {
            foreach (File::directories($vendorPath) as $packagePath) {
                $this->addMigrationPath($packagePath);
            }
        }

        // 2. Discover runtime modules (modules/*)
        $runtimePath = base_path('modules');
        if (File::exists($runtimePath)) {
            foreach (File::directories($runtimePath) as $modulePath) {
                $this->addMigrationPath($modulePath);
            }
        }
    }

    /**
     * Add migration path if it exists in package
     */
    protected function addMigrationPath(string $packagePath): void
    {
        $migrationsPath = $packagePath . '/database/migrations';

        if (File::exists($migrationsPath) && File::isDirectory($migrationsPath)) {
            // Get migration files count
            $files = File::files($migrationsPath);
            if (count($files) > 0) {
                $packageName = basename($packagePath);
                $this->migrationPaths[$packageName] = $migrationsPath;
            }
        }
    }

    /**
     * Show migration status for all discovered paths
     */
    protected function showMigrationStatus(): int
    {
        $this->info('📊 Migration Status:');
        $this->newLine();

        foreach ($this->migrationPaths as $package => $path) {
            $this->info("Package: {$package}");
            
            $files = File::files($path);
            foreach ($files as $file) {
                $filename = $file->getFilename();
                // Check if migration has run (by checking migrations table)
                $migrationName = pathinfo($filename, PATHINFO_FILENAME);
                $hasRun = \DB::table('migrations')
                    ->where('migration', $migrationName)
                    ->exists();
                
                $status = $hasRun ? '✅' : '❌';
                $this->line("   {$status} {$filename}");
            }
            $this->newLine();
        }

        return self::SUCCESS;
    }

    /**
     * Run migrations for all discovered paths
     */
    protected function runMigrations(): int
    {
        $options = [];
        
        if ($this->option('force')) {
            $options['--force'] = true;
        }

        // Build path array for migrate command
        $paths = array_values($this->migrationPaths);

        try {
            if ($this->option('fresh')) {
                $this->warn('⚠️  Running migrate:fresh - this will drop ALL tables!');
                if (!$this->option('force') && !$this->confirm('Are you sure you want to continue?')) {
                    return self::SUCCESS;
                }

                $this->info('🗑️  Dropping all tables and running fresh migrations...');
                
                // migrate:fresh with paths
                Artisan::call('migrate:fresh', array_merge($options, [
                    '--path' => $paths,
                    '--realpath' => true,
                ]), $this->output);
            } else {
                $this->info('🔄 Running pending migrations...');
                
                // Regular migrate with paths
                Artisan::call('migrate', array_merge($options, [
                    '--path' => $paths,
                    '--realpath' => true,
                ]), $this->output);
            }

            $this->newLine();
            $this->info('✅ Migrations completed successfully!');

            // Run seeders if requested
            if ($this->option('seed')) {
                $this->newLine();
                $this->info('🌱 Running seeders...');
                Artisan::call('db:seed', $options, $this->output);
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('❌ Migration failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    /**
     * Get list of all discovered packages with migrations
     */
    public function getDiscoveredPackages(): array
    {
        return array_keys($this->migrationPaths);
    }
}
