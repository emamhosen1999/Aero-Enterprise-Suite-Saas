<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Events\BaseHrmEvent;
use Aero\HRM\Models\Employee;

/**
 * EmployeeUpdated Event
 *
 * Dispatched when an employee record is updated.
 *
 * Triggers:
 * - Change notification (if significant fields changed)
 * - Manager notification (if reporting changed)
 * - HR notification via HRMAC (if compensation/status changed)
 *
 * Significant Changes:
 * - Department/Designation change → EmployeePromoted event
 * - Status change (active → inactive) → EmployeeTerminated event
 * - Manager change → Manager notification
 * - Salary change → HR notification
 */
class EmployeeUpdated extends BaseHrmEvent
{
    public array $changes;

    /**
     * Create a new event instance.
     *
     * @param  Employee  $employee  The updated employee
     * @param  array  $changes  Array of changed attributes
     * @param  int|null  $updatedByEmployeeId  Employee ID of the person who updated
     */
    public function __construct(
        public Employee $employee,
        array $changes = [],
        ?int $updatedByEmployeeId = null,
        array $metadata = []
    ) {
        $this->changes = $changes;
        parent::__construct($updatedByEmployeeId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'employees';
    }

    public function getComponentCode(): ?string
    {
        return 'employee-records';
    }

    public function getActionCode(): string
    {
        return 'update';
    }

    public function getEntityId(): int
    {
        return $this->employee->id;
    }

    public function getEntityType(): string
    {
        return 'employee';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'employee_id' => $this->employee->id,
            'changed_fields' => array_keys($this->changes),
            'manager_employee_id' => $this->employee->manager_id,
            'department_id' => $this->employee->department_id,
        ]);
    }

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
    public function getOldValue(string $field): mixed
    {
        return $this->changes[$field]['old'] ?? null;
    }

    /**
     * Get the new value of a changed field.
     */
    public function getNewValue(string $field): mixed
    {
        return $this->changes[$field]['new'] ?? null;
    }
}
