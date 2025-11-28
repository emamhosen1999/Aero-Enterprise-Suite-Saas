<?php

namespace App\Services\Module;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModulePermission;
use App\Models\SubModule;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;

/**
 * Module Permission Service
 *
 * Manages the module-permission registry system.
 * Provides methods to define, query, and validate module access requirements.
 */
class ModulePermissionService
{
    /**
     * Cache TTL in seconds (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Get all modules with their full structure and permission requirements
     * Note: This method does NOT cache to avoid max_allowed_packet issues with large serialized models
     */
    public function getModulesWithStructure(): Collection
    {
        return Module::active()
            ->ordered()
            ->with([
                'subModules' => fn ($q) => $q->active()->ordered(),
                'subModules.components' => fn ($q) => $q->active(),
                'subModules.permissionRequirements.permission',
                'components' => fn ($q) => $q->active(),
                'permissionRequirements.permission',
            ])
            ->get();
    }

    /**
     * Get modules accessible by a specific user
     * Note: Caching is done in getNavigationForUser() with lightweight arrays instead
     */
    public function getAccessibleModules($user = null): Collection
    {
        if (! $user) {
            $user = auth()->user();
        }

        if (! $user) {
            return collect();
        }

        $modules = $this->getModulesWithStructure();

        return $modules->filter(function ($module) use ($user) {
            return $module->userCanAccess($user);
        })->map(function ($module) use ($user) {
            // Filter sub-modules the user can access
            $module->accessible_sub_modules = $module->subModules->filter(function ($subModule) use ($user) {
                return $subModule->userCanAccess($user);
            })->map(function ($subModule) use ($user) {
                // Filter components the user can access
                $subModule->accessible_components = $subModule->components->filter(function ($component) use ($user) {
                    return $component->userCanAccess($user);
                });

                return $subModule;
            });

            // Filter module-level components the user can access
            $module->accessible_components = $module->components
                ->whereNull('sub_module_id')
                ->filter(function ($component) use ($user) {
                    return $component->userCanAccess($user);
                });

            return $module;
        });
    }

    /**
     * Assign a permission requirement to a module
     */
    public function assignPermissionToModule(
        int $moduleId,
        string $permissionName,
        string $requirementType = 'required',
        ?string $requirementGroup = null
    ): ModulePermission {
        $permission = Permission::where('name', $permissionName)->firstOrFail();

        return ModulePermission::updateOrCreate(
            [
                'module_id' => $moduleId,
                'permission_id' => $permission->id,
                'sub_module_id' => null,
                'component_id' => null,
            ],
            [
                'requirement_type' => $requirementType,
                'requirement_group' => $requirementGroup ?? 'default',
                'is_active' => true,
            ]
        );
    }

    /**
     * Assign a permission requirement to a sub-module
     */
    public function assignPermissionToSubModule(
        int $subModuleId,
        string $permissionName,
        string $requirementType = 'required',
        ?string $requirementGroup = null
    ): ModulePermission {
        $permission = Permission::where('name', $permissionName)->firstOrFail();
        $subModule = SubModule::findOrFail($subModuleId);

        return ModulePermission::updateOrCreate(
            [
                'module_id' => $subModule->module_id,
                'sub_module_id' => $subModuleId,
                'permission_id' => $permission->id,
                'component_id' => null,
            ],
            [
                'requirement_type' => $requirementType,
                'requirement_group' => $requirementGroup ?? 'default',
                'is_active' => true,
            ]
        );
    }

    /**
     * Assign a permission requirement to a component
     */
    public function assignPermissionToComponent(
        int $componentId,
        string $permissionName,
        string $requirementType = 'required',
        ?string $requirementGroup = null
    ): ModulePermission {
        $permission = Permission::where('name', $permissionName)->firstOrFail();
        $component = ModuleComponent::findOrFail($componentId);

        return ModulePermission::updateOrCreate(
            [
                'module_id' => $component->module_id,
                'sub_module_id' => $component->sub_module_id,
                'component_id' => $componentId,
                'permission_id' => $permission->id,
            ],
            [
                'requirement_type' => $requirementType,
                'requirement_group' => $requirementGroup ?? 'default',
                'is_active' => true,
            ]
        );
    }

    /**
     * Remove a permission requirement
     */
    public function removePermissionRequirement(int $requirementId): bool
    {
        $this->clearCache();

        return ModulePermission::destroy($requirementId) > 0;
    }

    /**
     * Sync permissions for a module (replaces all existing requirements)
     */
    public function syncModulePermissions(int $moduleId, array $permissions): void
    {
        DB::transaction(function () use ($moduleId, $permissions) {
            // Remove existing module-level requirements
            ModulePermission::where('module_id', $moduleId)
                ->whereNull('sub_module_id')
                ->whereNull('component_id')
                ->delete();

            // Add new requirements
            foreach ($permissions as $permData) {
                if (is_string($permData)) {
                    $this->assignPermissionToModule($moduleId, $permData);
                } elseif (is_array($permData)) {
                    $this->assignPermissionToModule(
                        $moduleId,
                        $permData['permission'],
                        $permData['type'] ?? 'required',
                        $permData['group'] ?? null
                    );
                }
            }
        });

        $this->clearCache();
    }

