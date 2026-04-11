<?php

namespace Aero\Core\Services\Module;

use Aero\Core\Models\Module;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ModuleVerificationService
{
    /**
     * Verification result object
     */
    public array $results = [];

    /**
     * Overall verification status
     */
    protected bool $isValid = true;

    /**
     * Verify a single module's installation state
     *
     * Checks:
     * 1. Module record exists in database
     * 2. All migrations for module have run
     * 3. Service provider is loaded by Laravel
     * 4. Routes are registered
     * 5. All expected tables exist
     * 6. Permissions/roles are synced
     *
     * @param string $moduleCode e.g., 'aero:hrm', 'hrm', 'core'
     * @return array Verification result with status and details
     */
    public function verifyModule(string $moduleCode): array
    {
        $normalizedCode = $this->normalizeModuleCode($moduleCode);
        $result = [
            'module_code' => $normalizedCode,
            'status' => 'pending',
            'checks' => [],
            'errors' => [],
            'warnings' => [],
            'timestamp' => now(),
        ];

        // 1. Check module record exists in DB
        $moduleInstallation = DB::table('module_installations')
            ->where('module_code', $normalizedCode)
            ->first();

        if (!$moduleInstallation) {
            $result['checks']['database_record'] = 'missing';
            $result['errors'][] = "Module not registered in module_installations table";
            $result['status'] = 'failed';
            $this->isValid = false;
            return $result;
        }

        $result['checks']['database_record'] = 'exists';

        // 2. Check migrations
        $migrationsCheck = $this->verifyMigrations($normalizedCode);
        $result['checks']['migrations'] = $migrationsCheck['status'];
        if ($migrationsCheck['status'] !== 'ok') {
            $result['warnings'][] = $migrationsCheck['message'];
        }

        // 3. Check provider loaded
        $providerCheck = $this->verifyProvider($normalizedCode);
        $result['checks']['provider'] = $providerCheck['status'];
        if ($providerCheck['status'] !== 'ok') {
            $result['errors'][] = $providerCheck['message'];
        }

        // 4. Check routes registered
        $routesCheck = $this->verifyRoutes($normalizedCode);
        $result['checks']['routes'] = $routesCheck['status'];
        if ($routesCheck['status'] !== 'ok') {
            $result['warnings'][] = $routesCheck['message'];
        }

        // 5. Check tables exist
        $tablesCheck = $this->verifyTables($normalizedCode);
        $result['checks']['tables'] = $tablesCheck['status'];
        $result['checks']['tables_found'] = $tablesCheck['count'] ?? 0;
        if ($tablesCheck['status'] !== 'ok') {
            $result['warnings'][] = $tablesCheck['message'];
        }

        // 6. Check permissions synced
        $permissionsCheck = $this->verifyPermissions($normalizedCode);
        $result['checks']['permissions'] = $permissionsCheck['status'];
        if ($permissionsCheck['status'] !== 'ok') {
            $result['warnings'][] = $permissionsCheck['message'];
        }

        // Determine overall status
        if (!empty($result['errors'])) {
            $result['status'] = 'failed';
            $this->isValid = false;
        } elseif (!empty($result['warnings'])) {
            $result['status'] = 'warning';
        } else {
            $result['status'] = 'ok';
        }

        return $result;
    }

    /**
     * Verify all modules in installation registry
     *
     * @return array Results keyed by module code
     */
    public function verifyAllModules(): array
    {
        $modules = DB::table('module_installations')
            ->where('status', '!=', 'disabled')
            ->get();

        $results = [];
        foreach ($modules as $module) {
            $results[$module->module_code] = $this->verifyModule($module->module_code);
        }

        return $results;
    }

    /**
     * Verify migrations for a module
     */
    protected function verifyMigrations(string $moduleCode): array
    {
        if (!Schema::hasColumn('migrations', 'installation_tag')) {
            return ['status' => 'unknown', 'message' => 'Migration metadata not available'];
        }

        $expected = DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->value('migration_count');

        $actual = DB::table('migrations')
            ->where('installation_tag', 'like', $moduleCode . ':%')
            ->count();

        if ($actual === 0 && $expected > 0) {
            return [
                'status' => 'failed',
                'message' => "Expected {$expected} migrations but found 0",
            ];
        }

        if ($actual < $expected) {
            return [
                'status' => 'incomplete',
                'message' => "Expected {$expected} migrations but found {$actual}",
            ];
        }

        return ['status' => 'ok', 'message' => "All {$actual} migrations found"];
    }

    /**
     * Verify service provider is loaded
     */
    protected function verifyProvider(string $moduleCode): array
    {
        // This is a simplified check - in real usage, would verify provider class exists and was booted
        // For now, just check if module record has provider_loaded flag
        $loaded = DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->value('provider_loaded');

        if (!$loaded) {
            return ['status' => 'not-loaded', 'message' => "Service provider not marked as loaded"];
        }

        return ['status' => 'ok', 'message' => "Service provider loaded"];
    }

    /**
     * Verify routes are registered
     */
    protected function verifyRoutes(string $moduleCode): array
    {
        $routesRegistered = DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->value('routes_registered');

        if (!$routesRegistered) {
            return ['status' => 'not-registered', 'message' => "Routes not marked as registered"];
        }

        return ['status' => 'ok', 'message' => "Routes registered"];
    }

    /**
     * Verify database tables exist
     */
    protected function verifyTables(string $moduleCode): array
    {
        // Get expected tables from module metadata
        $metadata = DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->value('metadata');

        if (!$metadata) {
            return ['status' => 'unknown', 'message' => "No table metadata found", 'count' => 0];
        }

        $expected = json_decode($metadata, true)['expected_tables'] ?? [];
        
        if (empty($expected)) {
            return ['status' => 'ok', 'message' => "No tables expected", 'count' => 0];
        }

        $found = 0;
        $missing = [];

        foreach ($expected as $table) {
            if (Schema::hasTable($table)) {
                $found++;
            } else {
                $missing[] = $table;
            }
        }

        if (count($missing) > 0) {
            return [
                'status' => 'incomplete',
                'message' => "Missing tables: " . implode(', ', $missing),
                'count' => $found,
            ];
        }

        return ['status' => 'ok', 'message' => "All {$found} tables found", 'count' => $found];
    }

    /**
     * Verify permissions/roles synced
     */
    protected function verifyPermissions(string $moduleCode): array
    {
        if (!Schema::hasTable('permissions')) {
            return ['status' => 'unknown', 'message' => "Permissions table not available"];
        }

        $synced = DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->value('permissions_synced');

        if (!$synced) {
            return ['status' => 'not-synced', 'message' => "Permissions not marked as synced"];
        }

        // Check that at least one permission exists for this module
        $permCount = DB::table('permissions')
            ->where('module', 'like', $moduleCode . '%')
            ->count();

        if ($permCount === 0) {
            return ['status' => 'warning', 'message' => "No permissions found for module"];
        }

        return ['status' => 'ok', 'message' => "{$permCount} permissions synced"];
    }

    /**
     * Normalize module code format
     * Accepts: 'aero:hrm', 'hrm', 'aero-hrm' → returns 'aero:hrm'
     */
    protected function normalizeModuleCode(string $code): string
    {
        // If already in 'aero:*' format, return as-is
        if (strpos($code, 'aero:') === 0) {
            return $code;
        }

        // Convert 'hrm', 'aero-hrm', 'core:hrm' formats to 'aero:hrm'
        $code = str_replace(['aero-', 'aero:'], '', $code);
        
        return "aero:{$code}";
    }

    /**
     * Get overall verification status
     */
    public function isValid(): bool
    {
        return $this->isValid;
    }

    /**
     * Update module installation record after verification
     */
    public function updateModuleInstallation(string $moduleCode, array $verificationResult): void
    {
        $status = match ($verificationResult['status']) {
            'ok' => 'active',
            'warning' => 'active',
            'failed' => 'failed',
            'pending' => 'pending',
            default => 'pending',
        };

        DB::table('module_installations')
            ->where('module_code', $moduleCode)
            ->update([
                'status' => $status,
                'verified_at' => now(),
                'failed_reason' => !empty($verificationResult['errors']) 
                    ? json_encode($verificationResult['errors']) 
                    : null,
                'metadata' => json_encode($verificationResult),
            ]);
    }

    /**
     * Generate summary report
     */
    public function generateReport(array $allResults): array
    {
        $total = count($allResults);
        $active = 0;
        $warnings = 0;
        $failed = 0;

        foreach ($allResults as $result) {
            match ($result['status']) {
                'ok' => $active++,
                'warning' => $warnings++,
                'failed' => $failed++,
                default => null,
            };
        }

        return [
            'total_modules' => $total,
            'active' => $active,
            'warnings' => $warnings,
            'failed' => $failed,
            'verification_time' => now(),
            'details' => $allResults,
        ];
    }
}
