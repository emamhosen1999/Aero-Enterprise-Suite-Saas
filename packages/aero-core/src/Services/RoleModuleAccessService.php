<?php

namespace Aero\Core\Services;

use Aero\Core\Models\Action;
use Aero\Core\Models\Component;
use Aero\Core\Models\Module;
use Aero\Core\Models\SubModule;
use Closure;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Role Module Access Service
 *
 * Manages role-based module access assignments.
 * Syncs role permissions with module hierarchy.
 */
class RoleModuleAccessService
{
    /**
     * Check if the cache store supports tagging.
     */
    protected function cacheSupportsTagging(): bool
    {
        try {
            $driver = config('cache.default');
            $store = config("cache.stores.{$driver}.driver");

            // Only redis, memcached, and dynamodb support tagging
            return in_array($store, ['redis', 'memcached', 'dynamodb']);
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Cache with tags if supported, otherwise fall back to regular cache.
     *
     * @param  array<string>  $tags
     */
    protected function rememberWithOptionalTags(array $tags, string $key, int $ttl, Closure $callback): mixed
    {
        if ($this->cacheSupportsTagging()) {
            return Cache::tags($tags)->remember($key, $ttl, $callback);
        }

        // Prefix the key with tags for manual grouping when tagging is not supported
        $prefixedKey = 'role_access.' . implode('.', $tags) . '.' . $key;

        return Cache::remember($prefixedKey, $ttl, $callback);
    }

    /**
     * Flush cache by tags if supported, otherwise no-op for non-tagging stores.
     *
     * @param  array<string>  $tags
     */
    protected function flushWithOptionalTags(array $tags): void
    {
        if ($this->cacheSupportsTagging()) {
            Cache::tags($tags)->flush();

            return;
        }

        // For non-tagging cache stores, we can't selectively flush by tags
        // The cache will naturally expire, or use Cache::flush() to clear all
    }

    /**
     * Get complete access tree for a role.
     */
    public function getRoleAccessTree(Role $role): array
    {
        $cacheKey = "role.{$role->id}.access_tree";

        return $this->rememberWithOptionalTags(['role-access', "role-{$role->id}"], $cacheKey, 3600, function () use ($role) {
            $permissions = $role->permissions()->pluck('name')->toArray();

            return [
                'modules' => $this->getModuleAccess($permissions),
                'sub_modules' => $this->getSubModuleAccess($permissions),
                'components' => $this->getComponentAccess($permissions),
                'actions' => $this->getActionAccess($permissions),
            ];
        });
    }

    /**
     * Assign module access to role.
     */
    public function assignModuleAccess(Role $role, string $moduleCode): bool
    {
        $module = Module::where('code', $moduleCode)->first();
        if (! $module) {
            return false;
        }

        $permission = $this->ensurePermission("module.{$moduleCode}");
        $role->givePermissionTo($permission);

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Revoke module access from role.
     */
    public function revokeModuleAccess(Role $role, string $moduleCode): bool
    {
        $permission = Permission::where('name', "module.{$moduleCode}")->first();
        if ($permission) {
            $role->revokePermissionTo($permission);
        }

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Assign sub-module access to role.
     */
    public function assignSubModuleAccess(Role $role, string $moduleCode, string $subModuleCode): bool
    {
        // First ensure module access
        $this->assignModuleAccess($role, $moduleCode);

        $permission = $this->ensurePermission("submodule.{$moduleCode}.{$subModuleCode}");
        $role->givePermissionTo($permission);

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Assign component access to role.
     */
    public function assignComponentAccess(Role $role, string $moduleCode, string $subModuleCode, string $componentCode): bool
    {
        // First ensure sub-module access
        $this->assignSubModuleAccess($role, $moduleCode, $subModuleCode);

        $permission = $this->ensurePermission("component.{$moduleCode}.{$subModuleCode}.{$componentCode}");
        $role->givePermissionTo($permission);

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Assign action access to role.
     */
    public function assignActionAccess(Role $role, string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): bool
    {
        // First ensure component access
        $this->assignComponentAccess($role, $moduleCode, $subModuleCode, $componentCode);

        $permission = $this->ensurePermission("action.{$moduleCode}.{$subModuleCode}.{$componentCode}.{$actionCode}");
        $role->givePermissionTo($permission);

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Sync role access from array structure.
     */
    public function syncRoleAccess(Role $role, array $accessData): bool
    {
        $permissions = [];

        // Add module permissions
        foreach ($accessData['modules'] ?? [] as $moduleCode) {
            $permissions[] = "module.{$moduleCode}";
        }

        // Add sub-module permissions
        foreach ($accessData['sub_modules'] ?? [] as $item) {
            $permissions[] = "submodule.{$item['module']}.{$item['sub_module']}";
        }

        // Add component permissions
        foreach ($accessData['components'] ?? [] as $item) {
            $permissions[] = "component.{$item['module']}.{$item['sub_module']}.{$item['component']}";
        }

        // Add action permissions
        foreach ($accessData['actions'] ?? [] as $item) {
            $permissions[] = "action.{$item['module']}.{$item['sub_module']}.{$item['component']}.{$item['action']}";
        }

        // Ensure all permissions exist
        $permissionModels = [];
        foreach ($permissions as $permissionName) {
            $permissionModels[] = $this->ensurePermission($permissionName);
        }

        // Sync permissions to role
        $role->syncPermissions($permissionModels);

        $this->clearRoleCache($role);

        return true;
    }

    /**
     * Clear role's access cache.
     */
    public function clearRoleCache(Role $role): void
    {
        $this->flushWithOptionalTags(["role-{$role->id}"]);

        // Also clear cache for all users with this role
        foreach ($role->users as $user) {
            $this->flushWithOptionalTags(["user-{$user->id}"]);
        }
    }

    /**
     * Ensure permission exists, create if not.
     */
    protected function ensurePermission(string $permissionName): Permission
    {
        return Permission::firstOrCreate(
            ['name' => $permissionName],
            ['guard_name' => 'web']
        );
    }

    /**
     * Extract module access from permissions.
     */
    protected function getModuleAccess(array $permissions): array
    {
        return collect($permissions)
            ->filter(fn ($p) => str_starts_with($p, 'module.'))
            ->map(fn ($p) => str_replace('module.', '', $p))
            ->values()
            ->toArray();
    }

    /**
     * Extract sub-module access from permissions.
     */
    protected function getSubModuleAccess(array $permissions): array
    {
        return collect($permissions)
            ->filter(fn ($p) => str_starts_with($p, 'submodule.'))
            ->map(function ($p) {
                $parts = explode('.', str_replace('submodule.', '', $p));

                return [
                    'module' => $parts[0] ?? null,
                    'sub_module' => $parts[1] ?? null,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Extract component access from permissions.
     */
    protected function getComponentAccess(array $permissions): array
    {
        return collect($permissions)
            ->filter(fn ($p) => str_starts_with($p, 'component.'))
            ->map(function ($p) {
                $parts = explode('.', str_replace('component.', '', $p));

                return [
                    'module' => $parts[0] ?? null,
                    'sub_module' => $parts[1] ?? null,
                    'component' => $parts[2] ?? null,
                ];
            })
            ->values()
            ->toArray();
    }

    /**
     * Extract action access from permissions.
     */
    protected function getActionAccess(array $permissions): array
    {
        return collect($permissions)
            ->filter(fn ($p) => str_starts_with($p, 'action.'))
            ->map(function ($p) {
                $parts = explode('.', str_replace('action.', '', $p));

                return [
                    'module' => $parts[0] ?? null,
                    'sub_module' => $parts[1] ?? null,
                    'component' => $parts[2] ?? null,
                    'action' => $parts[3] ?? null,
                ];
            })
            ->values()
            ->toArray();
    }
}
