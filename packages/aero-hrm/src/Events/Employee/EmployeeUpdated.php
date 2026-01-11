<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * EmployeeUpdated Event
 *
 * Dispatched when an employee record is updated.
 *
 * Triggers:
 * - Change notification (if significant fields changed)
 * - Manager notification (if reporting changed)
 * - HR notification (if compensation/status changed)
 *
 * Significant Changes:
 * - Department/Designation change → EmployeePromoted event
 * - Status change (active → inactive) → EmployeeTerminated event
 * - Manager change → Manager notification
 * - Salary change → HR notification
 */
class EmployeeUpdated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Employee  $employee  The updated employee
     * @param  array  $changes  Array of changed attributes
     * @param  int|null  $updatedBy  User ID of the person who updated the employee
     */
    public function __construct(
        public Employee $employee,
        public array $changes = [],
        public ?int $updatedBy = null
    ) {}

    /**
     * Check if a specific field was changed.
     */
    public function hasChanged(string $field): bool
    {
        return array_key_exists($field, $this->changes);
    }

    /**
     * Get the old value of a changed field.
     */
    public function getOldValue(string $field)
    {
        return $this->changes[$field]['old'] ?? null;
    }

    /**
     * Get the new value of a changed field.
     */
    public function getNewValue(string $field)
    {
        return $this->changes[$field]['new'] ?? null;
    }
}
