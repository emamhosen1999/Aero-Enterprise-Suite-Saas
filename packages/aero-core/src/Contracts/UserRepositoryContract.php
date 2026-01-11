<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

use Illuminate\Support\Collection;

/**
 * UserRepositoryContract Interface
 *
 * Provides query methods for user data across package boundaries.
 * This allows modules (like HRM) to query users without directly
 * coupling to the User model implementation.
 *
 * Purpose:
 * - Decouple user queries from concrete User model
 * - Enable dependency injection for better testability
 * - Support clean architecture and package boundaries
 *
 * @package Aero\Core\Contracts
 */
interface UserRepositoryContract
{
    /**
     * Find a user by ID.
     */
    public function find(int $id): ?UserContract;

    /**
     * Find a user by email.
     */
    public function findByEmail(string $email): ?UserContract;

    /**
     * Get all active users.
     */
    public function findActive(): Collection;

    /**
     * Find users by role names.
     *
     * @param  array<string>  $roles
     */
    public function findByRoles(array $roles): Collection;

    /**
     * Find users in a specific department.
     */
    public function findByDepartment(int $departmentId): Collection;

    /**
     * Get users who are managers (have report_to relationships).
     */
    public function findManagers(): Collection;

    /**
     * Find HR users (HR Manager, HR Admin roles).
     */
    public function findHRUsers(): Collection;

    /**
     * Find safety officers/team members.
     */
    public function findSafetyTeam(): Collection;

    /**
     * Get the user model class name (for relationship definitions).
     */
    public function getModelClass(): string;

    /**
     * Create a new query builder for users.
     * Returns an Eloquent builder that can be further customized.
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function query(): mixed;
}
