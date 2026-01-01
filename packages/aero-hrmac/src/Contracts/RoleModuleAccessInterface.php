<?php

declare(strict_types=1);

namespace Aero\HRMAC\Contracts;

/**
 * Role Module Access Interface
 *
 * Defines the contract for role-based module access operations.
 * Implementations can target tenant or landlord databases.
 */
interface RoleModuleAccessInterface
{
    /**
     * Check if a role has access to a specific module by ID.
     */
    public function canAccessModule(mixed $role, int $moduleId): bool;

    /**
     * Check if a role has access to a specific sub-module by ID.
     */
    public function canAccessSubModule(mixed $role, int $subModuleId): bool;

    /**
     * Check if a role has access to a specific component by ID.
     */
    public function canAccessComponent(mixed $role, int $componentId): bool;

    /**
     * Check if a role has access to a specific action by ID.
     */
    public function canAccessAction(mixed $role, int $actionId): bool;

    /**
     * Check if a user (through their roles) can access a module by code.
     */
    public function userCanAccessModule(mixed $user, string $moduleCode): bool;

    /**
     * Check if a user (through their roles) can access a sub-module by codes.
     */
    public function userCanAccessSubModule(mixed $user, string $moduleCode, string $subModuleCode): bool;

    /**
     * Get the first accessible route for a user.
     */
    public function getFirstAccessibleRoute(mixed $user): ?string;

    /**
     * Get all accessible module IDs for a role.
     */
    public function getAccessibleModuleIds(mixed $role): array;

    /**
     * Get all accessible sub-module IDs for a user.
     */
    public function getUserAccessibleSubModuleIds(mixed $user): array;

    /**
     * Sync role access from UI selections.
     */
    public function syncRoleAccess(mixed $role, array $accessData): void;

    /**
     * Get the full access tree for a role.
     */
    public function getRoleAccessTree(mixed $role): array;

    /**
     * Clear cached access data for a role.
     */
    public function clearRoleCache(mixed $role): void;

    /**
     * Clear cached access data for a user.
     */
    public function clearUserCache(mixed $user): void;
}