    /**
     * Sync permissions for a sub-module
     */
    public function syncSubModulePermissions(int $subModuleId, array $permissions): void
    {
        DB::transaction(function () use ($subModuleId, $permissions) {
            // Remove existing sub-module-level requirements
            ModulePermission::where('sub_module_id', $subModuleId)
                ->whereNull('component_id')
                ->delete();

            // Add new requirements
            foreach ($permissions as $permData) {
                if (is_string($permData)) {
                    $this->assignPermissionToSubModule($subModuleId, $permData);
                } elseif (is_array($permData)) {
                    $this->assignPermissionToSubModule(
                        $subModuleId,
                        $permData['permission'],
                        $permData['type'] ?? 'required',
                        $permData['group'] ?? null
                    );
                }
            }
        });

        $this->clearCache();
    }

    /**
     * Sync permissions for a component
     */
    public function syncComponentPermissions(int $componentId, array $permissions): void
    {
        DB::transaction(function () use ($componentId, $permissions) {
            // Remove existing component requirements
            ModulePermission::where('component_id', $componentId)->delete();

            // Add new requirements
            foreach ($permissions as $permData) {
                if (is_string($permData)) {
                    $this->assignPermissionToComponent($componentId, $permData);
                } elseif (is_array($permData)) {
                    $this->assignPermissionToComponent(
                        $componentId,
                        $permData['permission'],
                        $permData['type'] ?? 'required',
                        $permData['group'] ?? null
                    );
                }
            }
        });

        $this->clearCache();
    }

    /**
     * Create or update a module
     */
    public function createOrUpdateModule(array $data): Module
    {
        $module = Module::updateOrCreate(
            ['code' => $data['code']],
            [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'route_prefix' => $data['route_prefix'] ?? null,
                'category' => $data['category'] ?? 'operations',
                'priority' => $data['priority'] ?? 100,
                'is_active' => $data['is_active'] ?? true,
                'is_core' => $data['is_core'] ?? false,
                'settings' => $data['settings'] ?? null,
            ]
        );

        $this->clearCache();

        return $module;
    }

    /**
     * Create or update a sub-module
     */
    public function createOrUpdateSubModule(int $moduleId, array $data): SubModule
    {
        $subModule = SubModule::updateOrCreate(
            [
                'module_id' => $moduleId,
                'code' => $data['code'],
            ],
            [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'icon' => $data['icon'] ?? null,
                'route' => $data['route'] ?? null,
                'priority' => $data['priority'] ?? 100,
                'is_active' => $data['is_active'] ?? true,
                'settings' => $data['settings'] ?? null,
            ]
        );

        $this->clearCache();

        return $subModule;
    }

    /**
     * Create or update a component
     */
    public function createOrUpdateComponent(int $moduleId, ?int $subModuleId, array $data): ModuleComponent
    {
        $component = ModuleComponent::updateOrCreate(
            [
                'module_id' => $moduleId,
                'sub_module_id' => $subModuleId,
                'code' => $data['code'],
            ],
            [
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'type' => $data['type'] ?? 'page',
                'route' => $data['route'] ?? null,
                'is_active' => $data['is_active'] ?? true,
                'settings' => $data['settings'] ?? null,
            ]
        );

        $this->clearCache();

        return $component;
    }

