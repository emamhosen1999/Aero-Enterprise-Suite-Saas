<?php

namespace Aero\Platform\Listeners;

use Aero\Core\Services\ModuleRegistry;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Stancl\Tenancy\Events\TenantCreated;

/**
 * TenantCreatedListener
 *
 * Listens for tenant creation events and runs module migrations.
 *
 * This ensures that when a new tenant is created, all installed modules
 * (aero-hrm, aero-crm, etc.) have their migrations run on the tenant database.
 *
 * The modules themselves are unaware of tenancy - this listener handles
 * discovering their migration paths and running them in the tenant context.
 */
class TenantCreatedListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(TenantCreated $event): void
    {
        $tenant = $event->tenant;

        Log::info("[TenantCreated] Running module migrations for tenant: {$tenant->id}");

        try {
            // Initialize tenant context
            tenancy()->initialize($tenant);

            // Get all module migration paths
            $migrationPaths = $this->getModuleMigrationPaths();

            if (empty($migrationPaths)) {
                Log::info("[TenantCreated] No module migrations found for tenant: {$tenant->id}");
                tenancy()->end();

                return;
            }

            // Run migrations for each module
            foreach ($migrationPaths as $moduleName => $paths) {
                foreach ($paths as $path) {
                    if (is_dir($path)) {
                        Log::info("[TenantCreated] Running migrations for module '{$moduleName}' from: {$path}");

                        Artisan::call('migrate', [
                            '--path' => $this->getRelativePath($path),
                            '--database' => 'tenant',
                            '--force' => true,
                        ]);

                        Log::info("[TenantCreated] Completed migrations for module '{$moduleName}'");
                    }
                }
            }

            Log::info("[TenantCreated] All module migrations completed for tenant: {$tenant->id}");
        } catch (\Throwable $e) {
            Log::error("[TenantCreated] Failed to run module migrations for tenant: {$tenant->id}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        } finally {
            tenancy()->end();
        }
    }

    /**
     * Get migration paths for all installed modules.
     *
     * @return array<string, array<string>> Module name => migration paths
     */
    protected function getModuleMigrationPaths(): array
    {
        $paths = [];

        // Check for ModuleRegistry (from aero-core)
        if (app()->bound(ModuleRegistry::class)) {
            $registry = app(ModuleRegistry::class);
            $modules = $registry->getRegisteredModules();

            foreach ($modules as $module) {
                $modulePath = $module['path'] ?? null;
                if ($modulePath) {
                    $migrationPath = $modulePath.'/database/migrations';
                    if (is_dir($migrationPath)) {
                        $paths[$module['name'] ?? 'unknown'][] = $migrationPath;
                    }
                }
            }
        }

        // Fallback: Scan packages directory for module migrations
        $packagesPath = base_path('packages');
        if (! file_exists($packagesPath)) {
            // Try monorepo structure
            $packagesPath = base_path('../../packages');
        }

        if (file_exists($packagesPath)) {
            $modulePatterns = [
                'aero-hrm',
                'aero-crm',
                'aero-finance',
                'aero-project',
                'aero-ims',
                'aero-scm',
                'aero-pos',
                'aero-quality',
                'aero-dms',
                'aero-compliance',
            ];

            foreach ($modulePatterns as $moduleName) {
                $moduleMigrationPath = $packagesPath.'/'.$moduleName.'/database/migrations';
                if (is_dir($moduleMigrationPath)) {
                    $paths[$moduleName][] = realpath($moduleMigrationPath);
                }
            }
        }

        return $paths;
    }

    /**
     * Convert absolute path to relative path for artisan migrate command.
     */
    protected function getRelativePath(string $absolutePath): string
    {
        $basePath = base_path();

        // Handle monorepo structure
        if (str_starts_with($absolutePath, dirname(dirname($basePath)))) {
            return str_replace(dirname(dirname($basePath)).'/', '../../', $absolutePath);
        }

        if (str_starts_with($absolutePath, $basePath)) {
            return str_replace($basePath.'/', '', $absolutePath);
        }

        return $absolutePath;
    }
}
