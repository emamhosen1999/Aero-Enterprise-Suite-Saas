<?php

namespace App\Console\Commands;

use App\Services\Role\RolePermissionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Force Role Permission Cache Reset Command
 *
 * Comprehensive cache clearing and rebuilding for role-permission system
 */
class ForceRolePermissionCacheReset extends Command
{
    protected $signature = 'roles:force-reset-cache 
                            {--clear-all : Clear all application caches}
                            {--rebuild : Rebuild permission cache after clearing}
                            {--verify : Verify cache integrity after operations}';

    protected $description = 'Force clear and rebuild role-permission cache system';

    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        parent::__construct();
        $this->rolePermissionService = $rolePermissionService;
    }

    public function handle(): int
    {
        $this->info('🚀 Starting comprehensive role-permission cache reset...');

        try {
            // Step 1: Clear all Spatie permission caches
            $this->clearSpatieCache();

            // Step 2: Clear application caches if requested
            if ($this->option('clear-all')) {
                $this->clearApplicationCaches();
            }

            // Step 3: Clear custom role-permission service cache
            $this->clearServiceCache();

            // Step 4: Rebuild cache if requested
            if ($this->option('rebuild')) {
                $this->rebuildCache();
            }

            // Step 5: Verify integrity if requested
            if ($this->option('verify')) {
                $this->verifyCache();
            }

            $this->info('✅ Cache reset completed successfully!');

            return 0;

        } catch (\Exception $e) {
            $this->error('❌ Cache reset failed: '.$e->getMessage());
            Log::error('Role permission cache reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return 1;
        }
    }

    /**
     * Clear Spatie permission caches
     */
    private function clearSpatieCache(): void
    {
        $this->info('🧹 Clearing Spatie permission caches...');

        try {
            // Clear permission cache using Spatie's method
            Artisan::call('permission:cache-reset');
            $this->line('   ✓ Spatie permission cache cleared');

            // Force clear permission cache keys manually
            $cacheKeys = [
                'spatie.permission.cache',
                'spatie.permission.roles',
                'spatie.permission.permissions',
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            $this->line('   ✓ Manual permission cache keys cleared');

        } catch (\Exception $e) {
            $this->warn('   ⚠️  Spatie cache clearing had issues: '.$e->getMessage());
        }
    }

    /**
     * Clear application caches
     */
    private function clearApplicationCaches(): void
    {
        $this->info('🧹 Clearing application caches...');

        $cacheCommands = [
            'cache:clear' => 'Application cache',
            'config:clear' => 'Configuration cache',
            'route:clear' => 'Route cache',
            'view:clear' => 'View cache',
        ];

        foreach ($cacheCommands as $command => $description) {
            try {
                Artisan::call($command);
                $this->line("   ✓ {$description} cleared");
            } catch (\Exception $e) {
                $this->warn("   ⚠️  {$description} clearing failed: ".$e->getMessage());
            }
        }
    }

    /**
     * Clear service-specific cache
     */
    private function clearServiceCache(): void
    {
        $this->info('🧹 Clearing role-permission service cache...');

        try {
            $this->rolePermissionService->resetCache();
            $this->line('   ✓ Service cache cleared');

            // Clear additional cache keys that might be used
            $serviceCacheKeys = [
                'roles_with_permissions_frontend',
                'role_permission_relationships',
                'user_roles_cache',
                'permission_modules_cache',
            ];

            foreach ($serviceCacheKeys as $key) {
                Cache::forget($key);
            }

            $this->line('   ✓ Additional service cache keys cleared');

        } catch (\Exception $e) {
            $this->warn('   ⚠️  Service cache clearing had issues: '.$e->getMessage());
        }
    }

    /**
     * Rebuild cache
     */
    private function rebuildCache(): void
    {
        $this->info('🔄 Rebuilding role-permission cache...');

        try {
            // Force fresh data retrieval to rebuild cache
            $data = $this->rolePermissionService->getRolesWithPermissionsForFrontend();

            $roleCount = count($data['roles'] ?? []);
            $permissionCount = count($data['permissions'] ?? []);
            $relationshipCount = count($data['role_has_permissions'] ?? []);

            $this->line("   ✓ Cache rebuilt with {$roleCount} roles, {$permissionCount} permissions, {$relationshipCount} relationships");

            // Verify data integrity
            if ($roleCount > 0 && $permissionCount > 0 && $relationshipCount > 0) {
                $this->line('   ✓ Cache rebuild successful with valid data');
            } else {
                $this->warn('   ⚠️  Cache rebuild completed but data seems incomplete');
            }

        } catch (\Exception $e) {
            $this->error('   ❌ Cache rebuild failed: '.$e->getMessage());
        }
    }

    /**
     * Verify cache integrity
     */
    private function verifyCache(): void
    {
        $this->info('🔍 Verifying cache integrity...');

        try {
            // Get data from cache
            $cachedData = $this->rolePermissionService->getRolesWithPermissionsForFrontend();

            // Get fresh data from database
            $freshRoles = Role::with('permissions')->get();
            $freshPermissions = Permission::all();

            $cacheRoleCount = count($cachedData['roles'] ?? []);
            $freshRoleCount = $freshRoles->count();

            $cachePermissionCount = count($cachedData['permissions'] ?? []);
            $freshPermissionCount = $freshPermissions->count();

            $this->line("   Cached: {$cacheRoleCount} roles, {$cachePermissionCount} permissions");
            $this->line("   Fresh:  {$freshRoleCount} roles, {$freshPermissionCount} permissions");

            if ($cacheRoleCount === $freshRoleCount && $cachePermissionCount === $freshPermissionCount) {
                $this->line('   ✅ Cache verification passed - data counts match');
            } else {
                $this->warn('   ⚠️  Cache verification warning - data counts do not match');
                $this->warn('   Consider running with --rebuild to fix cache');
            }

        } catch (\Exception $e) {
            $this->error('   ❌ Cache verification failed: '.$e->getMessage());
        }
    }
}
