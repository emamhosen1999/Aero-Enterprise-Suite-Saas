<?php

declare(strict_types=1);

namespace Aero\Project\Contracts;

/**
 * EmployeeResolverContract
 *
 * Contract for creating/resolving employee data without directly importing HRM models.
 * Implemented by HRM package, consumed by Project package.
 *
 * ARCHITECTURAL RULE: Project package MUST NOT import Aero\HRM\Models\Employee.
 * Instead, use this contract to manage employee data via dependency injection.
 */
interface EmployeeResolverContract
{
    /**
     * Create an employee record for a user.
     *
     * @param int $userId
     * @param array{
     *     department_id?: int|null,
     *     designation_id?: int|null,
     *     date_of_joining?: string|null,
     *     status?: string,
     *     employment_type?: string
     * } $data
     * @return array{id: int, employee_code: string}|null
     */
    public function createEmployee(int $userId, array $data): ?array;

    /**
     * Get employee by user ID.
     *
     * @param int $userId
     * @return array{id: int, employee_code: string, department_id: ?int, designation_id: ?int}|null
     */
    public function getEmployeeByUserId(int $userId): ?array;

    /**
     * Check if employee exists for user.
     *
     * @param int $userId
     * @return bool
     */
    public function hasEmployee(int $userId): bool;

    /**
     * Generate a unique employee code.
     *
     * @return string
     */
    public function generateEmployeeCode(): string;
}
