<?php

namespace App\Console\Commands;

use App\Services\Role\RolePermissionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DiagnoseRolePermissions extends Command
{
    protected $signature = 'roles:diagnose {--fix : Attempt to fix detected issues} {--clear-cache : Clear all permission caches}';

    protected $description = 'Comprehensive diagnostic tool for role and permission issues';

    private RolePermissionService $rolePermissionService;

    public function __construct(RolePermissionService $rolePermissionService)
    {
        parent::__construct();
        $this->rolePermissionService = $rolePermissionService;
    }

    public function handle()
    {
        $this->info('🔍 Starting Role & Permission Diagnostic...');
        $this->newLine();

        $issues = [];
        $fixes = [];

        // 1. Check database connectivity and tables
        $this->line('📊 Checking Database Structure...');
        $dbIssues = $this->checkDatabaseStructure();
        if (! empty($dbIssues)) {
            $issues = array_merge($issues, $dbIssues);
        }

        // 2. Check role-permission relationships
        $this->line('🔗 Checking Role-Permission Relationships...');
        $relationshipIssues = $this->checkRolePermissionRelationships();
        if (! empty($relationshipIssues)) {
            $issues = array_merge($issues, $relationshipIssues);
        }

        // 3. Check cache integrity
        $this->line('💾 Checking Cache Status...');
        $cacheIssues = $this->checkCacheIntegrity();
        if (! empty($cacheIssues)) {
            $issues = array_merge($issues, $cacheIssues);
        }

        // 4. Test data retrieval methods
        $this->line('🎯 Testing Data Retrieval...');
        $dataIssues = $this->testDataRetrieval();
        if (! empty($dataIssues)) {
            $issues = array_merge($issues, $dataIssues);
        }

        // 5. Check Spatie permission installation
        $this->line('🔧 Checking Spatie Permission Setup...');
        $spatieIssues = $this->checkSpatieSetup();
        if (! empty($spatieIssues)) {
            $issues = array_merge($issues, $spatieIssues);
        }

        $this->newLine();

        // Display results
        if (empty($issues)) {
            $this->info('✅ All checks passed! Role and permission system appears healthy.');
        } else {
            $this->error('❌ Issues detected:');
            foreach ($issues as $issue) {
                $this->line("  • {$issue}");
            }
        }

        // Auto-fix if requested
        if ($this->option('fix') && ! empty($issues)) {
            $this->newLine();
            $this->warn('🔧 Attempting to fix detected issues...');
            $fixes = $this->attemptFixes($issues);

            if (! empty($fixes)) {
                $this->info('✅ Applied fixes:');
                foreach ($fixes as $fix) {
                    $this->line("  • {$fix}");
                }
            }
        }

        // Clear cache if requested
        if ($this->option('clear-cache')) {
            $this->newLine();
            $this->warn('🧹 Clearing all permission caches...');
            $this->clearAllCaches();
            $this->info('✅ Caches cleared successfully.');
        }

        $this->newLine();
        $this->info('🏁 Diagnostic complete.');

        // Return appropriate exit code
        return empty($issues) ? 0 : 1;
    }

    private function checkDatabaseStructure(): array
    {
        $issues = [];

        try {
            // Check if tables exist
            $requiredTables = ['roles', 'permissions', 'role_has_permissions', 'model_has_roles', 'model_has_permissions'];

            foreach ($requiredTables as $table) {
                if (! DB::getSchemaBuilder()->hasTable($table)) {
                    $issues[] = "Missing table: {$table}";
                }
            }

            // Check table data
            $roleCount = DB::table('roles')->count();
            $permissionCount = DB::table('permissions')->count();
            $relationshipCount = DB::table('role_has_permissions')->count();

            if ($roleCount === 0) {
                $issues[] = 'No roles found in database';
            }

            if ($permissionCount === 0) {
                $issues[] = 'No permissions found in database';
            }

            if ($relationshipCount === 0 && $roleCount > 0 && $permissionCount > 0) {
                $issues[] = 'No role-permission relationships found despite having roles and permissions';
            }

            $this->line("  Roles: {$roleCount}, Permissions: {$permissionCount}, Relationships: {$relationshipCount}");

        } catch (\Exception $e) {
            $issues[] = "Database connectivity issue: {$e->getMessage()}";
        }

        return $issues;
    }

    private function checkRolePermissionRelationships(): array
    {
        $issues = [];

        try {
            // Check for orphaned relationships
            $orphanedRoles = DB::table('role_has_permissions')
                ->leftJoin('roles', 'role_has_permissions.role_id', '=', 'roles.id')
                ->whereNull('roles.id')
                ->count();

            if ($orphanedRoles > 0) {
                $issues[] = "Found {$orphanedRoles} orphaned role relationships";
            }

            $orphanedPermissions = DB::table('role_has_permissions')
                ->leftJoin('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                ->whereNull('permissions.id')
                ->count();

            if ($orphanedPermissions > 0) {
                $issues[] = "Found {$orphanedPermissions} orphaned permission relationships";
            }

            // Test specific role
            $adminRole = Role::where('name', 'Super Administrator')->first();
            if ($adminRole) {
                $adminPermissions = $adminRole->permissions()->count();
                $this->line("  Super Administrator has {$adminPermissions} permissions");

                if ($adminPermissions === 0) {
                    $issues[] = 'Super Administrator role has no permissions assigned';
                }
            } else {
                $issues[] = 'Super Administrator role not found';
            }

        } catch (\Exception $e) {
            $issues[] = "Error checking relationships: {$e->getMessage()}";
        }

        return $issues;
    }

    private function checkCacheIntegrity(): array
    {
        $issues = [];

        try {
            $cacheDriver = config('cache.default');
            $this->line("  Cache driver: {$cacheDriver}");

            // Check permission cache
            $permissionCacheKey = config('permission.cache.key', 'spatie.permission.cache');
            $hasPermissionCache = Cache::has($permissionCacheKey);
            $this->line('  Permission cache exists: '.($hasPermissionCache ? 'Yes' : 'No'));

            // Test cache functionality
            $testKey = 'role_diagnostic_test_'.time();
            Cache::put($testKey, 'test_value', 60);
            $testValue = Cache::get($testKey);
            Cache::forget($testKey);

            if ($testValue !== 'test_value') {
                $issues[] = 'Cache functionality not working properly';
            }

        } catch (\Exception $e) {
            $issues[] = "Cache check failed: {$e->getMessage()}";
        }

        return $issues;
    }

    private function testDataRetrieval(): array
    {
        $issues = [];

        try {
            // Test enhanced service method
            $frontendData = $this->rolePermissionService->getRolesWithPermissionsForFrontend();

            if (isset($frontendData['error'])) {
                $issues[] = "Service method returned error: {$frontendData['error']}";
            }

            $rolesCount = count($frontendData['roles'] ?? []);
            $permissionsCount = count($frontendData['permissions'] ?? []);
            $relationshipsCount = count($frontendData['role_has_permissions'] ?? []);

            $this->line("  Service method returned: {$rolesCount} roles, {$permissionsCount} permissions, {$relationshipsCount} relationships");

            if ($rolesCount === 0) {
                $issues[] = 'Service method returned no roles';
            }

            if ($permissionsCount === 0) {
                $issues[] = 'Service method returned no permissions';
            }

            if ($relationshipsCount === 0) {
                $issues[] = 'Service method returned no role-permission relationships';
            }

            // Test grouped permissions
            $groupedPermissions = $this->rolePermissionService->getPermissionsGroupedByModule();
            $moduleCount = count($groupedPermissions);
            $this->line("  Grouped permissions: {$moduleCount} modules");

            if ($moduleCount === 0) {
                $issues[] = 'No grouped permissions modules found';
            }

        } catch (\Exception $e) {
            $issues[] = "Data retrieval test failed: {$e->getMessage()}";
        }

        return $issues;
    }

    private function checkSpatieSetup(): array
    {
        $issues = [];

        try {
            // Check config
            $permissionModel = config('permission.models.permission');
            $roleModel = config('permission.models.role');

            if ($permissionModel !== \Spatie\Permission\Models\Permission::class) {
                $issues[] = "Unexpected permission model: {$permissionModel}";
            }

            if ($roleModel !== \Spatie\Permission\Models\Role::class) {
                $issues[] = "Unexpected role model: {$roleModel}";
            }

            // Test permission registrar
            $registrar = app(\Spatie\Permission\PermissionRegistrar::class);
            $this->line('  Permission registrar class: '.get_class($registrar));

            // Test if User model has HasRoles trait
            $userModel = config('auth.providers.users.model');
            if ($userModel) {
                $userInstance = new $userModel;
                if (! method_exists($userInstance, 'hasRole')) {
                    $issues[] = "User model ({$userModel}) missing HasRoles trait";
                }
            }

        } catch (\Exception $e) {
            $issues[] = "Spatie setup check failed: {$e->getMessage()}";
        }

        return $issues;
    }

    private function attemptFixes(array $issues): array
    {
        $fixes = [];

        foreach ($issues as $issue) {
            if (str_contains($issue, 'No role-permission relationships found')) {
                try {
                    $this->call('db:seed', ['--class' => 'Database\\Seeders\\ComprehensiveRolePermissionSeeder']);
                    $fixes[] = 'Re-seeded role-permission relationships';
                } catch (\Exception $e) {
                    $this->error("Failed to re-seed: {$e->getMessage()}");
                }
            }

            if (str_contains($issue, 'orphaned')) {
                try {
                    DB::table('role_has_permissions')
                        ->leftJoin('roles', 'role_has_permissions.role_id', '=', 'roles.id')
                        ->whereNull('roles.id')
                        ->delete();

                    DB::table('role_has_permissions')
                        ->leftJoin('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                        ->whereNull('permissions.id')
                        ->delete();

                    $fixes[] = 'Cleaned up orphaned relationships';
                } catch (\Exception $e) {
                    $this->error("Failed to clean orphaned relationships: {$e->getMessage()}");
                }
            }

            if (str_contains($issue, 'Super Administrator role has no permissions')) {
                try {
                    $adminRole = Role::where('name', 'Super Administrator')->first();
                    if ($adminRole) {
                        $allPermissions = Permission::all();
                        $adminRole->syncPermissions($allPermissions);
                        $fixes[] = 'Assigned all permissions to Super Administrator';
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to fix Super Administrator permissions: {$e->getMessage()}");
                }
            }
        }

        return $fixes;
    }

    private function clearAllCaches(): void
    {
        // Clear Spatie permission cache
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

        // Clear general caches
        Cache::flush();

        // Clear artisan caches
        $this->call('cache:clear');
        $this->call('config:clear');
        $this->call('view:clear');
        $this->call('route:clear');
    }
}
