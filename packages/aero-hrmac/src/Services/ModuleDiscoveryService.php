<?php

declare(strict_types=1);

namespace Aero\HRMAC\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * Module Discovery Service
 *
 * Scans installed Aero packages and loads their config/module.php files
 * into a unified structure for database syncing.
 *
 * Discovers modules from:
 * 1. Composer packages (vendor/aero/*)
 * 2. Runtime modules (modules/*)
 */
class ModuleDiscoveryService
{
    /**
     * Aero package vendor prefix.
     */
    protected string $vendorPrefix = 'aero';

    /**
     * Get all module definitions from installed packages.
     */
    public function getModuleDefinitions(): Collection
    {
        $definitions = collect();

        // 1. Discover packages installed via Composer (vendor/aero/*)
        $vendorPath = base_path('vendor/'.$this->vendorPrefix);
        if (File::exists($vendorPath)) {
            foreach (File::directories($vendorPath) as $packagePath) {
                $moduleConfig = $this->loadModuleConfig($packagePath);
                if ($moduleConfig) {
                    $definitions->push($moduleConfig);
                }
            }
        }

        // 2. Discover runtime modules (modules/*)
        $runtimePath = base_path('modules');
        if (File::exists($runtimePath)) {
            foreach (File::directories($runtimePath) as $modulePath) {
                $moduleConfig = $this->loadModuleConfig($modulePath);
                if ($moduleConfig) {
                    $definitions->push($moduleConfig);
                }
            }
        }

        return $definitions->sortBy('priority');
    }

    /**
     * Get module definitions filtered by scope.
     */
    public function getModuleDefinitionsByScope(string $scope): Collection
    {
        return $this->getModuleDefinitions()->filter(function ($module) use ($scope) {
            return ($module['scope'] ?? 'tenant') === $scope;
        });
    }

    /**
     * Load module config from a package path.
     */
    protected function loadModuleConfig(string $packagePath): ?array
    {
        $configPath = $packagePath.'/config/module.php';

        if (! File::exists($configPath)) {
            return null;
        }

        try {
            $moduleConfig = require $configPath;

            if (is_array($moduleConfig) && $this->isValidModuleConfig($moduleConfig)) {
                return $moduleConfig;
            }

            Log::debug("Skipping incomplete module config from {$packagePath}");
        } catch (\Exception $e) {
            Log::warning("Failed to load module config from {$packagePath}: ".$e->getMessage());
        }

        return null;
    }

    /**
     * Validate if a module config has all required fields.
     */
    protected function isValidModuleConfig(array $config): bool
    {
        $requiredFields = ['code', 'name', 'scope'];

        foreach ($requiredFields as $field) {
            if (! isset($config[$field]) || empty($config[$field])) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get module structure as nested array (for admin UI).
     */
    public function getModuleTree(): array
    {
        return $this->getModuleDefinitions()->toArray();
    }

    /**
     * Get flat list of all permission codes across all modules.
     */
    public function getAllPermissionCodes(): Collection
    {
        $permissions = collect();

        foreach ($this->getModuleDefinitions() as $moduleConfig) {
            $permissions = $permissions->merge(
                $this->extractPermissionsFromModule($moduleConfig)
            );
        }

        return $permissions->unique('name');
    }

    /**
     * Extract permissions from module config recursively.
     */
    protected function extractPermissionsFromModule(array $moduleConfig): Collection
    {
        $permissions = collect();

        // Module-level permission
        if (isset($moduleConfig['code'])) {
            $permissions->push([
                'name' => $moduleConfig['code'],
                'display_name' => $moduleConfig['name'] ?? ucfirst($moduleConfig['code']),
                'description' => $moduleConfig['description'] ?? null,
                'module_code' => $moduleConfig['code'],
                'level' => 'module',
            ]);
        }

        // Process submodules
        if (isset($moduleConfig['submodules']) && is_array($moduleConfig['submodules'])) {
            foreach ($moduleConfig['submodules'] as $submodule) {
                $permissions = $permissions->merge(
                    $this->extractPermissionsFromSubmodule($submodule, $moduleConfig['code'])
                );
            }
        }

        return $permissions;
    }

    /**
     * Extract permissions from submodule.
     */
    protected function extractPermissionsFromSubmodule(array $submodule, string $moduleCode): Collection
    {
        $permissions = collect();

        if (isset($submodule['code'])) {
            $permissions->push([
                'name' => "{$moduleCode}.{$submodule['code']}",
                'display_name' => $submodule['name'] ?? ucfirst($submodule['code']),
                'description' => $submodule['description'] ?? null,
                'module_code' => $moduleCode,
                'submodule_code' => $submodule['code'],
                'level' => 'submodule',
            ]);
        }

        // Process components
        if (isset($submodule['components']) && is_array($submodule['components'])) {
            foreach ($submodule['components'] as $component) {
                $permissions = $permissions->merge(
                    $this->extractPermissionsFromComponent($component, $moduleCode, $submodule['code'])
                );
            }
        }

        return $permissions;
    }

    /**
     * Extract permissions from component (includes actions).
     */
    protected function extractPermissionsFromComponent(array $component, string $moduleCode, string $submoduleCode): Collection
    {
        $permissions = collect();

        if (isset($component['code'])) {
            $permissions->push([
                'name' => "{$moduleCode}.{$submoduleCode}.{$component['code']}",
                'display_name' => $component['name'] ?? ucfirst($component['code']),
                'description' => $component['description'] ?? null,
                'module_code' => $moduleCode,
                'submodule_code' => $submoduleCode,
                'component_code' => $component['code'],
                'level' => 'component',
            ]);
        }

        // Process actions
        if (isset($component['actions']) && is_array($component['actions'])) {
            foreach ($component['actions'] as $action) {
                if (isset($action['code'])) {
                    $permissions->push([
                        'name' => "{$moduleCode}.{$submoduleCode}.{$component['code']}.{$action['code']}",
                        'display_name' => $action['name'] ?? ucfirst($action['code']),
                        'description' => $action['description'] ?? null,
                        'module_code' => $moduleCode,
                        'submodule_code' => $submoduleCode,
                        'component_code' => $component['code'],
                        'action_code' => $action['code'],
                        'level' => 'action',
                    ]);
                }
            }
        }

        return $permissions;
    }
}
