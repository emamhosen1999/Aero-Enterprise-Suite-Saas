<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Module;

use Aero\HRMAC\Services\RoleModuleAccessService;

/**
 * Null Object implementation of RoleModuleAccessService.
 *
 * Used as a pre-installation stub to satisfy type hints throughout the
 * application without making any database queries. All methods return
 * safe "deny-all / empty" defaults.
 *
 * Extends the concrete RoleModuleAccessService so that PHP type checks
 * (e.g. ModuleController::__construct) are satisfied at boot time before
 * the application is fully installed and a real DB connection is available.
 */
class NullRoleModuleAccessService extends RoleModuleAccessService
{
    public function canAccessModule(mixed $role, int $moduleId): bool
    {
        return false;
    }

    public function canAccessSubModule(mixed $role, int $subModuleId): bool
    {
        return false;
    }

    public function canAccessComponent(mixed $role, int $componentId): bool
    {
        return false;
    }

    public function canAccessAction(mixed $role, int $actionId): bool
    {
        return false;
    }

    public function userCanAccessModule(mixed $user, string $moduleCode): bool
    {
        return false;
    }

    public function userCanAccessSubModule(mixed $user, string $moduleCode, string $subModuleCode): bool
    {
        return false;
    }

    public function userCanAccessAction(mixed $user, string $moduleCode, string $subModuleCode, string $actionCode): bool
    {
        return false;
    }

    public function getFirstAccessibleRoute(mixed $user): ?string
    {
        return null;
    }

    public function getAccessibleModuleIds(mixed $role): array
    {
        return [];
    }

    public function getUserAccessibleSubModuleIds(mixed $user): array
    {
        return [];
    }

    public function syncRoleAccess(mixed $role, array $accessData): void
    {
        // No-op before installation
    }

    public function getRoleAccessTree(mixed $role): array
    {
        return [
            'modules' => [],
            'sub_modules' => [],
            'components' => [],
            'actions' => [],
        ];
    }

    public function clearRoleCache(mixed $role): void
    {
        // No-op before installation
    }

    public function clearUserCache(mixed $user): void
    {
        // No-op before installation
    }

    public function getUsersWithSubModuleAccess(string $moduleCode, string $subModuleCode, ?string $actionCode = null): \Illuminate\Support\Collection
    {
        return collect();
    }

    public function getUsersWithActionAccess(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): \Illuminate\Support\Collection
    {
        return collect();
    }
}