    /**
     * Get navigation structure for frontend based on user permissions
     * This method caches the lightweight array result (not Eloquent models)
     */
    public function getNavigationForUser($user = null): array
    {
        if (! $user) {
            $user = auth()->user();
        }

        if (! $user) {
            return [];
        }

        $cacheKey = 'user_navigation_'.$user->id;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($user) {
            $accessibleModules = $this->getAccessibleModules($user);

            return $accessibleModules->map(function ($module) {
                return [
                    'code' => $module->code,
                    'name' => $module->name,
                    'icon' => $module->icon,
                    'route_prefix' => $module->route_prefix,
                    'category' => $module->category,
                    'priority' => $module->priority,
                    'subModules' => $module->accessible_sub_modules->map(function ($subModule) {
                        return [
                            'code' => $subModule->code,
                            'name' => $subModule->name,
                            'icon' => $subModule->icon,
                            'route' => $subModule->route,
                            'priority' => $subModule->priority,
                            'components' => $subModule->accessible_components->map(function ($component) {
                                return [
                                    'code' => $component->code,
                                    'name' => $component->name,
                                    'type' => $component->type,
                                    'route' => $component->route,
                                ];
                            })->values()->toArray(),
                        ];
                    })->values()->toArray(),
                    'components' => $module->accessible_components->map(function ($component) {
                        return [
                            'code' => $component->code,
                            'name' => $component->name,
                            'type' => $component->type,
                            'route' => $component->route,
                        ];
                    })->values()->toArray(),
                ];
            })->values()->toArray();
        });
    }

    /**
     * Check if a user can access a specific module by code
     */
    public function userCanAccessModule(string $moduleCode, $user = null): bool
    {
        $module = Module::where('code', $moduleCode)->active()->first();

        if (! $module) {
            return false;
        }

        return $module->userCanAccess($user);
    }

    /**
     * Check if a user can access a specific sub-module by code
     */
    public function userCanAccessSubModule(string $moduleCode, string $subModuleCode, $user = null): bool
    {
        $module = Module::where('code', $moduleCode)->active()->first();

        if (! $module) {
            return false;
        }

        $subModule = $module->subModules()
            ->where('code', $subModuleCode)
            ->active()
            ->first();

        if (! $subModule) {
            return false;
        }

        return $subModule->userCanAccess($user);
    }

    /**
     * Check if a user can access a specific component by code
     */
    public function userCanAccessComponent(string $moduleCode, ?string $subModuleCode, string $componentCode, $user = null): bool
    {
        $module = Module::where('code', $moduleCode)->active()->first();

        if (! $module) {
            return false;
        }

        $query = $module->components()->where('code', $componentCode)->active();

        if ($subModuleCode) {
            $subModule = $module->subModules()->where('code', $subModuleCode)->active()->first();
            if (! $subModule) {
                return false;
            }
            $query->where('sub_module_id', $subModule->id);
        } else {
            $query->whereNull('sub_module_id');
        }

        $component = $query->first();

        if (! $component) {
            return false;
        }

        return $component->userCanAccess($user);
    }

    /**
     * Get all permission requirements for a module hierarchy
     */
    public function getModulePermissionRequirements(string $moduleCode): array
    {
        $module = Module::where('code', $moduleCode)
            ->with([
                'permissionRequirements.permission',
                'subModules.permissionRequirements.permission',
                'subModules.components.permissionRequirements.permission',
                'components.permissionRequirements.permission',
            ])
            ->first();

        if (! $module) {
            return [];
        }

        return [
            'module' => [
                'code' => $module->code,
                'name' => $module->name,
                'permissions' => $module->permissionRequirements->map(fn ($r) => [
                    'id' => $r->id,
                    'permission' => $r->permission->name,
                    'type' => $r->requirement_type,
                    'group' => $r->requirement_group,
                ])->toArray(),
            ],
            'subModules' => $module->subModules->map(fn ($sm) => [
                'code' => $sm->code,
                'name' => $sm->name,
                'permissions' => $sm->permissionRequirements->map(fn ($r) => [
                    'id' => $r->id,
                    'permission' => $r->permission->name,
                    'type' => $r->requirement_type,
                    'group' => $r->requirement_group,
                ])->toArray(),
                'components' => $sm->components->map(fn ($c) => [
                    'code' => $c->code,
                    'name' => $c->name,
                    'permissions' => $c->permissionRequirements->map(fn ($r) => [
                        'id' => $r->id,
                        'permission' => $r->permission->name,
                        'type' => $r->requirement_type,
                        'group' => $r->requirement_group,
                    ])->toArray(),
                ])->toArray(),
            ])->toArray(),
            'components' => $module->components->whereNull('sub_module_id')->map(fn ($c) => [
                'code' => $c->code,
                'name' => $c->name,
                'permissions' => $c->permissionRequirements->map(fn ($r) => [
                    'id' => $r->id,
                    'permission' => $r->permission->name,
                    'type' => $r->requirement_type,
                    'group' => $r->requirement_group,
                ])->toArray(),
            ])->values()->toArray(),
        ];
    }

    /**
     * Clear all module-related caches
     */
    public function clearCache(): void
    {
        Cache::forget('module_permission_structure');

        // Clear user-specific caches
        $users = \App\Models\User::select('id')->get();
        foreach ($users as $user) {
            Cache::forget('user_accessible_modules_'.$user->id);
        }

        Module::clearCache();
    }

    /**
     * Get statistics about the module permission system
     */
    public function getStatistics(): array
    {
        return [
            'total_modules' => Module::count(),
            'active_modules' => Module::active()->count(),
            'total_sub_modules' => SubModule::count(),
            'active_sub_modules' => SubModule::active()->count(),
            'total_components' => ModuleComponent::count(),
            'active_components' => ModuleComponent::active()->count(),
            'total_requirements' => ModulePermission::count(),
            'active_requirements' => ModulePermission::active()->count(),
            'modules_by_category' => Module::active()
                ->selectRaw('category, COUNT(*) as count')
                ->groupBy('category')
                ->pluck('count', 'category')
                ->toArray(),
            'components_by_type' => ModuleComponent::active()
                ->selectRaw('type, COUNT(*) as count')
                ->groupBy('type')
                ->pluck('count', 'type')
                ->toArray(),
        ];
    }
}
