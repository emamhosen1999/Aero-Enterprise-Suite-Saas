<?php

declare(strict_types=1);

namespace Aero\Core\Contracts;

use Illuminate\Support\Collection;

/**
 * Employee Service Contract
 *
 * Defines the contract for employee-related operations across package boundaries.
 * HRM package implements this; Core package depends on it for notifications/access.
 *
 * This enables:
 * - Core to resolve employee data without importing HRM models
 * - Clean dependency inversion (Core ← Contract → HRM)
 * - Testability with mock implementations
 *
 * ARCHITECTURAL RULE: All methods use employee_id as the primary identifier.
 * user_id is only used for mapping purposes.
 */
interface EmployeeServiceContract
{
    /**
     * Get employee by employee ID.
     *
     * @return array|null Employee data as array (not model)
     */
    public function getById(int $employeeId): ?array;

    /**
     * Get employee by user ID.
     *
     * @return array|null Employee data as array (not model)
     */
    public function getByUserId(int $userId): ?array;

    /**
     * Get user_id for an employee_id.
     */
    public function getUserId(int $employeeId): ?int;

    /**
     * Get employee_id for a user_id.
     */
    public function getEmployeeId(int $userId): ?int;

    /**
     * Get employee's manager employee ID (not user ID).
     */
    public function getManagerEmployeeId(int $employeeId): ?int;

    /**
     * Get employee's department ID.
     */
    public function getDepartmentId(int $employeeId): ?int;

    /**
     * Get all employee IDs in a department.
     *
     * @return Collection<int> Employee IDs
     */
    public function getDepartmentEmployeeIds(int $departmentId): Collection;

    /**
     * Get all employee IDs reporting to a manager.
     *
     * @return Collection<int> Employee IDs
     */
    public function getDirectReportEmployeeIds(int $managerEmployeeId): Collection;

    /**
     * Get the reporting chain (all managers up to CEO).
     *
     * @return Collection<int> Employee IDs of all managers in chain
     */
    public function getReportingChainEmployeeIds(int $employeeId): Collection;

    /**
     * Check if an employee is active.
     */
    public function isActiveEmployee(int $employeeId): bool;

    /**
     * Get employee profile image URL.
     */
    public function getEmployeeProfileImageUrl(int $employeeId): ?string;

    /**
     * Get employee display name.
     */
    public function getEmployeeName(int $employeeId): ?string;

    /**
     * Batch resolve employee_ids to user_ids.
     *
     * @param Collection<int> $employeeIds
     * @return Collection<int, int> Map of employee_id => user_id
     */
    public function batchResolveUserIds(Collection $employeeIds): Collection;
}
