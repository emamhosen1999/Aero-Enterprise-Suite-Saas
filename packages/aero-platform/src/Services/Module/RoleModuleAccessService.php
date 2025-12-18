<?php

namespace Aero\Platform\Services\Module;

use Aero\Platform\Models\Module;
use Aero\Platform\Models\ModuleComponent;
use Aero\Platform\Models\ModuleComponentAction;
use Aero\Platform\Models\RoleModuleAccess;
use Aero\Platform\Models\SubModule;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;

/**
 * Role Module Access Service
 *
 * Handles all operations related to role-module access:
 * - Checking if a role has access to module hierarchy elements
 * - Syncing role access from UI selections
 * - Getting accessible modules for a role
 */
class RoleModuleAccessService
{
    /**
     * Cache TTL in seconds (1 hour)
     */
    private const CACHE_TTL = 3600;

    /**
     * Check if a role has access to a specific action.
     */
    public function canAccessAction(Role $role, int $actionId): bool
    {
        return $this->checkAccess($role, 'action', $actionId);
    }

    /**
     * Check if a role has access to a specific component.
     */
    public function canAccessComponent(Role $role, int $componentId): bool
    {
        return $this->checkAccess($role, 'component', $componentId);
    }

    /**
     * Check if a role has access to a specific submodule.
     */
    public function canAccessSubModule(Role $role, int $subModuleId): bool
    {
        return $this->checkAccess($role, 'sub_module', $subModuleId);
    }

    /**
     * Check if a role has access to a specific module.
     */
    public function canAccessModule(Role $role, int $moduleId): bool
    {
        return $this->checkAccess($role, 'module', $moduleId);
    }

