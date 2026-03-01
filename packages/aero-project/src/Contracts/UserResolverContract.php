<?php

declare(strict_types=1);

namespace Aero\Project\Contracts;

use Illuminate\Support\Collection;

/**
 * UserResolverContract
 *
 * Contract for resolving user data without directly importing Core User model.
 * Implemented by Core package, consumed by Project package.
 *
 * ARCHITECTURAL RULE: Project package MUST NOT import Aero\Core\Models\User.
 * Instead, use this contract to resolve user data via dependency injection.
 */
interface UserResolverContract
{
    /**
     * Get user basic info by ID.
     *
     * @return array{id: int, name: string, email: string, avatar_url: ?string}|null
     */
    public function getUserById(int $userId): ?array;

    /**
     * Get multiple users by IDs.
     *
     * @param  array<int>  $userIds
     * @return Collection<int, array{id: int, name: string, email: string, avatar_url: ?string}>
     */
    public function getUsersByIds(array $userIds): Collection;

    /**
     * Get all active users (for dropdowns).
     *
     * @param  array<string>|null  $columns  Optional columns to select
     * @return Collection<int, array{id: int, name: string, email: string}>
     */
    public function getAllActiveUsers(?array $columns = null): Collection;

    /**
     * Get users excluding specific IDs.
     *
     * @param  array<int>  $excludeIds
     * @param  array<string>|null  $columns  Optional columns to select
     */
    public function getUsersExcluding(array $excludeIds, ?array $columns = null): Collection;

    /**
     * Search users by name or email.
     *
     * @return Collection<int, array{id: int, name: string, email: string}>
     */
    public function searchUsers(string $query, int $limit = 10): Collection;

    /**
     * Get user by ID as notifiable (for sending notifications).
     *
     * @return object|null The User model instance (as object to avoid type hint)
     */
    public function getNotifiable(int $userId): ?object;

    /**
     * Get multiple users as notifiables.
     *
     * @param  array<int>  $userIds
     * @return Collection Collection of User model instances
     */
    public function getNotifiables(array $userIds): Collection;
}
