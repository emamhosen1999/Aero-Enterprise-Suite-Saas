<?php

declare(strict_types=1);

namespace Aero\Project\Contracts;

use Illuminate\Support\Collection;

/**
 * DepartmentResolverContract
 *
 * Contract for resolving department data without directly importing HRM Department model.
 * Implemented by HRM package, consumed by Project package.
 *
 * ARCHITECTURAL RULE: Project package MUST NOT import Aero\HRM\Models\Department.
 * Instead, use this contract to resolve department data via dependency injection.
 */
interface DepartmentResolverContract
{
    /**
     * Get department by ID.
     *
     * @return array{id: int, name: string, code: ?string, parent_id: ?int}|null
     */
    public function getDepartmentById(int $departmentId): ?array;

    /**
     * Get all active departments (for dropdowns).
     *
     * @return Collection<int, array{id: int, name: string, code: ?string}>
     */
    public function getAllActiveDepartments(): Collection;

    /**
     * Get departments as hierarchical tree.
     */
    public function getDepartmentTree(): Collection;
}
