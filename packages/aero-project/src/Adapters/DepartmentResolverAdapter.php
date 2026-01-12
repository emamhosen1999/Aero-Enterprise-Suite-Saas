<?php

declare(strict_types=1);

namespace Aero\Project\Adapters;

use Aero\Project\Contracts\DepartmentResolverContract;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * DepartmentResolverAdapter
 *
 * Default implementation that queries the departments table directly.
 * This adapter can be replaced by HRM package if it's installed.
 *
 * ARCHITECTURAL PRINCIPLE: This adapter queries the database table,
 * NOT the HRM Department model. This maintains package isolation.
 */
class DepartmentResolverAdapter implements DepartmentResolverContract
{
    /**
     * The database table name for departments.
     */
    protected string $table = 'departments';

    /**
     * Get department by ID.
     */
    public function getDepartmentById(int $departmentId): ?array
    {
        $department = DB::table($this->table)
            ->where('id', $departmentId)
            ->first(['id', 'name', 'code', 'parent_id']);

        if (! $department) {
            return null;
        }

        return [
            'id' => (int) $department->id,
            'name' => $department->name,
            'code' => $department->code ?? null,
            'parent_id' => $department->parent_id ? (int) $department->parent_id : null,
        ];
    }

    /**
     * Get all active departments (for dropdowns).
     */
    public function getAllActiveDepartments(): Collection
    {
        return DB::table($this->table)
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'code'])
            ->map(fn ($dept) => [
                'id' => (int) $dept->id,
                'name' => $dept->name,
                'code' => $dept->code ?? null,
            ]);
    }

    /**
     * Get departments as hierarchical tree.
     */
    public function getDepartmentTree(): Collection
    {
        $departments = DB::table($this->table)
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhereNull('status');
            })
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'parent_id']);

        return $this->buildTree($departments);
    }

    /**
     * Build a hierarchical tree from flat department list.
     */
    protected function buildTree(Collection $departments, ?int $parentId = null): Collection
    {
        return $departments
            ->filter(fn ($dept) => $dept->parent_id === $parentId)
            ->map(function ($dept) use ($departments) {
                return [
                    'id' => (int) $dept->id,
                    'name' => $dept->name,
                    'code' => $dept->code ?? null,
                    'parent_id' => $dept->parent_id ? (int) $dept->parent_id : null,
                    'children' => $this->buildTree($departments, (int) $dept->id)->values()->all(),
                ];
            })
            ->values();
    }
}
