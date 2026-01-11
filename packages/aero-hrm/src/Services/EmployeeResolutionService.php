<?php

declare(strict_types=1);

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Exceptions\UserNotOnboardedException;
use Aero\HRM\Contracts\NotifiableUserInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;

/**
 * Employee Resolution Service
 *
 * Provides a clean abstraction layer for resolving Employees from Users.
 * This service enforces the domain rule: all HRM operations must go through Employee.
 *
 * Architecture Benefits:
 * - Package isolation: HRM doesn't depend on specific User implementation
 * - Single responsibility: centralized User → Employee mapping
 * - Testability: easy to mock in tests
 * - Performance: caching support
 */
class EmployeeResolutionService
{
    /**
     * Cache duration for employee lookups (5 minutes)
     */
    private const CACHE_TTL = 300;

    /**
     * Resolve Employee from user ID
     *
     * @param int $userId The user's ID
     * @param bool $withRelations Whether to eager load common relationships
     * @return Employee
     * @throws UserNotOnboardedException If user is not onboarded
     */
    public function resolveFromUserId(int $userId, bool $withRelations = true): Employee
    {
        $cacheKey = "hrm.employee.user_id.{$userId}";

        if ($withRelations) {
            $employee = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId) {
                return Employee::where('user_id', $userId)
                    ->with([
                        'department',
                        'designation',
                        'manager.department',
                        'manager.designation',
                        'user' => function ($query) {
                            $query->select('id', 'name', 'email', 'phone');
                        },
                    ])
                    ->first();
            });
        } else {
            $employee = Employee::where('user_id', $userId)->first();
        }

        if (! $employee) {
            throw new UserNotOnboardedException(
                "User ID {$userId} is not onboarded as an Employee. Access to HRM features is restricted."
            );
        }

        return $employee;
    }

    /**
     * Resolve Employee from authenticated request
     *
     * @param Request $request
     * @param bool $withRelations Whether to eager load relationships
     * @return Employee
     * @throws UserNotOnboardedException If user is not authenticated or not onboarded
     */
    public function resolveFromRequest(Request $request, bool $withRelations = true): Employee
    {
        $user = $request->user();

        if (! $user) {
            throw new UserNotOnboardedException('User must be authenticated to access HRM features');
        }

        return $this->resolveFromUserId($user->id, $withRelations);
    }

    /**
     * Check if a user is onboarded as an Employee
     *
     * @param int $userId
     * @return bool
     */
    public function hasEmployee(int $userId): bool
    {
        $cacheKey = "hrm.has_employee.user_id.{$userId}";

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($userId) {
            return Employee::where('user_id', $userId)->exists();
        });
    }

    /**
     * Resolve Employee or return null (safe resolution)
     *
     * @param int $userId
     * @param bool $withRelations
     * @return Employee|null
     */
    public function resolveOrNull(int $userId, bool $withRelations = false): ?Employee
    {
        try {
            return $this->resolveFromUserId($userId, $withRelations);
        } catch (UserNotOnboardedException) {
            return null;
        }
    }

    /**
     * Resolve multiple Employees from user IDs
     *
     * @param array<int> $userIds
     * @param bool $withRelations
     * @return \Illuminate\Database\Eloquent\Collection<Employee>
     */
    public function resolveBulk(array $userIds, bool $withRelations = false): \Illuminate\Database\Eloquent\Collection
    {
        $query = Employee::whereIn('user_id', $userIds);

        if ($withRelations) {
            $query->with(['department', 'designation', 'manager', 'user']);
        }

        return $query->get();
    }

    /**
     * Get NotifiableUserInterface for Employee
     *
     * Returns a facade that provides notification routing while
     * maintaining Employee as the domain aggregate root.
     *
     * @param Employee $employee
     * @return NotifiableUserInterface
     */
    public function getNotifiableUser(Employee $employee): NotifiableUserInterface
    {
        // Assuming Employee implements NotifiableUserInterface
        // or we wrap the user in an adapter
        return $employee->user;
    }

    /**
     * Clear cached employee data
     *
     * Call this after updating employee records to invalidate cache
     *
     * @param int $userId
     * @return void
     */
    public function clearCache(int $userId): void
    {
        Cache::forget("hrm.employee.user_id.{$userId}");
        Cache::forget("hrm.has_employee.user_id.{$userId}");
    }

    /**
     * Clear all employee caches (use sparingly)
     *
     * @return void
     */
    public function clearAllCaches(): void
    {
        // This would be better with tagged caching
        // For now, rely on TTL expiration
        Cache::flush(); // Consider more targeted approach in production
    }

    /**
     * Validate that Employee belongs to current tenant
     *
     * Important for multi-tenant systems
     *
     * @param Employee $employee
     * @return bool
     */
    public function belongsToCurrentTenant(Employee $employee): bool
    {
        // Implement tenant validation if using multi-tenancy
        // For now, assume single tenant or handled by global scopes
        return true;
    }

    /**
     * Get Employee by employee code
     *
     * @param string $employeeCode
     * @return Employee
     * @throws UserNotOnboardedException
     */
    public function resolveByEmployeeCode(string $employeeCode): Employee
    {
        $employee = Employee::where('employee_code', $employeeCode)
            ->with(['department', 'designation', 'user'])
            ->first();

        if (! $employee) {
            throw new UserNotOnboardedException(
                "Employee with code {$employeeCode} not found"
            );
        }

        return $employee;
    }

    /**
     * Get Employee statistics
     *
     * Useful for admin dashboards
     *
     * @return array
     */
    public function getStatistics(): array
    {
        return Cache::remember('hrm.employee_statistics', 3600, function () {
            return [
                'total' => Employee::count(),
                'active' => Employee::where('status', 'active')->count(),
                'on_probation' => Employee::whereNotNull('probation_end_date')
                    ->where('probation_end_date', '>', now())
                    ->count(),
                'by_department' => Employee::selectRaw('department_id, COUNT(*) as count')
                    ->groupBy('department_id')
                    ->get()
                    ->pluck('count', 'department_id')
                    ->toArray(),
            ];
        });
    }
}
