<?php

declare(strict_types=1);

namespace Aero\Project\Adapters;

use Aero\Project\Contracts\UserResolverContract;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * UserResolverAdapter
 *
 * Default implementation that queries the users table directly.
 * This adapter can be replaced by Core package for richer functionality.
 *
 * ARCHITECTURAL PRINCIPLE: This adapter queries the database table
 * for basic user info. For notifications, it falls back to finding
 * the User model via app container to avoid direct imports.
 */
class UserResolverAdapter implements UserResolverContract
{
    /**
     * The database table name for users.
     */
    protected string $table = 'users';

    /**
     * Get user basic info by ID.
     */
    public function getUserById(int $userId): ?array
    {
        $user = DB::table($this->table)
            ->where('id', $userId)
            ->first(['id', 'name', 'email', 'avatar']);

        if (! $user) {
            return null;
        }

        return [
            'id' => (int) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ?? null,
        ];
    }

    /**
     * Get multiple users by IDs.
     */
    public function getUsersByIds(array $userIds): Collection
    {
        if (empty($userIds)) {
            return collect();
        }

        return DB::table($this->table)
            ->whereIn('id', $userIds)
            ->get(['id', 'name', 'email', 'avatar'])
            ->map(fn ($user) => [
                'id' => (int) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar ?? null,
            ]);
    }

    /**
     * Get all active users (for dropdowns).
     */
    public function getAllActiveUsers(?array $columns = null): Collection
    {
        $selectColumns = $columns ?? ['id', 'name', 'email'];

        return DB::table($this->table)
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->orderBy('name')
            ->get($selectColumns)
            ->map(function ($user) use ($selectColumns) {
                $result = ['id' => (int) $user->id];
                foreach ($selectColumns as $col) {
                    if ($col !== 'id') {
                        $result[$col] = $user->{$col} ?? null;
                    }
                }

                return $result;
            });
    }

    /**
     * Get users excluding specific IDs.
     */
    public function getUsersExcluding(array $excludeIds, ?array $columns = null): Collection
    {
        $selectColumns = $columns ?? ['id', 'name', 'email'];

        $query = DB::table($this->table)
            ->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->orderBy('name');

        if (! empty($excludeIds)) {
            $query->whereNotIn('id', $excludeIds);
        }

        return $query->get($selectColumns)
            ->map(function ($user) use ($selectColumns) {
                $result = ['id' => (int) $user->id];
                foreach ($selectColumns as $col) {
                    if ($col !== 'id') {
                        $result[$col] = $user->{$col} ?? null;
                    }
                }

                return $result;
            });
    }

    /**
     * Search users by name or email.
     */
    public function searchUsers(string $query, int $limit = 10): Collection
    {
        return DB::table($this->table)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%");
            })
            ->where(function ($q) {
                $q->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->limit($limit)
            ->get(['id', 'name', 'email'])
            ->map(fn ($user) => [
                'id' => (int) $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]);
    }

    /**
     * Get user by ID as notifiable (for sending notifications).
     *
     * Uses app container to resolve User model dynamically.
     */
    public function getNotifiable(int $userId): ?object
    {
        // Try to resolve the User model from the container
        $userClass = $this->resolveUserClass();

        if (! $userClass) {
            return null;
        }

        return $userClass::find($userId);
    }

    /**
     * Get multiple users as notifiables.
     */
    public function getNotifiables(array $userIds): Collection
    {
        if (empty($userIds)) {
            return collect();
        }

        $userClass = $this->resolveUserClass();

        if (! $userClass) {
            return collect();
        }

        return $userClass::whereIn('id', $userIds)->get();
    }

    /**
     * Resolve the User model class from container or known locations.
     */
    protected function resolveUserClass(): ?string
    {
        // Check if Core package User is available
        if (class_exists('Aero\Core\Models\User')) {
            return 'Aero\Core\Models\User';
        }

        // Check standard Laravel User model
        if (class_exists('App\Models\User')) {
            return 'App\Models\User';
        }

        // Check legacy User model location
        if (class_exists('App\User')) {
            return 'App\User';
        }

        return null;
    }
}