    /**
     * Check access at any level with inheritance.
     *
     * Access is granted if:
     * 1. Direct access exists at the requested level
     * 2. Access exists at a parent level (inheritance)
     */
    protected function checkAccess(Role $role, string $level, int $id): bool
    {
        $cacheKey = "role_access:{$role->id}:{$level}:{$id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($role, $level, $id) {
            // Check direct access
            $query = RoleModuleAccess::where('role_id', $role->id);

            switch ($level) {
                case 'action':
                    // Check action-level access
                    if ($query->clone()->where('action_id', $id)->exists()) {
                        return true;
                    }
                    // Check parent component access
                    $action = ModuleComponentAction::find($id);
                    if ($action) {
                        return $this->checkAccess($role, 'component', $action->module_component_id);
                    }

                    return false;

                case 'component':
                    // Check component-level access
                    if ($query->clone()->where('component_id', $id)->whereNull('action_id')->exists()) {
                        return true;
                    }
                    // Check parent submodule access
                    $component = ModuleComponent::find($id);
                    if ($component) {
                        return $this->checkAccess($role, 'sub_module', $component->sub_module_id);
                    }

                    return false;

                case 'sub_module':
                    // Check submodule-level access
                    if ($query->clone()->where('sub_module_id', $id)->whereNull('component_id')->whereNull('action_id')->exists()) {
                        return true;
                    }
                    // Check parent module access
                    $subModule = SubModule::find($id);
                    if ($subModule) {
                        return $this->checkAccess($role, 'module', $subModule->module_id);
                    }

                    return false;

                case 'module':
                    // Check module-level access (no parent to check)
                    return $query->where('module_id', $id)
                        ->whereNull('sub_module_id')
                        ->whereNull('component_id')
                        ->whereNull('action_id')
                        ->exists();
            }

            return false;
        });
    }

    /**
     * Get access scope for a specific action.
     */
    public function getAccessScope(Role $role, int $actionId): ?string
    {
        $action = ModuleComponentAction::find($actionId);
        if (! $action) {
            return null;
        }

        $component = $action->component;
        $subModule = $component?->subModule;
        $module = $subModule?->module;

        // Check from most specific to least specific
        $access = RoleModuleAccess::where('role_id', $role->id)
            ->where(function ($q) use ($actionId, $component, $subModule, $module) {
                $q->where('action_id', $actionId)
                    ->orWhere(function ($q2) use ($component) {
                        $q2->where('component_id', $component?->id)->whereNull('action_id');
                    })
                    ->orWhere(function ($q2) use ($subModule) {
                        $q2->where('sub_module_id', $subModule?->id)->whereNull('component_id');
                    })
                    ->orWhere(function ($q2) use ($module) {
                        $q2->where('module_id', $module?->id)->whereNull('sub_module_id');
                    });
            })
            ->orderByRaw('CASE 
                WHEN action_id IS NOT NULL THEN 1
                WHEN component_id IS NOT NULL THEN 2
                WHEN sub_module_id IS NOT NULL THEN 3
                WHEN module_id IS NOT NULL THEN 4
                ELSE 5 END')
            ->first();

        return $access?->access_scope;
    }

    /**
     * Sync role access from UI selections.
     *
     * @param  array  $accessData  Array of selected items with structure:
     *                             [
     *                             'modules' => [1, 2, 3],           // Full module access
     *                             'sub_modules' => [5, 6],          // Submodule level access
     *                             'components' => [10, 11],         // Component level access
     *                             'actions' => [                    // Action level with scope
     *                             ['id' => 20, 'scope' => 'all'],
     *                             ['id' => 21, 'scope' => 'own'],
     *                             ]
     *                             ]
     */
    public function syncRoleAccess(Role $role, array $accessData): void
    {
        // Clear existing access for this role
        RoleModuleAccess::where('role_id', $role->id)->delete();

        // Add module-level access
        foreach ($accessData['modules'] ?? [] as $moduleId) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'module_id' => $moduleId,
                'access_scope' => 'all',
            ]);
        }

        // Add submodule-level access
        foreach ($accessData['sub_modules'] ?? [] as $subModuleId) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'sub_module_id' => $subModuleId,
                'access_scope' => 'all',
            ]);
        }

        // Add component-level access
        foreach ($accessData['components'] ?? [] as $componentId) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'component_id' => $componentId,
                'access_scope' => 'all',
            ]);
        }

        // Add action-level access with scope
        foreach ($accessData['actions'] ?? [] as $actionData) {
            if (is_array($actionData)) {
                RoleModuleAccess::create([
                    'role_id' => $role->id,
                    'action_id' => $actionData['id'],
                    'access_scope' => $actionData['scope'] ?? 'all',
                ]);
            } else {
                // Simple action ID without scope
                RoleModuleAccess::create([
                    'role_id' => $role->id,
                    'action_id' => $actionData,
                    'access_scope' => 'all',
                ]);
            }
        }

        // Clear cache for this role
        $this->clearRoleCache($role);
    }

    /**
     * Get all accessible module IDs for a role.
     */
    public function getAccessibleModuleIds(Role $role): array
    {
        $cacheKey = "role_accessible_modules:{$role->id}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($role) {
            $access = RoleModuleAccess::where('role_id', $role->id)->get();

            $moduleIds = collect();

            foreach ($access as $entry) {
                if ($entry->module_id) {
                    $moduleIds->push($entry->module_id);
                } elseif ($entry->sub_module_id) {
                    $subModule = SubModule::find($entry->sub_module_id);
                    if ($subModule) {
                        $moduleIds->push($subModule->module_id);
                    }
                } elseif ($entry->component_id) {
                    $component = ModuleComponent::find($entry->component_id);
                    if ($component) {
                        $moduleIds->push($component->module_id);
                    }
                } elseif ($entry->action_id) {
                    $action = ModuleComponentAction::find($entry->action_id);
                    if ($action?->component) {
                        $moduleIds->push($action->component->module_id);
                    }
                }
            }

            return $moduleIds->unique()->values()->toArray();
        });
    }

    /**
     * Get the full access tree for a role (for UI display).
     *
     * Returns structured data showing what's checked at each level.
     */
    public function getRoleAccessTree(Role $role): array
    {
        $access = RoleModuleAccess::where('role_id', $role->id)->get();

        return [
            'modules' => $access->whereNotNull('module_id')
                ->whereNull('sub_module_id')
                ->pluck('module_id')
                ->toArray(),
            'sub_modules' => $access->whereNotNull('sub_module_id')
                ->whereNull('component_id')
                ->pluck('sub_module_id')
                ->toArray(),
            'components' => $access->whereNotNull('component_id')
                ->whereNull('action_id')
                ->pluck('component_id')
                ->toArray(),
            'actions' => $access->whereNotNull('action_id')
                ->map(fn ($a) => ['id' => $a->action_id, 'scope' => $a->access_scope])
                ->values()
                ->toArray(),
        ];
    }

    /**
     * Clear all cached access data for a role.
     */
    public function clearRoleCache(Role $role): void
    {
        // Clear the accessible modules cache
        Cache::forget("role_accessible_modules:{$role->id}");

        // We can't easily clear all action/component/etc caches without knowing all IDs
        // In production, use tagged caching or Redis for better cache invalidation
    }

    /**
     * Grant full access to a module (and all its children).
     */
    public function grantModuleAccess(Role $role, int $moduleId): void
    {
        // Remove any existing access for this module hierarchy
        $this->revokeModuleAccess($role, $moduleId);

        // Grant module-level access (cascades to all children)
        RoleModuleAccess::create([
            'role_id' => $role->id,
            'module_id' => $moduleId,
            'access_scope' => 'all',
        ]);

        $this->clearRoleCache($role);
    }

    /**
     * Revoke all access to a module (and all its children).
     */
    public function revokeModuleAccess(Role $role, int $moduleId): void
    {
        $module = Module::with(['subModules.components.actions'])->find($moduleId);

        if (! $module) {
            return;
        }

        // Remove module-level access
        RoleModuleAccess::where('role_id', $role->id)
            ->where('module_id', $moduleId)
            ->delete();

        // Remove all submodule, component, action access for this module
        $subModuleIds = $module->subModules->pluck('id')->toArray();
        $componentIds = $module->subModules->flatMap->components->pluck('id')->toArray();
        $actionIds = $module->subModules->flatMap->components->flatMap->actions->pluck('id')->toArray();

        RoleModuleAccess::where('role_id', $role->id)
            ->where(function ($q) use ($subModuleIds, $componentIds, $actionIds) {
                $q->whereIn('sub_module_id', $subModuleIds)
                    ->orWhereIn('component_id', $componentIds)
                    ->orWhereIn('action_id', $actionIds);
            })
            ->delete();

        $this->clearRoleCache($role);
    }
}
